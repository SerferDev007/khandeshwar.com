# Backend Models

This directory contains TypeScript interfaces and types for the Temple Management System backend.

## Models Overview

### Core Entity Models

- **User** - Authentication and user management
- **Shop** - Rental units/spaces in the temple complex  
- **Tenant** - Individuals or businesses renting shops
- **Agreement** - Rental contracts linking shops and tenants
- **Loan** - Tenant financing with EMI tracking
- **RentPenalty** - Late payment penalties
- **Transaction** - Financial transactions (donations, expenses, rent income)
- **UploadedFile** - Document attachments

### Model Features

- **Type Safety** - Full TypeScript interfaces for all entities
- **Request/Response Types** - Create and Update request interfaces
- **Relations** - Extended interfaces with related entity data
- **Common Types** - Shared interfaces for API responses and pagination

### Usage

```typescript
import { 
  User, 
  Shop, 
  Tenant, 
  Agreement, 
  Loan, 
  RentPenalty, 
  Transaction,
  CreateShopRequest,
  UpdateShopRequest,
  ShopWithRelations
} from './models';

// Using the interfaces
const shop: Shop = {
  id: "shop-123",
  shopNumber: "A-001",
  size: 200,
  monthlyRent: 5000,
  deposit: 15000,
  status: "Vacant",
  createdAt: "2024-01-01T00:00:00Z"
};
```

## Database Schema

The corresponding SQL schema is located at `../schema.sql` and includes:

- Complete table definitions with proper data types
- Foreign key relationships and constraints
- Indexes for performance optimization
- Views for common queries
- Support for MySQL/MariaDB

## Entity Relationships

- **Shop** ↔ **Tenant** (through Agreement)
- **Agreement** → **Shop** + **Tenant**
- **Loan** → **Agreement** + **Tenant**
- **RentPenalty** → **Agreement**
- **Transaction** → **Agreement/Loan/Penalty** (optional references)
- **UploadedFile** → **Agreement/Loan/Transaction** (optional attachments)

## Suitable for Node.js/Express

These models are designed to work seamlessly with:
- Express.js REST APIs
- Database ORMs (Sequelize, Prisma, TypeORM)
- Input validation libraries (Joi, Yup, Zod)
- JSON API responses