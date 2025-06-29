import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  dateOfBirth: date("date_of_birth").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  licenseState: text("license_state").notNull(),
  licenseExpiration: date("license_expiration").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  profilePhotoPath: text("profile_photo_path"),
  signaturePath: text("signature_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const licenseImages = pgTable("license_images", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  frontImagePath: text("front_image_path"),
  backImagePath: text("back_image_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scanSessions = pgTable("scan_sessions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  scanDate: timestamp("scan_date").defaultNow(),
  status: text("status").notNull(), // 'complete', 'processing', 'failed'
  errorMessage: text("error_message"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseImageSchema = createInsertSchema(licenseImages).omit({
  id: true,
  createdAt: true,
});

export const insertScanSessionSchema = createInsertSchema(scanSessions).omit({
  id: true,
  scanDate: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type LicenseImage = typeof licenseImages.$inferSelect;
export type InsertLicenseImage = z.infer<typeof insertLicenseImageSchema>;
export type ScanSession = typeof scanSessions.$inferSelect;
export type InsertScanSession = z.infer<typeof insertScanSessionSchema>;
