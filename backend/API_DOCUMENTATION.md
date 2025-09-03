# Temple Management Backend - API Documentation

## Overview

A comprehensive RESTful API backend for the Khandeshwar Temple Management System, built with Node.js, Express.js, and MySQL. This backend provides CRUD operations for all temple management entities with proper relationships and data integrity.

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.18+
- **Database**: MySQL 8.0+
- **Dependencies**: 
  - `mysql2` - MySQL driver with promise support
  - `cors` - Cross-Origin Resource Sharing
  - `dotenv` - Environment variable management

### Project Structure
```
backend/
├── models/           # Entity models and database schemas
│   ├── User.js
│   ├── Shop.js
│   ├── Tenant.js
│   ├── Agreement.js
│   ├── Loan.js
│   ├── RentPenalty.js
│   ├── Transaction.js
│   └── UploadedFile.js
├── app.js           # Main Express application
├── schema.sql       # Complete MySQL database schema
├── package.json     # Dependencies and scripts
├── .env.example     # Environment configuration template
└── README.md        # Setup and usage instructions
```

## 📊 Data Models

### 1. User
User authentication and role management for temple administrators.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `username` (VARCHAR(50), Unique)
- `email` (VARCHAR(100), Unique)
- `role` (ENUM: 'Admin', 'Treasurer', 'Viewer')
- `status` (ENUM: 'Active', 'Inactive')
- `created_at` (TIMESTAMP)
- `last_login` (TIMESTAMP, Optional)

### 2. Tenant
Individuals or businesses renting temple shops.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `name` (VARCHAR(100))
- `phone` (VARCHAR(20))
- `email` (VARCHAR(100))
- `address` (TEXT)
- `business_type` (VARCHAR(100))
- `status` (ENUM: 'Active', 'Inactive')
- `id_proof` (VARCHAR(200), Optional)
- `created_at` (TIMESTAMP)

### 3. Shop
Physical shop spaces available for rent in the temple complex.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `shop_number` (VARCHAR(20), Unique)
- `size` (DECIMAL(10,2)) - in square feet
- `monthly_rent` (DECIMAL(10,2))
- `deposit` (DECIMAL(10,2))
- `status` (ENUM: 'Vacant', 'Occupied', 'Maintenance')
- `tenant_id` (VARCHAR(36), Foreign Key, Optional)
- `agreement_id` (VARCHAR(36), Foreign Key, Optional)
- `description` (TEXT, Optional)
- `created_at` (TIMESTAMP)

### 4. Agreement
Rental agreements between the temple and tenants.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `shop_id` (VARCHAR(36), Foreign Key)
- `tenant_id` (VARCHAR(36), Foreign Key)
- `agreement_date` (DATE)
- `duration` (INT) - in months
- `monthly_rent` (DECIMAL(10,2))
- `security_deposit` (DECIMAL(10,2))
- `advance_rent` (DECIMAL(10,2))
- `agreement_type` (ENUM: 'Residential', 'Commercial')
- `status` (ENUM: 'Active', 'Expired', 'Terminated')
- `next_due_date` (DATE)
- `last_payment_date` (DATE, Optional)
- `has_active_loan` (BOOLEAN)
- `active_loan_id` (VARCHAR(36), Foreign Key, Optional)
- `pending_penalties` (JSON) - Array of penalty IDs
- `created_at` (TIMESTAMP)

### 5. Loan
Financial loans provided by the temple to tenants.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `tenant_id` (VARCHAR(36), Foreign Key)
- `tenant_name` (VARCHAR(100))
- `agreement_id` (VARCHAR(36), Foreign Key)
- `loan_amount` (DECIMAL(12,2))
- `interest_rate` (DECIMAL(5,2)) - percentage
- `disbursed_date` (DATE)
- `loan_duration` (INT) - in months
- `monthly_emi` (DECIMAL(10,2))
- `outstanding_balance` (DECIMAL(12,2))
- `total_repaid` (DECIMAL(12,2))
- `status` (ENUM: 'Active', 'Completed', 'Defaulted')
- `next_emi_date` (DATE)
- `last_payment_date` (DATE, Optional)
- `created_at` (TIMESTAMP)

### 6. RentPenalty
Late payment penalties applied to overdue rent.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `agreement_id` (VARCHAR(36), Foreign Key)
- `tenant_name` (VARCHAR(100))
- `rent_amount` (DECIMAL(10,2))
- `due_date` (DATE)
- `paid_date` (DATE, Optional)
- `penalty_rate` (DECIMAL(5,2)) - percentage
- `penalty_amount` (DECIMAL(10,2))
- `penalty_paid` (BOOLEAN)
- `penalty_paid_date` (DATE, Optional)
- `status` (ENUM: 'Pending', 'Paid')
- `created_at` (TIMESTAMP)

### 7. Transaction
Financial transactions for all temple activities.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `date` (DATE)
- `type` (ENUM: 'Donation', 'Expense', 'Utilities', 'Salary', 'RentIncome')
- `category` (VARCHAR(100))
- `sub_category` (VARCHAR(100), Optional)
- `description` (TEXT)
- `amount` (DECIMAL(12,2))
- `receipt_number` (VARCHAR(50), Optional)
- Various optional fields for different transaction types
- `created_at` (TIMESTAMP)

### 8. UploadedFile
Document storage for agreements, loans, and other records.

