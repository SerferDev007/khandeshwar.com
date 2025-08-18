/**
 * Loan model for tenant financing
 * Manages loans provided to tenants with EMI tracking
 */

import { UploadedFile } from './UploadedFile';

export interface Loan {
  id: string;
  tenantId: string;
  tenantName: string;
  agreementId: string;
  loanAmount: number;
  interestRate: number;
  disbursedDate: string;
  loanDuration: number;
  monthlyEmi: number;
  outstandingBalance: number;
  totalRepaid: number;
  status: 'Active' | 'Completed' | 'Defaulted';
  nextEmiDate: string;
  lastPaymentDate?: string;
  createdAt: string;
  loanDocuments?: UploadedFile[];
}

export interface CreateLoanRequest {
  tenantId: string;
  tenantName: string;
  agreementId: string;
  loanAmount: number;
  interestRate: number;
  disbursedDate: string;
  loanDuration: number;
  monthlyEmi: number;
  status?: 'Active' | 'Completed' | 'Defaulted';
  loanDocuments?: UploadedFile[];
}

export interface UpdateLoanRequest {
  loanAmount?: number;
  interestRate?: number;
  loanDuration?: number;
  monthlyEmi?: number;
  outstandingBalance?: number;
  totalRepaid?: number;
  status?: 'Active' | 'Completed' | 'Defaulted';
  nextEmiDate?: string;
  lastPaymentDate?: string;
  loanDocuments?: UploadedFile[];
}

export interface LoanWithRelations extends Loan {
  tenant?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    businessType: string;
  };
  agreement?: {
    id: string;
    shopId: string;
    shopNumber: string;
    monthlyRent: number;
    status: string;
  };
  paymentHistory?: Array<{
    id: string;
    paymentDate: string;
    amount: number;
    type: 'EMI' | 'PartPayment' | 'FullPayment';
  }>;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  paymentDate: string;
  amount: number;
  type: 'EMI' | 'PartPayment' | 'FullPayment';
  transactionId?: string;
  createdAt: string;
}