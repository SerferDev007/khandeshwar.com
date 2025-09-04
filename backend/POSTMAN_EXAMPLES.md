# Sequelize API Examples for Postman

This file contains ready-to-use JSON examples for testing the Sequelize-based API endpoints with Postman.

## Base URL
```
http://localhost:8081/api/sequelize
```

## 1. Tenants

### POST /api/sequelize/tenants - Create Tenant
```json
{
  "id": "tenant-12345678-1234-1234-1234-123456789012",
  "name": "John Doe",
  "phone": "1234567890",
  "email": "john.doe@example.com",
  "address": "123 Main Street, City, State, ZIP",
  "business_type": "Retail Shop",
  "status": "Active",
  "id_proof": "AADHAR123456789"
}
```

### PUT /api/sequelize/tenants/{id} - Update Tenant
```json
{
  "name": "John Smith",
  "phone": "9876543210",
  "status": "Active"
}
```

## 2. Agreements

### POST /api/sequelize/agreements - Create Agreement
```json
{
  "id": "agreement-12345678-1234-1234-1234-123456789012",
  "shop_id": "shop-87654321-4321-4321-4321-210987654321",
  "tenant_id": "tenant-12345678-1234-1234-1234-123456789012",
  "agreement_date": "2024-01-01",
  "duration": 36,
  "monthly_rent": 5000.00,
  "security_deposit": 15000.00,
  "advance_rent": 5000.00,
  "agreement_type": "Commercial",
  "status": "Active",
  "next_due_date": "2024-02-01",
  "has_active_loan": false
}
```

### PUT /api/sequelize/agreements/{id} - Update Agreement
```json
{
  "monthly_rent": 5500.00,
  "next_due_date": "2024-03-01",
  "status": "Active"
}
```

## 3. Loans

### POST /api/sequelize/loans - Create Loan
```json
{
  "id": "loan-12345678-1234-1234-1234-123456789012",
  "tenant_id": "tenant-12345678-1234-1234-1234-123456789012",
  "tenant_name": "John Doe",
  "agreement_id": "agreement-12345678-1234-1234-1234-123456789012",
  "loan_amount": 50000.00,
  "interest_rate": 12.50,
  "disbursed_date": "2024-01-15",
  "loan_duration": 24,
  "monthly_emi": 2372.50,
  "outstanding_balance": 50000.00,
  "total_repaid": 0.00,
  "status": "Active",
  "next_emi_date": "2024-02-15"
}
```

### PUT /api/sequelize/loans/{id} - Update Loan
```json
{
  "outstanding_balance": 47627.50,
  "total_repaid": 2372.50,
  "next_emi_date": "2024-03-15",
  "last_payment_date": "2024-02-15"
}
```

## 4. Rent Penalties

### POST /api/sequelize/rent-penalties - Create Rent Penalty
```json
{
  "id": "penalty-12345678-1234-1234-1234-123456789012",
  "agreement_id": "agreement-12345678-1234-1234-1234-123456789012",
  "tenant_id": "tenant-12345678-1234-1234-1234-123456789012",
  "tenant_name": "John Doe",
  "rent_amount": 5000.00,
  "due_date": "2024-01-31",
  "penalty_rate": 2.00,
  "penalty_amount": 100.00,
  "penalty_paid": false,
  "status": "Pending"
}
```

### PUT /api/sequelize/rent-penalties/{id} - Update Rent Penalty
```json
{
  "penalty_paid": true,
  "penalty_paid_date": "2024-02-05",
  "paid_date": "2024-02-05",
  "status": "Paid"
}
```

## 5. Uploaded Files

### POST /api/sequelize/uploaded-files - Create Uploaded File
```json
{
  "id": "file-12345678-1234-1234-1234-123456789012",
  "filename": "contract_john_doe_20240101.pdf",
  "original_name": "Rental Agreement - John Doe.pdf",
  "file_path": "/uploads/contracts/contract_john_doe_20240101.pdf",
  "file_size": 2048576,
  "mime_type": "application/pdf",
  "uploaded_by": "user-admin-1234-5678-9012-345678901234",
  "tenant_id": "tenant-12345678-1234-1234-1234-123456789012",
  "agreement_id": "agreement-12345678-1234-1234-1234-123456789012",
  "file_type": "pdf",
  "category": "contract",
  "description": "Signed rental agreement document",
  "is_active": true
}
```

### PUT /api/sequelize/uploaded-files/{id} - Update Uploaded File
```json
{
  "category": "legal_document",
  "description": "Updated rental agreement with amendments",
  "is_active": true
}
```

## Query Parameters

### GET requests support these query parameters:

#### Pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Relations:
- `include_relations`: Set to `true` to include related data

#### Filtering (for uploaded files):
- `tenant_id`: Filter by tenant ID
- `agreement_id`: Filter by agreement ID
- `file_type`: Filter by file type
- `category`: Filter by category
- `is_active`: Filter by active status

### Example GET requests:

```
GET /api/sequelize/tenants?page=1&limit=5&include_relations=true
GET /api/sequelize/agreements?include_relations=true
GET /api/sequelize/uploaded-files?tenant_id=tenant-12345678-1234-1234-1234-123456789012&is_active=true
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": [
      {
        "field": "field_name",
        "message": "Field-specific error message",
        "value": "invalid_value"
      }
    ]
  }
}
```

## Success Responses

All endpoints return success responses in this format:

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

For paginated responses:

```json
{
  "success": true,
  "data": {
    "tenants": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```