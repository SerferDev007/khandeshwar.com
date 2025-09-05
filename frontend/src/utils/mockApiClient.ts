/**
 * Mock API client for development/testing when backend is not available
 */

import { mockShops, mockTenants, mockAgreements, mockLoans, mockPenalties, mockUser, mockToken } from './mockData';
import type { Shop, Tenant, Agreement, Loan, RentPenalty } from '../types';

class MockApiClient {
  private token: string | null = null;
  private data = {
    shops: [...mockShops],
    tenants: [...mockTenants], 
    agreements: [...mockAgreements],
    loans: [...mockLoans],
    penalties: [...mockPenalties]
  };

  private generateId(): string {
    return Date.now().toString();
  }

  private delay(ms = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  getAuthToken(): string | null {
    return this.token;
  }

  // Auth methods
  async login(email: string, password: string) {
    await this.delay();
    if (email === 'admin@example.com' && password === 'admin123') {
      this.setAuthToken(mockToken);
      return {
        success: true,
        data: {
          user: mockUser,
          accessToken: mockToken
        }
      };
    } else {
      throw new Error('Invalid credentials');
    }
  }

  async getProfile() {
    await this.delay(100);
    if (!this.token) {
      throw new Error('Unauthorized');
    }
    return mockUser;
  }

  async logout() {
    await this.delay(100);
    this.setAuthToken(null);
    return { success: true };
  }

  // Shop methods
  async getShops() {
    await this.delay();
    return this.data.shops;
  }

  async createShop(shopData: Omit<Shop, 'id' | 'createdAt'>) {
    await this.delay();
    const newShop: Shop = {
      ...shopData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this.data.shops.push(newShop);
    return newShop;
  }

  async updateShop(id: string, updates: Partial<Shop>) {
    await this.delay();
    const index = this.data.shops.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Shop not found');
    
    this.data.shops[index] = { ...this.data.shops[index], ...updates };
    return this.data.shops[index];
  }

  async deleteShop(id: string) {
    await this.delay();
    const index = this.data.shops.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Shop not found');
    
    this.data.shops.splice(index, 1);
  }

  // Tenant methods
  async getTenants() {
    await this.delay();
    return this.data.tenants;
  }

  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt'>) {
    await this.delay();
    const newTenant: Tenant = {
      ...tenantData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this.data.tenants.push(newTenant);
    return newTenant;
  }

  async updateTenant(id: string, updates: Partial<Tenant>) {
    await this.delay();
    const index = this.data.tenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tenant not found');
    
    this.data.tenants[index] = { ...this.data.tenants[index], ...updates };
    return this.data.tenants[index];
  }

  async deleteTenant(id: string) {
    await this.delay();
    const index = this.data.tenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tenant not found');
    
    this.data.tenants.splice(index, 1);
  }

  // Agreement methods
  async getAgreements() {
    await this.delay();
    return this.data.agreements;
  }

  async createAgreement(agreementData: Omit<Agreement, 'id' | 'createdAt' | 'nextDueDate'>) {
    await this.delay();
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    
    const newAgreement: Agreement = {
      ...agreementData,
      id: this.generateId(),
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    this.data.agreements.push(newAgreement);
    
    // Update shop status to occupied
    const shop = this.data.shops.find(s => s.id === agreementData.shopId);
    if (shop) {
      shop.status = 'Occupied';
      shop.tenantId = agreementData.tenantId;
      shop.agreementId = newAgreement.id;
    }
    
    return newAgreement;
  }

  async updateAgreement(id: string, updates: Partial<Agreement>) {
    await this.delay();
    const index = this.data.agreements.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Agreement not found');
    
    this.data.agreements[index] = { ...this.data.agreements[index], ...updates };
    return this.data.agreements[index];
  }

  async deleteAgreement(id: string) {
    await this.delay();
    const index = this.data.agreements.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Agreement not found');
    
    const agreement = this.data.agreements[index];
    
    // Update shop status back to vacant
    const shop = this.data.shops.find(s => s.id === agreement.shopId);
    if (shop) {
      shop.status = 'Vacant';
      shop.tenantId = undefined;
      shop.agreementId = undefined;
    }
    
    this.data.agreements.splice(index, 1);
  }

  // Loan methods
  async getLoans() {
    await this.delay();
    return this.data.loans;
  }

  async createLoan(loanData: Omit<Loan, 'id' | 'createdAt'>) {
    await this.delay();
    const newLoan: Loan = {
      ...loanData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this.data.loans.push(newLoan);
    return newLoan;
  }

  async updateLoan(id: string, updates: Partial<Loan>) {
    await this.delay();
    const index = this.data.loans.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Loan not found');
    
    this.data.loans[index] = { ...this.data.loans[index], ...updates };
    return this.data.loans[index];
  }

  async deleteLoan(id: string) {
    await this.delay();
    const index = this.data.loans.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Loan not found');
    
    this.data.loans.splice(index, 1);
  }

  // Rent Payment method
  async createRentPayment(paymentData: any) {
    await this.delay();
    return {
      id: this.generateId(),
      ...paymentData,
      createdAt: new Date().toISOString()
    };
  }

  // Other required methods with basic implementations
  async getRentPenalties() {
    await this.delay();
    return this.data.penalties;
  }

  async createRentPenalty(penaltyData: any) {
    await this.delay();
    const newPenalty = {
      ...penaltyData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this.data.penalties.push(newPenalty);
    return newPenalty;
  }

  async updateRentPenalty(id: string, updates: any) {
    await this.delay();
    const index = this.data.penalties.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Penalty not found');
    
    this.data.penalties[index] = { ...this.data.penalties[index], ...updates };
    return this.data.penalties[index];
  }

  // Placeholder methods for other endpoints
  async getTransactions() { return []; }
  async createTransaction(data: any) { return data; }
  async getDonations() { return []; }
  async getExpenses() { return []; }
  async getUsers() { return [mockUser]; }

  // Donations preview receipt number
  async getNextDonationReceiptNumber() {
    await this.delay();
    // Generate a mock receipt number (incrementing for realism)
    const baseNumber = 1000 + Math.floor(Math.random() * 9000); // Random 4-digit number
    const receiptNumber = baseNumber.toString().padStart(4, '0');
    
    return {
      success: true,
      data: {
        receiptNumber: receiptNumber
      }
    };
  }
}

export default MockApiClient;