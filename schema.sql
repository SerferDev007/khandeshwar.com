-- Temple Management System Database Schema
-- SQL DDL for all entities

-- Enable UUID extension (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and role management
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Treasurer', 'Viewer') NOT NULL DEFAULT 'Viewer',
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Shops table for rental units
CREATE TABLE shops (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    shop_number VARCHAR(50) UNIQUE NOT NULL,
    size DECIMAL(10,2) NOT NULL,
    monthly_rent DECIMAL(12,2) NOT NULL,
    deposit DECIMAL(12,2) NOT NULL,
    status ENUM('Vacant', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Vacant',
    tenant_id VARCHAR(36) NULL,
    agreement_id VARCHAR(36) NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shop_status (status),
    INDEX idx_shop_tenant (tenant_id),
    INDEX idx_shop_agreement (agreement_id)
);

-- Tenants table for renters
CREATE TABLE tenants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    business_type VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    id_proof TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_status (status),
    INDEX idx_tenant_phone (phone),
    INDEX idx_tenant_email (email)
);

-- Uploaded files table for document management
CREATE TABLE uploaded_files (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    base64 LONGTEXT NOT NULL,
    compressed_size BIGINT NULL,
    entity_type ENUM('agreement', 'loan', 'transaction') NULL,
    entity_id VARCHAR(36) NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_entity (entity_type, entity_id)
);

-- Agreements table for rental contracts
CREATE TABLE agreements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    shop_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    agreement_date DATE NOT NULL,
    duration INT NOT NULL, -- in months
    monthly_rent DECIMAL(12,2) NOT NULL,
    security_deposit DECIMAL(12,2) NOT NULL,
    advance_rent DECIMAL(12,2) NOT NULL,
    agreement_type ENUM('Residential', 'Commercial') NOT NULL,
    status ENUM('Active', 'Expired', 'Terminated') NOT NULL DEFAULT 'Active',
    next_due_date DATE NOT NULL,
    last_payment_date DATE NULL,
    has_active_loan BOOLEAN DEFAULT FALSE,
    active_loan_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    INDEX idx_agreement_shop (shop_id),
    INDEX idx_agreement_tenant (tenant_id),
    INDEX idx_agreement_status (status),
    INDEX idx_agreement_due_date (next_due_date),
    INDEX idx_agreement_dates (agreement_date, next_due_date)
);

