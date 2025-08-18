-- Temple Management System Database Schema
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS temple_management;
USE temple_management;

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'user') DEFAULT 'user',
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Devotees table for managing temple devotees
CREATE TABLE IF NOT EXISTS devotees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15) NOT NULL,
    address TEXT,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    occupation VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    membership_type ENUM('regular', 'premium', 'life') DEFAULT 'regular',
    membership_start_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Donations table for managing temple donations
CREATE TABLE IF NOT EXISTS donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    devotee_id INT,
    donor_name VARCHAR(100) NOT NULL,
    donor_phone VARCHAR(15),
    donor_email VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    donation_type ENUM('cash', 'online', 'check', 'kind') DEFAULT 'cash',
    purpose ENUM('general', 'festival', 'maintenance', 'construction', 'food', 'other') DEFAULT 'general',
    purpose_description TEXT,
    receipt_number VARCHAR(50) UNIQUE,
    payment_method ENUM('cash', 'card', 'upi', 'bank_transfer', 'check') DEFAULT 'cash',
    transaction_id VARCHAR(100),
    donation_date DATE NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (devotee_id) REFERENCES devotees(id) ON DELETE SET NULL
);

-- Events table for managing temple events and festivals
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type ENUM('festival', 'ceremony', 'prayer', 'cultural', 'educational', 'other') DEFAULT 'prayer',
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    organizer_name VARCHAR(100),
    organizer_phone VARCHAR(15),
    max_participants INT,
    registration_required BOOLEAN DEFAULT FALSE,
    registration_fee DECIMAL(8, 2) DEFAULT 0.00,
    is_public BOOLEAN DEFAULT TRUE,
    status ENUM('planned', 'active', 'completed', 'cancelled') DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Staff table for managing temple staff and volunteers
CREATE TABLE IF NOT EXISTS staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    employee_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15) NOT NULL,
    address TEXT,
    date_of_birth DATE,
    date_of_joining DATE NOT NULL,
    position VARCHAR(100) NOT NULL,
    department ENUM('management', 'security', 'maintenance', 'kitchen', 'decoration', 'administration') DEFAULT 'administration',
    salary DECIMAL(10, 2),
    employment_type ENUM('full_time', 'part_time', 'volunteer', 'contract') DEFAULT 'full_time',
    shift_timing VARCHAR(50),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_devotees_phone ON devotees(phone);
CREATE INDEX idx_devotees_email ON devotees(email);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_devotee ON donations(devotee_id);
CREATE INDEX idx_events_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);