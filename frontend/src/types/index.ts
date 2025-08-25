/**
 * Type definitions for the Khandeshwar Management System
 * These types match the backend API responses
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Treasurer" | "Viewer";
  status: "Active" | "Inactive";
  createdAt: string;
  lastLogin?: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  s3Key: string;
  s3Url: string;
}

export interface Shop {
  id: string;
  shopNumber: string;
  floorNumber: number;
  area: number;
  monthlyRent: number;
  currentTenantId?: string;
  currentTenantName?: string;
  status: "Occupied" | "Vacant" | "Under Maintenance";
  amenities: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  createdAt: string;
  status: "Active" | "Inactive";
  idProof?: UploadedFile;
}

export interface Agreement {
  id: string;
  shopId: string;
  tenantId: string;
  agreementDate: string;
  duration: number;
  monthlyRent: number;
  securityDeposit: number;
  advanceRent: number;
  agreementType: "Residential" | "Commercial";
  status: "Active" | "Expired" | "Terminated";
  nextDueDate: string;
  lastPaymentDate?: string;
  hasActiveLoan?: boolean;
  activeLoanId?: string;
  pendingPenalties?: string[];
  agreementDocument?: UploadedFile[];
  createdAt: string;
}

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
  status: "Active" | "Completed" | "Defaulted";
  nextEmiDate: string;
  lastPaymentDate?: string;
  createdAt: string;
  loanDocuments?: UploadedFile[];
}

export interface RentPenalty {
  id: string;
  agreementId: string;
  tenantId: string;
  tenantName: string;
  penaltyAmount: number;
  reason: string;
  dueDate: string;
  status: "Pending" | "Paid" | "Waived";
  createdAt: string;
  paidAt?: string;
  waivedAt?: string;
  waivedReason?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "Donation" | "Expense" | "Utilities" | "Salary" | "RentIncome";
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  receiptNumber?: string;
  donorName?: string;
  donorContact?: string;
  familyMembers?: number;
  amountPerPerson?: number;
  vendor?: string;
  receipt?: string;
  tenantName?: string;
  tenantContact?: string;
  agreementId?: string;
  shopNumber?: string;
  payeeName?: string;
  payeeContact?: string;
  loanId?: string;
  emiAmount?: number;
  penaltyId?: string;
  penaltyAmount?: number;
  receiptImages?: UploadedFile[];
  supportingDocuments?: UploadedFile[];
  createdAt: string;
}

export interface ReceiptCounters {
  donations: number;
  rentIncome: number;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: "Treasurer" | "Viewer";
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
}

// Loading and error states
export interface LoadingState {
  users: boolean;
  shops: boolean;
  tenants: boolean;
  agreements: boolean;
  loans: boolean;
  penalties: boolean;
  transactions: boolean;
  auth: boolean;
}

export interface ErrorState {
  users: string | null;
  shops: string | null;
  tenants: string | null;
  agreements: string | null;
  loans: string | null;
  penalties: string | null;
  transactions: string | null;
  auth: string | null;
}

// Form data types
export interface ShopFormData {
  shopNumber: string;
  floorNumber: number;
  area: number;
  monthlyRent: number;
  amenities: string;
}

export interface TenantFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  idProof?: File;
}

export interface AgreementFormData {
  shopId: string;
  tenantId: string;
  agreementDate: string;
  duration: number;
  monthlyRent: number;
  securityDeposit: number;
  advanceRent: number;
  agreementType: "Residential" | "Commercial";
  agreementDocument?: File[];
}

export interface LoanFormData {
  tenantId: string;
  agreementId: string;
  loanAmount: number;
  interestRate: number;
  disbursedDate: string;
  loanDuration: number;
  loanDocuments?: File[];
}

export interface TransactionFormData {
  date: string;
  type: "Donation" | "Expense" | "Utilities" | "Salary" | "RentIncome";
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  receiptNumber?: string;
  donorName?: string;
  donorContact?: string;
  familyMembers?: number;
  vendor?: string;
  tenantName?: string;
  tenantContact?: string;
  agreementId?: string;
  shopNumber?: string;
  payeeName?: string;
  payeeContact?: string;
  loanId?: string;
  penaltyId?: string;
  receiptImages?: File[];
  supportingDocuments?: File[];
}