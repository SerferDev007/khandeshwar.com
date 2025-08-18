/**
 * Tenant model for renter management
 * Represents individuals or businesses renting shops
 */

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  createdAt: string;
  status: 'Active' | 'Inactive';
  idProof?: string;
}

export interface CreateTenantRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  status?: 'Active' | 'Inactive';
  idProof?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessType?: string;
  status?: 'Active' | 'Inactive';
  idProof?: string;
}

export interface TenantWithRelations extends Tenant {
  agreements?: Array<{
    id: string;
    shopId: string;
    shopNumber: string;
    agreementDate: string;
    status: string;
    monthlyRent: number;
  }>;
  loans?: Array<{
    id: string;
    loanAmount: number;
    outstandingBalance: number;
    status: string;
  }>;
  totalActiveLoans?: number;
  totalOutstandingBalance?: number;
}