**Fields:**
- `id` (VARCHAR(36), Primary Key)
- `name` (VARCHAR(255))
- `size` (INT) - in bytes
- `type` (VARCHAR(100)) - MIME type
- `base64` (LONGTEXT) - Base64 encoded file content
- `entity_type` (ENUM: 'agreement', 'loan', 'transaction')
- `entity_id` (VARCHAR(36)) - Reference to related entity
- `uploaded_at` (TIMESTAMP)
- `compressed_size` (INT, Optional)

## 🔗 Relationships

```
User (1) ←→ (many) Transactions [created_by - not implemented yet]
Tenant (1) ←→ (many) Agreements
Tenant (1) ←→ (many) Loans
Shop (1) ←→ (1) Agreement [current agreement]
Shop (1) ←→ (1) Tenant [current tenant]
Agreement (1) ←→ (many) Loans
Agreement (1) ←→ (many) RentPenalties
Agreement (1) ←→ (many) Transactions
Loan (1) ←→ (many) Transactions
RentPenalty (1) ←→ (many) Transactions
Agreement (1) ←→ (many) UploadedFiles
Loan (1) ←→ (many) UploadedFiles
Transaction (1) ←→ (many) UploadedFiles
```

## 🚀 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Shops
- `GET /api/shops` - List all shops
- `GET /api/shops/:id` - Get shop by ID
- `POST /api/shops` - Create new shop
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop

### Rent Management
All rent-related endpoints are consolidated under `/api/rent/`:

#### Rental Units (Shops)
- `GET /api/rent/units` - List all rental units

#### Tenants  
- `GET /api/rent/tenants` - List all tenants
- `GET /api/rent/tenants/:id` - Get tenant by ID
- `POST /api/rent/tenants` - Create new tenant
- `PUT /api/rent/tenants/:id` - Update tenant
- `DELETE /api/rent/tenants/:id` - Delete tenant

#### Leases (Agreements)
- `GET /api/rent/leases` - List all lease agreements

#### Rent Payments
- `GET /api/rent/payments` - List all rent payments
- `GET /api/rent/payments/:id` - Get rent payment by ID
- `POST /api/rent/payments` - Create new rent payment  
- `DELETE /api/rent/payments/:id` - Delete rent payment

### Agreements
- `GET /api/agreements` - List all agreements
- `GET /api/agreements/:id` - Get agreement by ID
- `GET /api/agreements/tenant/:tenantId` - Get agreements by tenant
- `POST /api/agreements` - Create new agreement
- `PUT /api/agreements/:id` - Update agreement
- `DELETE /api/agreements/:id` - Delete agreement

### Loans
- `GET /api/loans` - List all loans
- `GET /api/loans/:id` - Get loan by ID
- `GET /api/loans/agreement/:agreementId` - Get loans by agreement
- `POST /api/loans` - Create new loan
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan

### Rent Penalties
- `GET /api/rent-penalties` - List all rent penalties
- `GET /api/rent-penalties/:id` - Get penalty by ID
- `GET /api/rent-penalties/agreement/:agreementId` - Get penalties by agreement
- `POST /api/rent-penalties` - Create new penalty
- `PUT /api/rent-penalties/:id` - Update penalty
- `DELETE /api/rent-penalties/:id` - Delete penalty

### Transactions
- `GET /api/transactions` - List all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `GET /api/transactions/type/:type` - Get transactions by type
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Uploaded Files
- `GET /api/uploaded-files` - List all uploaded files
- `GET /api/uploaded-files/:id` - Get file by ID
- `GET /api/uploaded-files/entity/:entityType/:entityId` - Get files by entity
- `POST /api/uploaded-files` - Upload new file
- `PUT /api/uploaded-files/:id` - Update file metadata
- `DELETE /api/uploaded-files/:id` - Delete file

## 📋 Database Views

The schema includes optimized views for common queries:

### active_agreements_view
Active agreements with shop and tenant details for dashboard display.

### overdue_penalties_view
Penalties that are past due date for collections management.

### active_loans_view
Active loans with full details for loan management.

### monthly_rent_summary
Monthly rent collection summary for financial reporting.

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=temple_management
DB_PORT=3306

# Server Configuration
PORT=8081
NODE_ENV=production

# CORS Configuration
CORS_ORIGINS=http://localhost:5173
```

## 🛠️ Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Database Setup:**
   ```bash
   # Create database and import schema
   mysql -u root -p < schema.sql
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start Server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔍 Testing

Run the included model validation test:
```bash
node test-models.js
```

This validates:
- Model instantiation
- Database object conversion
- Schema generation
- API endpoint mapping

## 🚀 Production Ready Features

✅ **Database Management**
- Automatic database creation
- Foreign key constraints
- Indexed columns for performance
- JSON fields for complex data

✅ **Error Handling**
- Comprehensive error responses
- HTTP status codes
- Graceful shutdown

✅ **Security**
- CORS configuration
- Input validation
- SQL injection prevention

✅ **Performance**
- Connection pooling
- Indexed queries
- Optimized schemas

✅ **Scalability**
- Modular architecture
- Configurable environment
- RESTful design patterns

## 📝 Notes

- No mock data included as requested
- All entities support full CRUD operations
- File uploads stored as Base64 in database
- Relationships maintained with foreign keys
- Production-ready error handling and validation