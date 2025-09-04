# Sequelize Implementation Guide

This document describes the new Sequelize-based implementation for the Khandeshwar.com backend, providing modern ORM functionality with MySQL database integration.

## 🌟 Features

- **Sequelize ORM**: Modern Object-Relational Mapping for MySQL
- **Model Associations**: Properly configured relationships between entities
- **Joi Validation**: Robust input validation for all API endpoints
- **CRUD Controllers**: Complete Create, Read, Update, Delete operations
- **RESTful Routes**: Clean API design following REST principles
- **Environment Configuration**: Secure configuration using environment variables
- **Error Handling**: Comprehensive error responses with proper status codes
- **Pagination**: Built-in pagination support for list endpoints

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── sequelize.js           # Sequelize configuration
│   ├── models/
│   │   └── sequelize/             # Sequelize models
│   │       ├── index.js           # Model associations
│   │       ├── Tenant.js          # Tenant model
│   │       ├── Agreement.js       # Agreement model
│   │       ├── Loan.js            # Loan model
│   │       ├── RentPenalty.js     # RentPenalty model
│   │       └── UploadedFile.js    # UploadedFile model
│   ├── controllers/
│   │   └── sequelize/             # Sequelize controllers
│   │       ├── tenantController.js
│   │       ├── agreementController.js
│   │       ├── loanController.js
│   │       ├── rentPenaltyController.js
│   │       └── uploadedFileController.js
│   ├── routes/
│   │   └── sequelize/             # Sequelize routes
│   │       ├── index.js           # Route aggregator
│   │       ├── tenants.js         # Tenant routes
│   │       ├── agreements.js      # Agreement routes
│   │       ├── loans.js           # Loan routes
│   │       ├── rentPenalties.js   # RentPenalty routes
│   │       └── uploadedFiles.js   # UploadedFile routes
│   ├── middleware/
│   │   └── joiValidation.js       # Joi validation middleware
│   └── validation/
│       └── schemas.js             # Joi validation schemas
├── POSTMAN_EXAMPLES.md            # API usage examples
└── test-*.js                      # Test scripts
```

## 🗄️ Database Models

### Tenant
- **Purpose**: Manages tenant information
- **Table**: `tenants`
- **Key Fields**: id, name, phone, email, address, business_type, status
- **Relations**: 
  - hasMany Agreements
  - hasMany Loans  
  - hasMany RentPenalties
  - hasMany UploadedFiles

### Agreement
- **Purpose**: Manages rental agreements
- **Table**: `agreements`
- **Key Fields**: id, shop_id, tenant_id, agreement_date, monthly_rent, duration
- **Relations**:
  - belongsTo Tenant
  - hasMany Loans
  - hasMany RentPenalties
  - hasMany UploadedFiles

### Loan
- **Purpose**: Manages tenant loans
- **Table**: `loans`
- **Key Fields**: id, tenant_id, agreement_id, loan_amount, interest_rate, status
- **Relations**:
  - belongsTo Tenant
  - belongsTo Agreement

### RentPenalty
- **Purpose**: Manages rent penalties
- **Table**: `rent_penalties`
- **Key Fields**: id, agreement_id, tenant_id, penalty_amount, status
- **Relations**:
  - belongsTo Tenant
  - belongsTo Agreement

### UploadedFile
- **Purpose**: Manages file uploads
- **Table**: `uploaded_files`
- **Key Fields**: id, filename, file_path, tenant_id, agreement_id, file_type
- **Relations**:
  - belongsTo Tenant (optional)
  - belongsTo Agreement (optional)

## 🔌 API Endpoints

All Sequelize-based endpoints are available under `/api/sequelize/`:

### Tenants
- `GET /api/sequelize/tenants` - List all tenants
- `GET /api/sequelize/tenants/:id` - Get tenant by ID
- `POST /api/sequelize/tenants` - Create new tenant
- `PUT /api/sequelize/tenants/:id` - Update tenant
- `DELETE /api/sequelize/tenants/:id` - Delete tenant

### Agreements
- `GET /api/sequelize/agreements` - List all agreements
- `GET /api/sequelize/agreements/:id` - Get agreement by ID
- `POST /api/sequelize/agreements` - Create new agreement
- `PUT /api/sequelize/agreements/:id` - Update agreement
- `DELETE /api/sequelize/agreements/:id` - Delete agreement

### Loans
- `GET /api/sequelize/loans` - List all loans
- `GET /api/sequelize/loans/:id` - Get loan by ID
- `POST /api/sequelize/loans` - Create new loan
- `PUT /api/sequelize/loans/:id` - Update loan
- `DELETE /api/sequelize/loans/:id` - Delete loan

### Rent Penalties
- `GET /api/sequelize/rent-penalties` - List all rent penalties
- `GET /api/sequelize/rent-penalties/:id` - Get rent penalty by ID
- `POST /api/sequelize/rent-penalties` - Create new rent penalty
- `PUT /api/sequelize/rent-penalties/:id` - Update rent penalty
- `DELETE /api/sequelize/rent-penalties/:id` - Delete rent penalty

### Uploaded Files
- `GET /api/sequelize/uploaded-files` - List all uploaded files
- `GET /api/sequelize/uploaded-files/:id` - Get uploaded file by ID
- `POST /api/sequelize/uploaded-files` - Create new uploaded file record
- `PUT /api/sequelize/uploaded-files/:id` - Update uploaded file record
- `DELETE /api/sequelize/uploaded-files/:id` - Delete uploaded file record

## 🔒 Validation

All POST and PUT endpoints include comprehensive Joi validation:

- **Field Validation**: Type checking, length limits, format validation
- **Business Rules**: Relationship validation, enum values
- **Error Responses**: Detailed validation error messages
- **Data Sanitization**: Automatic data cleaning and transformation

## 📖 Usage Examples

See `POSTMAN_EXAMPLES.md` for complete API usage examples including:
- Request/response formats
- Sample JSON payloads
- Query parameters
- Error handling examples

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install sequelize joi
   ```

