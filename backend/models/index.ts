/**
 * Backend Models Index
 * Exports all TypeScript interfaces for the temple management system
 */

// User models
export * from './User';

// Shop models
export * from './Shop';

// Tenant models
export * from './Tenant';

// Agreement models
export * from './Agreement';

// Loan models
export * from './Loan';

// Rent Penalty models
export * from './RentPenalty';

// Transaction models
export * from './Transaction';

// File upload models
export * from './UploadedFile';

// Common types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}