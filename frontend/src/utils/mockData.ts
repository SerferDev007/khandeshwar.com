/**
 * Mock data for testing rent management functionality
 * when backend is not available
 */

import type { Shop, Tenant, Agreement, Loan, RentPenalty } from '../types';

export const mockShops: Shop[] = [
  {
    id: '1',
    shopNumber: 'S001',
    size: 200,
    monthlyRent: 5000,
    deposit: 10000,
    status: 'Occupied',
    tenantId: '1',
    agreementId: '1',
    createdAt: '2024-01-01T00:00:00.000Z',
    description: 'Ground floor shop'
  },
  {
    id: '2',
    shopNumber: 'S002',
    size: 150,
    monthlyRent: 4000,
    deposit: 8000,
    status: 'Vacant',
    createdAt: '2024-01-01T00:00:00.000Z',
    description: 'First floor shop'
  }
];

export const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    address: '123 Main St, Kusalamb',
    businessType: 'General Store',
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'Active',
    idProof: 'AADHAAR123456789'
  }
];

export const mockAgreements: Agreement[] = [
  {
    id: '1',
    shopId: '1',
    tenantId: '1',
    agreementDate: '2024-01-01',
    duration: 12,
    monthlyRent: 5000,
    securityDeposit: 10000,
    advanceRent: 5000,
    agreementType: 'Commercial',
    status: 'Active',
    nextDueDate: '2024-02-01',
    lastPaymentDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

export const mockLoans: Loan[] = [
  {
    id: '1',
    tenantId: '1',
    tenantName: 'Rajesh Kumar',
    agreementId: '1',
    loanAmount: 50000,
    interestRate: 1,
    disbursedDate: '2024-01-01',
    loanDuration: 12,
    monthlyEmi: 4348,
    outstandingBalance: 45000,
    totalRepaid: 5000,
    status: 'Active',
    nextEmiDate: '2024-02-01',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

export const mockPenalties: RentPenalty[] = [];

// Mock user for authentication
export const mockUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'Admin',
  createdAt: '2024-01-01T00:00:00.000Z'
};

// Mock token
export const mockToken = 'mock-jwt-token-for-development';