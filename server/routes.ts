import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertCustomerSchema, insertLicenseImageSchema, insertScanSessionSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get today's stats
  app.get("/api/stats/today", async (req, res) => {
    try {
      const stats = await storage.getTodayStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get recent customers
  app.get("/api/customers/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const customers = await storage.getRecentCustomers(limit);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent customers" });
    }
  });

  // Get specific customer
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Create customer
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Check if license number already exists
      const existing = await storage.getCustomerByLicenseNumber(validatedData.licenseNumber);
      if (existing) {
        return res.status(400).json({ message: "License number already exists" });
      }
      
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Update customer
  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      
      const customer = await storage.updateCustomer(id, validatedData);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Upload license images
  app.post("/api/upload/license", upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.front && !files.back) {
        return res.status(400).json({ message: "At least one image is required" });
      }

      const result = {
        frontImagePath: files.front ? files.front[0].filename : null,
        backImagePath: files.back ? files.back[0].filename : null,
      };

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  // Create license image record
  app.post("/api/license-images", async (req, res) => {
    try {
      const validatedData = insertLicenseImageSchema.parse(req.body);
      const licenseImage = await storage.createLicenseImage(validatedData);
      res.status(201).json(licenseImage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create license image record" });
    }
  });

  // Get license images for customer
  app.get("/api/customers/:id/images", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const images = await storage.getLicenseImagesByCustomerId(customerId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch license images" });
    }
  });

  // Create scan session
  app.post("/api/scan-sessions", async (req, res) => {
    try {
      const validatedData = insertScanSessionSchema.parse(req.body);
      const scanSession = await storage.createScanSession(validatedData);
      res.status(201).json(scanSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scan session" });
    }
  });

  // Update scan session
  app.put("/api/scan-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertScanSessionSchema.partial().parse(req.body);
      
      const scanSession = await storage.updateScanSession(id, validatedData);
      
      if (!scanSession) {
        return res.status(404).json({ message: "Scan session not found" });
      }
      
      res.json(scanSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update scan session" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
