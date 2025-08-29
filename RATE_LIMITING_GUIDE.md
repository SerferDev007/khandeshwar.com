# Rate Limiting Documentation

## Overview

The Khandeshwar Management System implements rate limiting to prevent overload and ensure fair usage of the API. This document explains the rate limiting behavior and how it affects users.

## Rate Limits

### Production Environment
- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes  
- **File uploads**: 10 requests per minute

### Development Environment
- **General endpoints**: 50 requests per minute (more lenient for development)
- **Authentication endpoints**: 5 requests per 15 minutes
- **File uploads**: 10 requests per minute

## User Experience

### Automatic Retry Logic
When you encounter a rate limit (429 error), the system automatically:

1. **Retries your request** up to 3 times with exponential backoff
2. **Shows user-friendly messages** instead of technical error codes
3. **Prevents multiple rapid form submissions** by disabling buttons during processing

### Error Messages
Instead of technical errors, you'll see user-friendly messages like:
- "Too many requests. Please wait a moment and try again. The system has rate limiting to prevent overload."
- "Shop number already exists. Please use a different shop number."

### Form Protection
- Submit buttons are automatically disabled while processing
- Multiple rapid clicks are prevented
- Loading states show "Submitting..." during processing

## Best Practices

### For Users
1. **Avoid rapid clicking** - Wait for forms to complete before submitting again
2. **Use reasonable intervals** - Space out your requests when bulk uploading
3. **Check for success messages** - Wait for confirmation before retrying

### For Developers
1. **Use development environment** - Has more lenient rate limits for testing
2. **Implement proper error handling** - The API client handles retries automatically
3. **Consider bulk operations** - For large data imports, use batch endpoints when available

## Technical Details

### Rate Limit Headers
The API returns standard rate limiting headers:
- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets

### Error Handling Flow
```
User Action → API Request → Rate Limited?
                    ↓
                 Retry 1 → Still Limited?
                    ↓  
                 Retry 2 → Still Limited?
                    ↓
                 Retry 3 → Still Limited?
                    ↓
              Show Error Message
```

## Configuration

Rate limits can be adjusted in the backend environment configuration:

```bash
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100  # Maximum requests per window
```

## Troubleshooting

### "Too many requests" Error
**Cause**: You've exceeded the rate limit for your IP address.

**Solutions**:
1. Wait for the rate limit window to reset (up to 15 minutes)
2. Avoid rapid form submissions or API calls
3. If developing, use the development environment with higher limits

### Slow Form Submissions
**Cause**: Automatic retry logic is handling rate limits in the background.

**Normal behavior**: The system will retry and eventually succeed, showing appropriate loading states.

### Persistent Rate Limiting
**Cause**: High traffic or aggressive automation.

**Solutions**:
1. Contact system administrator for IP whitelisting
2. Implement proper delays in automated scripts
3. Consider using batch operations for bulk data entry

## Contact

For rate limit increases or technical issues, contact the system administrator.