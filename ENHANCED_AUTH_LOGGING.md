# Enhanced Authentication Logging

This document describes the comprehensive logging enhancements added to both the backend and frontend to help debug persistent 401 Unauthorized/session expiration issues.

## Overview

The enhanced logging provides detailed information at every step of the authentication process, making it easy to pinpoint where and why authentication/session failures occur.

## Backend Logging Enhancements

### 1. Comprehensive Request Logging
Every authentication-protected endpoint logs:
- HTTP method and URL/route
- IP address and User-Agent
- Authorization header presence (with partial masking)
- Content-Type, Referer, Accept, Origin headers
- Timestamp

**Example Log:**
```json
{
  "level": 30,
  "msg": "Demo authentication attempt",
  "method": "GET",
  "url": "/api/users",
  "route": "/api/users",
  "ip": "127.0.0.1",
  "userAgent": "Test-Client/1.0",
  "authHeaderPresent": true,
  "authHeaderPrefix": "Bearer eyJ...",
  "contentType": "application/json",
  "referer": "https://test.com",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 2. Token Verification Logging
Detailed logging of token processing:
- Token verification attempts with partial token values (for security)
- Token length and format validation
- JWT decoding success/failure
- Token expiry information and timing

**Example Log:**
```json
{
  "level": 30,
  "msg": "Demo token verification attempt",
  "method": "GET",
  "url": "/api/users",
  "tokenStart": "eyJpZCI6MS...",
  "tokenLength": 84,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 3. Token Expiry Detection
Comprehensive token expiry logging:
- Token expiry date/time
- Time until expiry (in seconds and minutes)
- Whether token is expired

**Example Log:**
```json
{
  "level": 30,
  "msg": "Demo token decoded successfully",
  "userId": 1,
  "tokenExpiry": "2025-01-01T13:00:00.000Z",
  "timeUntilExpirySeconds": 3600,
  "timeUntilExpiryMin": 60,
  "isExpired": false
}
```

### 4. Enhanced 401 Response Logging
Detailed logging for all 401 responses:
- Specific failure reason (expired, invalid format, user not found)
- Request context (method, route, headers)
- Token information (when available)
- Timestamp

**Example Log:**
```json
{
  "level": 40,
  "msg": "401 Response: Demo token expired",
  "method": "GET",
  "url": "/api/users",
  "route": "/api/users",
  "reason": "TokenExpired",
  "expiredAt": "2001-09-09T01:46:40.000Z",
  "expiredSecondsAgo": 756119504,
  "headers": {
    "accept": "application/json",
    "origin": "https://test.com",
    "userAgent": "Test-Client/1.0"
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 5. Authentication Success Logging
Comprehensive success logging:
- User information (ID, username, role, status)
- Request details
- Token expiry information
- Timestamp

**Example Log:**
```json
{
  "level": 30,
  "msg": "Demo authentication successful",
  "userId": 1,
  "username": "admin",
  "role": "Admin",
  "status": "Active",
  "method": "GET",
  "url": "/api/users",
  "route": "/api/users",
  "tokenExpiryInfo": {
    "expiry": "2025-01-01T13:00:00.000Z",
    "timeUntilExpiryMin": 60
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 6. Error Handling Logging
Enhanced error logging for different failure scenarios:
- JsonWebTokenError (invalid token format)
- TokenExpiredError (expired tokens)  
- User not found errors
- Network/database errors

## Frontend Logging Enhancements

### 1. Token Management Logging
Detailed logging for all token operations:

**Setting Token:**
```javascript
console.log('🔐 Token Management: Setting auth token', {
  tokenPresent: true,
  tokenStart: 'eyJpZCI6MS...',
  tokenLength: 84,
  timestamp: '2025-01-01T12:00:00.000Z'
});
```

**Token Storage:**
```javascript
console.log('💾 Token Management: Token stored in localStorage', {
  action: 'store',
  tokenStart: 'eyJpZCI6MS...',
  timestamp: '2025-01-01T12:00:00.000Z'
});
```

### 2. Outgoing Request Logging
Every API request is logged with:
- HTTP method and endpoint
- Authorization status
- Headers (with masked token)
- Retry count

**Example Log:**
```javascript
console.log('📤 API Request:', {
  method: 'GET',
  url: 'http://localhost:8081/api/users',
  endpoint: '/api/users',
  hasAuth: true,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer eyJpZCI6MS...'
  },
  retryCount: 0,
  timestamp: '2025-01-01T12:00:00.000Z'
});
```

### 3. Response Logging
Comprehensive response logging:

**Successful Response:**
```javascript
console.log('📥 API Response:', {
  method: 'GET',
  url: 'http://localhost:8081/api/users',
  endpoint: '/api/users',
  status: 200,
  statusText: 'OK',
  success: true,
  hasData: true,
  timestamp: '2025-01-01T12:00:00.000Z'
});
```

### 4. 401 Error Logging
Enhanced 401 error logging:
```javascript
console.error('🚨 401 Unauthorized Response:', {
  method: 'GET',
  url: 'http://localhost:8081/api/users',
  endpoint: '/api/users',
  status: 401,
  statusText: 'Unauthorized',
  responseData: { success: false, error: 'Token expired' },
  headers: {
    'content-type': 'application/json',
    'www-authenticate': null
  },
  hadToken: true,
  tokenStart: 'eyJpZCI6MS...',
  timestamp: '2025-01-01T12:00:00.000Z'
});
```

### 5. Authentication Flow Logging
Enhanced login/logout logging:

**Login Attempt:**
```javascript
console.log('🔐 Auth: Login attempt', {
  email: 'adm***',
  hasPassword: true,
  timestamp: '2025-01-01T12:00:00.000Z'
});
```

**Login Success:**
```javascript
console.log('✅ Auth: Login successful', {
  email: 'adm***',
  hasTokens: true,
  timestamp: '2025-01-01T12:00:00.000Z'
});
```

## Testing the Enhanced Logging

### Running the Test Suite
A comprehensive test suite is provided to demonstrate all logging features:

```bash
# Start the demo server
cd backend
node demo-server.js

# In another terminal, run the logging test
node test-enhanced-logging.js
```

The test suite covers:
1. ✅ Login with enhanced logging
2. ✅ Valid authenticated requests
3. ✅ Requests without tokens (401)
4. ✅ Requests with expired tokens (401)
5. ✅ Requests with invalid token formats (401)
6. ✅ Requests with non-existent user tokens (401)

### Manual Testing
You can also test individual scenarios:

```bash
# Test login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test protected endpoint without token
curl -X GET http://localhost:8081/api/users

# Test with expired token
curl -X GET http://localhost:8081/api/users \
  -H "Authorization: Bearer eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBZG1pbiIsImV4cCI6MTAwMDAwMDAwMH0K"
```

## Security Considerations

The enhanced logging has been designed with security in mind:

1. **Token Masking**: Only partial token values are logged (first 10 characters + "...")
2. **Email Masking**: Email addresses are partially masked in frontend logs
3. **No Sensitive Data**: Passwords and full tokens are never logged
4. **Structured Logging**: Uses structured JSON logging for easy parsing and filtering

## Benefits for Debugging

The enhanced logging helps debug authentication issues by providing:

1. **Complete Request Context**: Every request includes full context
2. **Token Lifecycle Tracking**: Track tokens from creation to expiry
3. **Failure Point Identification**: Pinpoint exactly where auth fails
4. **Timing Information**: Understand token expiry timing issues
5. **User Context**: Link failures to specific users and roles
6. **Network Context**: IP addresses, user agents for security analysis

## Log Analysis

To analyze the logs effectively:

1. **Filter by Level**: Use log levels to focus on specific issues
   - INFO (30): Normal operations
   - WARN (40): Authentication failures
   - ERROR (50): System errors

2. **Search by Context**: Use structured fields for filtering
   - `userId`: Track specific user issues
   - `tokenStart`: Follow token lifecycle
   - `route`: Identify problematic endpoints
   - `reason`: Group similar failure types

3. **Timeline Analysis**: Use timestamps to understand sequence of events

This comprehensive logging makes debugging authentication issues straightforward by providing complete visibility into the authentication process.