-- Loans table for tenant financing
CREATE TABLE loans (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    tenant_id VARCHAR(36) NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    agreement_id VARCHAR(36) NOT NULL,
    loan_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    disbursed_date DATE NOT NULL,
    loan_duration INT NOT NULL, -- in months
    monthly_emi DECIMAL(12,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    total_repaid DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('Active', 'Completed', 'Defaulted') NOT NULL DEFAULT 'Active',
    next_emi_date DATE NOT NULL,
    last_payment_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE RESTRICT,
    INDEX idx_loan_tenant (tenant_id),
    INDEX idx_loan_agreement (agreement_id),
    INDEX idx_loan_status (status),
    INDEX idx_loan_emi_date (next_emi_date)
);

-- Rent penalties table for late payment tracking
CREATE TABLE rent_penalties (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    agreement_id VARCHAR(36) NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    rent_amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    penalty_rate DECIMAL(5,2) NOT NULL,
    penalty_amount DECIMAL(12,2) NOT NULL,
    penalty_paid BOOLEAN DEFAULT FALSE,
    penalty_paid_date DATE NULL,
    status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE RESTRICT,
    INDEX idx_penalty_agreement (agreement_id),
    INDEX idx_penalty_status (status),
    INDEX idx_penalty_due_date (due_date)
);

-- Agreement pending penalties junction table
CREATE TABLE agreement_pending_penalties (
    agreement_id VARCHAR(36) NOT NULL,
    penalty_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (agreement_id, penalty_id),
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
    FOREIGN KEY (penalty_id) REFERENCES rent_penalties(id) ON DELETE CASCADE
);

-- Transactions table for financial records
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    date DATE NOT NULL,
    type ENUM('Donation', 'Expense', 'Utilities', 'Salary', 'RentIncome') NOT NULL,
    category VARCHAR(255) NOT NULL,
    sub_category VARCHAR(255) NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    receipt_number VARCHAR(100) NULL,
    
    -- Donation fields
    donor_name VARCHAR(255) NULL,
    donor_contact VARCHAR(50) NULL,
    family_members INT NULL,
    amount_per_person DECIMAL(12,2) NULL,
    
    -- Expense fields
    vendor VARCHAR(255) NULL,
    receipt VARCHAR(500) NULL,
    payee_name VARCHAR(255) NULL,
    payee_contact VARCHAR(50) NULL,
    
    -- Rent income fields
    tenant_name VARCHAR(255) NULL,
    tenant_contact VARCHAR(50) NULL,
    agreement_id VARCHAR(36) NULL,
    shop_number VARCHAR(50) NULL,
    
    -- Loan EMI fields
    loan_id VARCHAR(36) NULL,
    emi_amount DECIMAL(12,2) NULL,
    
    -- Penalty fields
    penalty_id VARCHAR(36) NULL,
    penalty_amount DECIMAL(12,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
    FOREIGN KEY (penalty_id) REFERENCES rent_penalties(id) ON DELETE SET NULL,
    
    INDEX idx_transaction_date (date),
    INDEX idx_transaction_type (type),
    INDEX idx_transaction_category (category),
    INDEX idx_transaction_agreement (agreement_id),
    INDEX idx_transaction_loan (loan_id),
    INDEX idx_transaction_penalty (penalty_id),
    INDEX idx_transaction_receipt (receipt_number)
);

-- Loan payments tracking table
CREATE TABLE loan_payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)), '-', HEX(RANDOM_BYTES(2)), '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
        HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-', HEX(RANDOM_BYTES(6))
    ))),
    loan_id VARCHAR(36) NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_type ENUM('EMI', 'PartPayment', 'FullPayment') NOT NULL,
    transaction_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    INDEX idx_payment_loan (loan_id),
    INDEX idx_payment_date (payment_date)
);

-- Add foreign key constraints for shops table
ALTER TABLE shops 
ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
ADD FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL;

-- Create views for common queries

-- Active agreements with shop and tenant details
CREATE VIEW active_agreements_view AS
SELECT 
    a.*,
    s.shop_number,
    s.size as shop_size,
    s.description as shop_description,
    t.name as tenant_name,
    t.phone as tenant_phone,
    t.email as tenant_email,
    t.business_type
FROM agreements a
JOIN shops s ON a.shop_id = s.id
JOIN tenants t ON a.tenant_id = t.id
WHERE a.status = 'Active';

-- Loan summary view
CREATE VIEW loan_summary_view AS
SELECT 
    l.*,
    t.name as tenant_name,
    t.phone as tenant_phone,
    s.shop_number,
    a.monthly_rent as agreement_rent
FROM loans l
JOIN tenants t ON l.tenant_id = t.id
JOIN agreements a ON l.agreement_id = a.id
JOIN shops s ON a.shop_id = s.id;

-- Transaction summary by type and date
CREATE VIEW transaction_summary_view AS
SELECT 
    DATE(date) as transaction_date,
    type,
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM transactions
GROUP BY DATE(date), type, category
ORDER BY transaction_date DESC, type;

-- Outstanding rent penalties view
CREATE VIEW outstanding_penalties_view AS
SELECT 
    rp.*,
    a.shop_id,
    s.shop_number,
    t.name as tenant_name,
    t.phone as tenant_phone
FROM rent_penalties rp
JOIN agreements a ON rp.agreement_id = a.id
JOIN shops s ON a.shop_id = s.id
JOIN tenants t ON a.tenant_id = t.id
WHERE rp.status = 'Pending';

-- Shop occupancy status view
CREATE VIEW shop_occupancy_view AS
SELECT 
    s.*,
    t.name as tenant_name,
    t.phone as tenant_phone,
    t.business_type,
    a.agreement_date,
    a.next_due_date,
    a.monthly_rent as current_rent
FROM shops s
LEFT JOIN tenants t ON s.tenant_id = t.id
LEFT JOIN agreements a ON s.agreement_id = a.id
ORDER BY s.shop_number;