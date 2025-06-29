import { customers, licenseImages, scanSessions, type Customer, type InsertCustomer, type LicenseImage, type InsertLicenseImage, type ScanSession, type InsertScanSession } from "@shared/schema";

export interface IStorage {
  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByLicenseNumber(licenseNumber: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  getRecentCustomers(limit?: number): Promise<Customer[]>;
  
  // License image operations
  createLicenseImage(licenseImage: InsertLicenseImage): Promise<LicenseImage>;
  getLicenseImagesByCustomerId(customerId: number): Promise<LicenseImage[]>;
  
  // Scan session operations
  createScanSession(scanSession: InsertScanSession): Promise<ScanSession>;
  updateScanSession(id: number, scanSession: Partial<InsertScanSession>): Promise<ScanSession | undefined>;
  getScanSessionsByCustomerId(customerId: number): Promise<ScanSession[]>;
  getTodayStats(): Promise<{ scanned: number; failed: number; newCustomers: number }>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer>;
  private licenseImages: Map<number, LicenseImage>;
  private scanSessions: Map<number, ScanSession>;
  private currentCustomerId: number;
  private currentLicenseImageId: number;
  private currentScanSessionId: number;

  constructor() {
    this.customers = new Map();
    this.licenseImages = new Map();
    this.scanSessions = new Map();
    this.currentCustomerId = 1;
    this.currentLicenseImageId = 1;
    this.currentScanSessionId = 1;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByLicenseNumber(licenseNumber: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.licenseNumber === licenseNumber,
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const now = new Date();
    const customer: Customer = { 
      ...insertCustomer, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated: Customer = {
      ...existing,
      ...updateData,
      updatedAt: new Date()
    };
    this.customers.set(id, updated);
    return updated;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getRecentCustomers(limit = 10): Promise<Customer[]> {
    return Array.from(this.customers.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createLicenseImage(insertLicenseImage: InsertLicenseImage): Promise<LicenseImage> {
    const id = this.currentLicenseImageId++;
    const licenseImage: LicenseImage = {
      ...insertLicenseImage,
      id,
      createdAt: new Date()
    };
    this.licenseImages.set(id, licenseImage);
    return licenseImage;
  }

  async getLicenseImagesByCustomerId(customerId: number): Promise<LicenseImage[]> {
    return Array.from(this.licenseImages.values()).filter(
      (image) => image.customerId === customerId
    );
  }

  async createScanSession(insertScanSession: InsertScanSession): Promise<ScanSession> {
    const id = this.currentScanSessionId++;
    const scanSession: ScanSession = {
      ...insertScanSession,
      id,
      scanDate: new Date()
    };
    this.scanSessions.set(id, scanSession);
    return scanSession;
  }

  async updateScanSession(id: number, updateData: Partial<InsertScanSession>): Promise<ScanSession | undefined> {
    const existing = this.scanSessions.get(id);
    if (!existing) return undefined;
    
    const updated: ScanSession = {
      ...existing,
      ...updateData
    };
    this.scanSessions.set(id, updated);
    return updated;
  }

  async getScanSessionsByCustomerId(customerId: number): Promise<ScanSession[]> {
    return Array.from(this.scanSessions.values()).filter(
      (session) => session.customerId === customerId
    );
  }

  async getTodayStats(): Promise<{ scanned: number; failed: number; newCustomers: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayScans = Array.from(this.scanSessions.values()).filter(
      (session) => new Date(session.scanDate!).getTime() >= today.getTime()
    );
    
    const todayCustomers = Array.from(this.customers.values()).filter(
      (customer) => new Date(customer.createdAt!).getTime() >= today.getTime()
    );
    
    return {
      scanned: todayScans.filter(s => s.status === 'complete').length,
      failed: todayScans.filter(s => s.status === 'failed').length,
      newCustomers: todayCustomers.length
    };
  }
}

export const storage = new MemStorage();