2. **Configure Environment**:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=khandeshwar_db
   DB_PORT=3306
   ```

3. **Start Server**:
   ```bash
   npm start
   ```

4. **Test Setup**:
   ```bash
   node test-model-structure.js
   node test-api-structure.js
   ```

## 🧪 Testing

Several test scripts are available:

- `test-model-structure.js` - Tests model definitions and associations
- `test-api-structure.js` - Tests route structure and middleware
- `test-sequelize.js` - Full database connectivity test (requires MySQL)

## 🔄 Migration from Existing System

The new Sequelize implementation runs alongside the existing raw MySQL implementation:

- **Existing APIs**: Continue to work at their current endpoints
- **New APIs**: Available at `/api/sequelize/*` endpoints
- **Database**: Same tables, different access method
- **Gradual Migration**: Can migrate endpoints one by one

## 🛠️ Development Notes

- **ES6 Modules**: Uses modern JavaScript module syntax
- **Async/Await**: Modern asynchronous programming patterns
- **Error Handling**: Comprehensive error catching and logging
- **Validation**: Client-side and server-side validation
- **Logging**: Structured logging with Pino
- **Security**: Input sanitization and validation

## 📊 Benefits

- **Type Safety**: Better data integrity with Sequelize validations
- **Relationships**: Automatic handling of foreign key relationships
- **Migrations**: Built-in database migration support
- **Performance**: Optimized queries and connection pooling
- **Maintenance**: Easier to maintain and extend
- **Documentation**: Self-documenting model definitions

## 🔮 Future Enhancements

- **Authentication**: Add JWT authentication to Sequelize routes
- **Permissions**: Role-based access control
- **Caching**: Redis integration for performance
- **Transactions**: Database transaction support
- **Auditing**: Change tracking and audit trails
- **API Versioning**: Version management for API evolution