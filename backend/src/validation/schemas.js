import Joi from 'joi';

// Tenant validation schemas
export const createTenantSchema = Joi.object({
  id: Joi.string().length(36).required(),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(10).max(20).required(),
  email: Joi.string().email().max(100).required(),
  address: Joi.string().min(10).required(),
  business_type: Joi.string().min(2).max(100).required(),
  status: Joi.string().valid('Active', 'Inactive').default('Active'),
  id_proof: Joi.string().max(200).optional()
});

export const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(10).max(20).optional(),
  email: Joi.string().email().max(100).optional(),
  address: Joi.string().min(10).optional(),
  business_type: Joi.string().min(2).max(100).optional(),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  id_proof: Joi.string().max(200).optional()
});

// Agreement validation schemas
export const createAgreementSchema = Joi.object({
  id: Joi.string().length(36).required(),
  shop_id: Joi.string().length(36).required(),
  tenant_id: Joi.string().length(36).required(),
  agreement_date: Joi.date().iso().required(),
  duration: Joi.number().integer().min(1).max(1000).required(),
  monthly_rent: Joi.number().precision(2).min(0).required(),
  security_deposit: Joi.number().precision(2).min(0).required(),
  advance_rent: Joi.number().precision(2).min(0).required(),
  agreement_type: Joi.string().valid('Residential', 'Commercial').required(),
  status: Joi.string().valid('Active', 'Expired', 'Terminated').default('Active'),
  next_due_date: Joi.date().iso().required(),
  last_payment_date: Joi.date().iso().optional(),
  has_active_loan: Joi.boolean().default(false),
  active_loan_id: Joi.string().length(36).optional(),
  pending_penalties: Joi.object().optional()
});

export const updateAgreementSchema = Joi.object({
  shop_id: Joi.string().length(36).optional(),
  tenant_id: Joi.string().length(36).optional(),
  agreement_date: Joi.date().iso().optional(),
  duration: Joi.number().integer().min(1).max(1000).optional(),
  monthly_rent: Joi.number().precision(2).min(0).optional(),
  security_deposit: Joi.number().precision(2).min(0).optional(),
  advance_rent: Joi.number().precision(2).min(0).optional(),
  agreement_type: Joi.string().valid('Residential', 'Commercial').optional(),
  status: Joi.string().valid('Active', 'Expired', 'Terminated').optional(),
  next_due_date: Joi.date().iso().optional(),
  last_payment_date: Joi.date().iso().optional(),
  has_active_loan: Joi.boolean().optional(),
  active_loan_id: Joi.string().length(36).optional(),
  pending_penalties: Joi.object().optional()
});

// Loan validation schemas
export const createLoanSchema = Joi.object({
  id: Joi.string().length(36).required(),
  tenant_id: Joi.string().length(36).required(),
  tenant_name: Joi.string().min(2).max(100).required(),
  agreement_id: Joi.string().length(36).required(),
  loan_amount: Joi.number().precision(2).min(0).required(),
  interest_rate: Joi.number().precision(2).min(0).max(100).required(),
  disbursed_date: Joi.date().iso().required(),
  loan_duration: Joi.number().integer().min(1).max(1000).required(),
  monthly_emi: Joi.number().precision(2).min(0).required(),
  outstanding_balance: Joi.number().precision(2).min(0).required(),
  total_repaid: Joi.number().precision(2).min(0).default(0),
  status: Joi.string().valid('Active', 'Completed', 'Defaulted').default('Active'),
  next_emi_date: Joi.date().iso().required(),
  last_payment_date: Joi.date().iso().optional()
});

export const updateLoanSchema = Joi.object({
  tenant_id: Joi.string().length(36).optional(),
  tenant_name: Joi.string().min(2).max(100).optional(),
  agreement_id: Joi.string().length(36).optional(),
  loan_amount: Joi.number().precision(2).min(0).optional(),
  interest_rate: Joi.number().precision(2).min(0).max(100).optional(),
  disbursed_date: Joi.date().iso().optional(),
  loan_duration: Joi.number().integer().min(1).max(1000).optional(),
  monthly_emi: Joi.number().precision(2).min(0).optional(),
  outstanding_balance: Joi.number().precision(2).min(0).optional(),
  total_repaid: Joi.number().precision(2).min(0).optional(),
  status: Joi.string().valid('Active', 'Completed', 'Defaulted').optional(),
  next_emi_date: Joi.date().iso().optional(),
  last_payment_date: Joi.date().iso().optional()
});

// RentPenalty validation schemas
export const createRentPenaltySchema = Joi.object({
  id: Joi.string().length(36).required(),
  agreement_id: Joi.string().length(36).required(),
  tenant_id: Joi.string().length(36).required(),
  tenant_name: Joi.string().min(2).max(100).required(),
  rent_amount: Joi.number().precision(2).min(0).required(),
  due_date: Joi.date().iso().required(),
  paid_date: Joi.date().iso().optional(),
  penalty_rate: Joi.number().precision(2).min(0).max(100).required(),
  penalty_amount: Joi.number().precision(2).min(0).required(),
  penalty_paid: Joi.boolean().default(false),
  penalty_paid_date: Joi.date().iso().optional(),
  status: Joi.string().valid('Pending', 'Paid').default('Pending')
});

export const updateRentPenaltySchema = Joi.object({
  agreement_id: Joi.string().length(36).optional(),
  tenant_id: Joi.string().length(36).optional(),
  tenant_name: Joi.string().min(2).max(100).optional(),
  rent_amount: Joi.number().precision(2).min(0).optional(),
  due_date: Joi.date().iso().optional(),
  paid_date: Joi.date().iso().optional(),
  penalty_rate: Joi.number().precision(2).min(0).max(100).optional(),
  penalty_amount: Joi.number().precision(2).min(0).optional(),
  penalty_paid: Joi.boolean().optional(),
  penalty_paid_date: Joi.date().iso().optional(),
  status: Joi.string().valid('Pending', 'Paid').optional()
});

// UploadedFile validation schemas
export const createUploadedFileSchema = Joi.object({
  id: Joi.string().length(36).required(),
  filename: Joi.string().max(255).required(),
  original_name: Joi.string().max(255).required(),
  file_path: Joi.string().max(500).required(),
  file_size: Joi.number().integer().min(0).required(),
  mime_type: Joi.string().max(100).required(),
  uploaded_by: Joi.string().length(36).required(),
  tenant_id: Joi.string().length(36).optional(),
  agreement_id: Joi.string().length(36).optional(),
  file_type: Joi.string().valid('document', 'image', 'pdf', 'other').default('document'),
  category: Joi.string().max(100).optional(),
  description: Joi.string().optional(),
  is_active: Joi.boolean().default(true)
});

export const updateUploadedFileSchema = Joi.object({
  filename: Joi.string().max(255).optional(),
  original_name: Joi.string().max(255).optional(),
  file_path: Joi.string().max(500).optional(),
  file_size: Joi.number().integer().min(0).optional(),
  mime_type: Joi.string().max(100).optional(),
  uploaded_by: Joi.string().length(36).optional(),
  tenant_id: Joi.string().length(36).optional(),
  agreement_id: Joi.string().length(36).optional(),
  file_type: Joi.string().valid('document', 'image', 'pdf', 'other').optional(),
  category: Joi.string().max(100).optional(),
  description: Joi.string().optional(),
  is_active: Joi.boolean().optional()
});