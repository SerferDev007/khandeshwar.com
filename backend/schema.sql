-- Temple Management System Database Schema
-- MySQL Database Schema for Khandeshwar Temple Management

-- Create database
CREATE DATABASE IF NOT EXISTS temple_management;
USE temple_management;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Treasurer', 'Viewer') NOT NULL DEFAULT 'Viewer',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Tenants table (created before shops due to foreign key reference)
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  id_proof VARCHAR(200) NULL,
  INDEX idx_name (name),
  INDEX idx_phone (phone),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_business_type (business_type)
) ENGINE=InnoDB;

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id VARCHAR(36) PRIMARY KEY,
  shop_number VARCHAR(20) UNIQUE NOT NULL,
  size DECIMAL(10,2) NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) NOT NULL,
  status ENUM('Vacant', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Vacant',
  tenant_id VARCHAR(36) NULL,
  agreement_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT NULL,
  INDEX idx_shop_number (shop_number),
  INDEX idx_status (status),
  INDEX idx_tenant (tenant_id),
  INDEX idx_agreement (agreement_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Agreements table (created before loans due to foreign key reference)
CREATE TABLE IF NOT EXISTS agreements (
  id VARCHAR(36) PRIMARY KEY,
  shop_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(36) NOT NULL,
  agreement_date DATE NOT NULL,
  duration INT NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) NOT NULL,
  advance_rent DECIMAL(10,2) NOT NULL,
  agreement_type ENUM('Residential', 'Commercial') NOT NULL,
  status ENUM('Active', 'Expired', 'Terminated') NOT NULL DEFAULT 'Active',
  next_due_date DATE NOT NULL,
  last_payment_date DATE NULL,
  has_active_loan BOOLEAN DEFAULT FALSE,
  active_loan_id VARCHAR(36) NULL,
  pending_penalties JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shop (shop_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_status (status),
  INDEX idx_next_due_date (next_due_date),
  INDEX idx_agreement_type (agreement_type),
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Update shops table to add foreign key reference to agreements
ALTER TABLE shops 
ADD FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL;

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  tenant_name VARCHAR(100) NOT NULL,
  agreement_id VARCHAR(36) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  disbursed_date DATE NOT NULL,
  loan_duration INT NOT NULL,
  monthly_emi DECIMAL(10,2) NOT NULL,
  outstanding_balance DECIMAL(12,2) NOT NULL,
  total_repaid DECIMAL(12,2) DEFAULT 0.00,
  status ENUM('Active', 'Completed', 'Defaulted') NOT NULL DEFAULT 'Active',
  next_emi_date DATE NOT NULL,
  last_payment_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_agreement (agreement_id),
  INDEX idx_status (status),
  INDEX idx_next_emi_date (next_emi_date),
  INDEX idx_disbursed_date (disbursed_date),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Update agreements table to add foreign key reference to loans
ALTER TABLE agreements 
ADD FOREIGN KEY (active_loan_id) REFERENCES loans(id) ON DELETE SET NULL;

-- Rent Penalties table
CREATE TABLE IF NOT EXISTS rent_penalties (
  id VARCHAR(36) PRIMARY KEY,
  agreement_id VARCHAR(36) NOT NULL,
  tenant_name VARCHAR(100) NOT NULL,
  rent_amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE NULL,
  penalty_rate DECIMAL(5,2) NOT NULL,
  penalty_amount DECIMAL(10,2) NOT NULL,
  penalty_paid BOOLEAN DEFAULT FALSE,
  penalty_paid_date DATE NULL,
  status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agreement (agreement_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date),
  INDEX idx_penalty_paid (penalty_paid),
  FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  type ENUM('Donation', 'Expense', 'Utilities', 'Salary', 'RentIncome') NOT NULL,
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100) NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  receipt_number VARCHAR(50) NULL,
  donor_name VARCHAR(100) NULL,
  donor_contact VARCHAR(20) NULL,
  family_members INT NULL,
  amount_per_person DECIMAL(10,2) NULL,
  vendor VARCHAR(100) NULL,
  receipt VARCHAR(255) NULL,
  tenant_name VARCHAR(100) NULL,
  tenant_contact VARCHAR(20) NULL,
  agreement_id VARCHAR(36) NULL,
  shop_number VARCHAR(20) NULL,
  payee_name VARCHAR(100) NULL,
  payee_contact VARCHAR(20) NULL,
  loan_id VARCHAR(36) NULL,
  emi_amount DECIMAL(10,2) NULL,
  penalty_id VARCHAR(36) NULL,
  penalty_amount DECIMAL(10,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_receipt_number (receipt_number),
  INDEX idx_agreement (agreement_id),
  INDEX idx_loan (loan_id),
  INDEX idx_penalty (penalty_id),
  FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
  FOREIGN KEY (penalty_id) REFERENCES rent_penalties(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Uploaded Files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  size INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  base64 LONGTEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  compressed_size INT NULL,
  entity_type ENUM('agreement', 'loan', 'transaction') NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB;

-- Create views for common queries

-- Active agreements with shop and tenant details
CREATE OR REPLACE VIEW active_agreements_view AS
SELECT 
  a.*,
  s.shop_number,
  s.size as shop_size,
  t.name as tenant_name,
  t.phone as tenant_phone,
  t.email as tenant_email
FROM agreements a
JOIN shops s ON a.shop_id = s.id
JOIN tenants t ON a.tenant_id = t.id
WHERE a.status = 'Active';

-- Overdue penalties view
CREATE OR REPLACE VIEW overdue_penalties_view AS
SELECT 
  rp.*,
  a.shop_id,
  s.shop_number
FROM rent_penalties rp
JOIN agreements a ON rp.agreement_id = a.id
JOIN shops s ON a.shop_id = s.id
WHERE rp.status = 'Pending' AND rp.due_date < CURDATE();

-- Active loans with details
CREATE OR REPLACE VIEW active_loans_view AS
SELECT 
  l.*,
  a.shop_id,
  s.shop_number,
  t.name as actual_tenant_name,
  t.phone as tenant_phone
FROM loans l
JOIN agreements a ON l.agreement_id = a.id
JOIN shops s ON a.shop_id = s.id
JOIN tenants t ON l.tenant_id = t.id
WHERE l.status = 'Active';

-- Monthly rent collection summary
CREATE OR REPLACE VIEW monthly_rent_summary AS
SELECT 
  DATE_FORMAT(date, '%Y-%m') as month,
  SUM(CASE WHEN type = 'RentIncome' AND sub_category != 'penalty' THEN amount ELSE 0 END) as rent_collected,
  SUM(CASE WHEN type = 'RentIncome' AND sub_category = 'penalty' THEN amount ELSE 0 END) as penalty_collected,
  COUNT(DISTINCT agreement_id) as agreements_paid
FROM transactions 
WHERE type = 'RentIncome'
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC;