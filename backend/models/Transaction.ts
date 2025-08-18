/**
 * Transaction model for financial record keeping
 * Handles all types of financial transactions in the temple management system
 */

import { UploadedFile } from './UploadedFile';

export interface Transaction {
  id: string;
  date: string;
  type: 'Donation' | 'Expense' | 'Utilities' | 'Salary' | 'RentIncome';
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  receiptNumber?: string;
  
  // Donation fields
  donorName?: string;
  donorContact?: string;
  familyMembers?: number;
  amountPerPerson?: number;
  
  // Expense fields
  vendor?: string;
  receipt?: string;
  payeeName?: string;
  payeeContact?: string;
  
  // Rent income fields
  tenantName?: string;
  tenantContact?: string;
  agreementId?: string;
  shopNumber?: string;
  
  // Loan EMI fields
  loanId?: string;
  emiAmount?: number;
  
  // Penalty fields
  penaltyId?: string;
  penaltyAmount?: number;
  
  // Document attachments
  receiptImages?: UploadedFile[];
  supportingDocuments?: UploadedFile[];
}

export interface CreateTransactionRequest {
  date: string;
  type: 'Donation' | 'Expense' | 'Utilities' | 'Salary' | 'RentIncome';
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  receiptNumber?: string;
  
  // Optional fields based on transaction type
  donorName?: string;
  donorContact?: string;
  familyMembers?: number;
  amountPerPerson?: number;
  vendor?: string;
  receipt?: string;
  payeeName?: string;
  payeeContact?: string;
  tenantName?: string;
  tenantContact?: string;
  agreementId?: string;
  shopNumber?: string;
  loanId?: string;
  emiAmount?: number;
  penaltyId?: string;
  penaltyAmount?: number;
  receiptImages?: UploadedFile[];
  supportingDocuments?: UploadedFile[];
}

export interface UpdateTransactionRequest {
  date?: string;
  type?: 'Donation' | 'Expense' | 'Utilities' | 'Salary' | 'RentIncome';
  category?: string;
  subCategory?: string;
  description?: string;
  amount?: number;
  receiptNumber?: string;
  donorName?: string;
  donorContact?: string;
  familyMembers?: number;
  amountPerPerson?: number;
  vendor?: string;
  receipt?: string;
  payeeName?: string;
  payeeContact?: string;
  tenantName?: string;
  tenantContact?: string;
  agreementId?: string;
  shopNumber?: string;
  loanId?: string;
  emiAmount?: number;
  penaltyId?: string;
  penaltyAmount?: number;
  receiptImages?: UploadedFile[];
  supportingDocuments?: UploadedFile[];
}

export interface TransactionWithRelations extends Transaction {
  agreement?: {
    id: string;
    shopId: string;
    shopNumber: string;
    tenant: {
      name: string;
      phone: string;
    };
  };
  loan?: {
    id: string;
    loanAmount: number;
    outstandingBalance: number;
    tenant: {
      name: string;
    };
  };
  penalty?: {
    id: string;
    penaltyAmount: number;
    dueDate: string;
  };
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  donationsTotal: number;
  rentIncomeTotal: number;
  expensesTotal: number;
  utilitiesTotal: number;
  salaryTotal: number;
}