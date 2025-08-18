# Temple Management Backend API

RESTful API backend for the Khandeshwar Temple Management System built with Node.js, Express, and MySQL.

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Set up MySQL database:
```bash
# Create database and tables using the schema
mysql -u root -p < schema.sql
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 3001 by default.

## API Endpoints

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

### Tenants
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

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

## Entity Relationships

- **Shop** → **Tenant** (optional, one-to-one)
- **Shop** → **Agreement** (optional, one-to-one)
- **Tenant** → **Agreement** (one-to-many)
- **Agreement** → **Loan** (one-to-many)
- **Agreement** → **RentPenalty** (one-to-many)
- **Agreement/Loan/Transaction** → **UploadedFile** (one-to-many)

## Database Views

The schema includes several views for common queries:
- `active_agreements_view` - Active agreements with shop and tenant details
- `overdue_penalties_view` - Penalties that are overdue
- `active_loans_view` - Active loans with full details
- `monthly_rent_summary` - Monthly rent collection summary

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

Error responses include a message describing the error.