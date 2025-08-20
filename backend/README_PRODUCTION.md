# Khandeshwar Management System - Production Backend

A production-ready Express.js REST API built with modern technologies and best practices for the Khandeshwar Management System.

## 🚀 Features

- **Modern Architecture**: ESM modules, async/await, structured codebase
- **Security First**: JWT authentication, RBAC, bcrypt hashing, rate limiting, input validation
- **Database**: MySQL with connection pooling and automatic migrations  
- **Cloud Ready**: AWS S3 file storage, SES email service
- **Observability**: Structured logging with Pino, health checks, error tracking
- **Developer Experience**: Hot reload, comprehensive validation, standardized responses

## 🏗️ Architecture

```
backend/src/
├── app.js              # Express app configuration
├── server.js           # Server startup and graceful shutdown
├── config/             # Configuration management
│   ├── env.js         # Environment variables with validation
│   ├── db.js          # Database connection and migrations
│   └── aws.js         # AWS S3 and SES integration
├── middleware/         # Express middleware
│   ├── auth.js        # JWT authentication and RBAC
│   ├── cors.js        # CORS configuration
│   ├── error.js       # Error handling and responses
│   ├── rateLimit.js   # Rate limiting policies
│   └── validate.js    # Zod input validation schemas
├── models/            # Data models
│   ├── User.js        # User model with authentication
│   ├── RefreshToken.js # JWT refresh token management
│   └── File.js        # File metadata for S3 integration
├── controllers/       # Request handlers
│   ├── auth.js        # Authentication endpoints
│   ├── user.js        # User management
│   └── file.js        # File upload/download
├── routes/           # API route definitions
│   ├── auth.js       # /api/auth routes
│   ├── user.js       # /api/users routes
│   └── files.js      # /api/files routes
└── utils/           # Utility functions
    └── helpers.js   # Common helper functions
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- AWS account (optional, for S3/SES features)

### Setup

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```sql
   CREATE DATABASE khandeshwar_db;
   ```

4. **Start the server**
   ```bash
   # Development with hot reload
   npm run dev
   
   # Production
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `8081` |
| `DB_HOST` | MySQL host | No | `localhost` |
| `DB_USER` | MySQL username | No | `root` |
| `DB_PASSWORD` | MySQL password | No | `` |
| `DB_NAME` | Database name | No | `khandeshwar_db` |
| `DB_PORT` | MySQL port | No | `3306` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `JWT_EXPIRES_IN` | Access token expiry | No | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | No | `7d` |
| `AWS_REGION` | AWS region | No | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | No | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | No | - |
| `AWS_S3_BUCKET` | S3 bucket name | No | - |
| `SES_FROM_EMAIL` | SES sender email | No | - |
| `CORS_ORIGINS` | Allowed CORS origins | No | `http://localhost:5173` |

## 🔐 Security Features

- **JWT Authentication**: Secure access tokens with configurable expiry
- **Refresh Tokens**: Long-lived tokens with automatic rotation
- **Role-Based Access Control**: Admin, Treasurer, Viewer roles
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Rate Limiting**: Configurable limits per endpoint type
- **Input Validation**: Zod schemas for all requests
- **CORS Protection**: Configurable allowed origins
- **Security Headers**: Helmet middleware for security headers
- **SQL Injection Protection**: Prepared statements

## 📊 API Documentation

### Response Format

All API responses follow this standardized format:

```javascript
// Success
{
  "success": true,
  "data": { /* response data */ }
}

// Error
{
  "success": false,  
  "error": "Error message",
  "details": [] // Optional validation details
}
```

### Key Endpoints

- **Health**: `GET /health` - Server health check
- **Authentication**: `POST /api/auth/login` - User login
- **Registration**: `POST /api/auth/register` - User registration  
- **Profile**: `GET /api/auth/profile` - Get user profile
- **Users**: `GET /api/users` - List users (Admin only)
- **File Upload**: `POST /api/files/upload-url` - Get S3 upload URL
- **Files**: `GET /api/files/my-files` - Get user files

For complete API documentation, see [API_PRODUCTION_DOCS.md](./API_PRODUCTION_DOCS.md)

## 🏷️ Role-Based Permissions

### User Roles

- **Admin**: Full system access, user management
- **Treasurer**: Financial data access (when implemented)
- **Viewer**: Read-only access to permitted resources

### Permission Matrix

| Feature | Admin | Treasurer | Viewer |
|---------|-------|-----------|--------|
| Authentication | ✅ | ✅ | ✅ |
| Own Profile | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |
| File Management | ✅ | ✅ | ✅ |
| System Statistics | ✅ | ❌ | ❌ |

## 🗄️ Database Schema

### Automatic Migrations

The application automatically creates and migrates database tables on startup:

- **users**: User accounts with authentication
- **refresh_tokens**: JWT refresh token management
- **files**: File metadata for S3 integration

## ☁️ AWS Integration

### S3 File Storage
- Pre-signed URLs for secure direct uploads
- Support for any file type with configurable size limits
- Automatic cleanup on file deletion

### SES Email Service  
- Welcome emails on registration
- System notifications
- Graceful degradation when not configured

## 🧪 Testing

### API Testing

Run the included API test suite:

```bash
# Start server in another terminal
npm start

# Run tests
node test-api.js
```

The test suite validates:
- Health endpoints
- Error handling
- Authentication middleware
- Input validation
- Rate limiting
- CORS configuration

## 📈 Monitoring & Observability

### Logging

Structured logging with Pino:
- Request/response logging
- Error tracking with stack traces
- Performance monitoring
- Security event logging

### Health Checks

- Database connectivity
- AWS service availability  
- Memory and performance metrics

## 🚀 Deployment

### Production Checklist

1. **Security**
   - [ ] Set strong JWT secrets (32+ characters)
   - [ ] Configure proper CORS origins
   - [ ] Set NODE_ENV=production
   - [ ] Enable HTTPS/SSL

2. **Database**
   - [ ] Create production database
   - [ ] Set up backups
   - [ ] Configure connection pooling

3. **AWS Services**
   - [ ] Create S3 bucket with proper policies
   - [ ] Configure SES for email sending
   - [ ] Set up CloudWatch monitoring

4. **Infrastructure**
   - [ ] Set up load balancer
   - [ ] Configure auto-scaling
   - [ ] Set up log aggregation

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1
CMD ["npm", "start"]
```

## 📚 Development

### Code Style

- ESM modules throughout
- Async/await for asynchronous operations
- Comprehensive error handling
- Structured logging
- Input validation for all endpoints

### Adding New Features

1. Create model in `src/models/`
2. Add controller in `src/controllers/`  
3. Define routes in `src/routes/`
4. Add validation schemas in `src/middleware/validate.js`
5. Update API documentation
6. Add tests

## 🤝 Contributing

1. Follow the established code patterns
2. Add comprehensive input validation
3. Include proper error handling
4. Add logging for debugging
5. Update documentation
6. Test thoroughly

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

---

Built with ❤️ for the Khandeshwar Management System