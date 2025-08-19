# Khandeshwar Management System - Production API Documentation

## Overview

A production-ready Express.js backend API built with modern technologies and best practices:

- **ESM Modules**: Full ES6 module support
- **Security**: JWT authentication, RBAC, bcrypt hashing, rate limiting
- **Validation**: Zod schema validation for all inputs
- **Database**: MySQL with connection pooling and migrations
- **Cloud Integration**: AWS S3 for file storage, SES for emails
- **Logging**: Structured logging with Pino
- **Error Handling**: Standardized error responses

## Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- AWS account (optional, for S3/SES features)

### Installation

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration  
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=khandeshwar_db
DB_PORT=3306

# JWT Configuration (use strong secrets in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS Configuration (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name
SES_FROM_EMAIL=noreply@yourdomain.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

All API responses follow this standardized format:

```javascript
// Success response
{
  "success": true,
  "data": {
    // Response data here
  }
}

// Error response  
{
  "success": false,
  "error": "Error message here",
  "details": [] // Optional validation details
}
```

### Health Check

```http
GET /health
```

Returns server health and status information.

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "SecurePass123",
  "role": "Viewer" // Optional: Admin, Treasurer, Viewer
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com", 
      "role": "Viewer",
      "status": "Active"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "accessTokenExpiresIn": "15m",
      "refreshTokenExpiresIn": "7d"
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer your-jwt-token
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePass123"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout All Devices
```http
POST /api/auth/logout-all
Authorization: Bearer your-jwt-token
```

### User Management Routes

**Note**: Most user routes require Admin role, except users can view/update their own profile.

#### Get All Users (Admin)
```http
GET /api/users?page=1&limit=10&sort=created_at&order=desc&role=Admin&status=Active
Authorization: Bearer admin-jwt-token
```

#### Get User by ID
```http
GET /api/users/:id  
Authorization: Bearer your-jwt-token
```

#### Create User (Admin)
```http
POST /api/users
Authorization: Bearer admin-jwt-token
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "Treasurer"
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "username": "updatedname",
  "email": "updated@example.com",
  "role": "Admin",     // Admin only
  "status": "Inactive" // Admin only  
}
```

#### Delete User (Admin)
```http
DELETE /api/users/:id
Authorization: Bearer admin-jwt-token
```

#### Get User Statistics (Admin)
```http
GET /api/users/stats
Authorization: Bearer admin-jwt-token
```

### File Management Routes

#### Get Upload URL
```http
POST /api/files/upload-url
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "filename": "document.pdf",
  "contentType": "application/pdf", 
  "size": 1024000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file-uuid",
      "filename": "unique-filename.pdf",
      "originalName": "document.pdf",
      "status": "uploading"
    },
    "uploadUrl": "https://s3-presigned-url",
    "instructions": {
      "method": "PUT",
      "headers": {
        "Content-Type": "application/pdf"
      }
    }
  }
}
```

#### Confirm Upload
```http
POST /api/files/:id/confirm
Authorization: Bearer your-jwt-token
```

#### Get My Files
```http
GET /api/files/my-files?page=1&limit=10
Authorization: Bearer your-jwt-token
```

#### Get All Files (Admin)
```http
GET /api/files?page=1&limit=10&status=uploaded
Authorization: Bearer admin-jwt-token
```

#### Get File with Download URL
```http
GET /api/files/:id
Authorization: Bearer your-jwt-token
```

#### Update File
```http
PUT /api/files/:id
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "filename": "renamed-file.pdf"
}
```

#### Delete File
```http
DELETE /api/files/:id
Authorization: Bearer your-jwt-token
```

#### Get File Statistics (Admin)
```http
GET /api/files/stats
Authorization: Bearer admin-jwt-token
```

## Role-Based Access Control

### Roles

- **Admin**: Full access to all endpoints and user management
- **Treasurer**: Can manage financial data (when implemented)  
- **Viewer**: Read-only access to allowed resources

### Permissions Matrix

| Endpoint | Admin | Treasurer | Viewer |
|----------|-------|-----------|--------|
| Auth endpoints | ✅ | ✅ | ✅ |
| Own profile | ✅ | ✅ | ✅ |
| User management | ✅ | ❌ | ❌ |
| User statistics | ✅ | ❌ | ❌ |
| Own files | ✅ | ✅ | ✅ |
| All files | ✅ | ❌ | ❌ |
| File statistics | ✅ | ❌ | ❌ |

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes  
- **File uploads**: 10 requests per minute

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate data (email/username) |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure access and refresh token system
- **Rate Limiting**: Prevents abuse and DOS attacks  
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for all responses
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Protection**: Prepared statements
- **Token Revocation**: Refresh token management

## AWS Integration

### S3 File Storage
- Pre-signed URLs for secure direct uploads
- Automatic file cleanup on deletion
- Support for any file type with size limits

### SES Email Service
- Welcome emails on registration
- Password reset notifications (when implemented)
- System notifications

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL, 
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Treasurer', 'Viewer') DEFAULT 'Viewer',
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table  
```sql
CREATE TABLE refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Files Table
```sql
CREATE TABLE files (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  s3_bucket VARCHAR(100) NOT NULL,
  status ENUM('uploading', 'uploaded', 'failed') DEFAULT 'uploading',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Deployment

### Production Checklist

1. **Environment Variables**
   - Set strong JWT secrets (min 32 characters)
   - Configure proper database credentials
   - Set up AWS credentials for S3/SES
   - Set NODE_ENV=production

2. **Database**
   - Create production database
   - Set up connection pooling
   - Configure backup strategy

3. **Security**
   - Configure CORS origins
   - Set up proper rate limits
   - Enable SSL/HTTPS
   - Configure security headers

4. **Monitoring**  
   - Set up log aggregation
   - Configure health checks
   - Monitor error rates
   - Track performance metrics

5. **AWS Services**
   - Create S3 bucket with proper IAM policies
   - Configure SES for email sending
   - Set up CloudWatch for monitoring

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Follow ESM module patterns
2. Add Zod validation for all inputs  
3. Use async/await with proper error handling
4. Add comprehensive logging
5. Write tests for new features
6. Update API documentation
7. Follow the existing code style