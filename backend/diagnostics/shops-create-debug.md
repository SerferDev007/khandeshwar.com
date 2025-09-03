# Shop Creation Diagnostic Implementation

This document explains the temporary diagnostic logging added to resolve HTTP 500 errors in the `POST /api/shops` endpoint.

## What Was Added

### 1. Debug Logger Utility (`src/utils/debugLogger.js`)
- **Purpose**: Structured diagnostic logging with correlation IDs
- **Features**:
  - Request correlation tracking (`req-timestamp-randomid`)
  - Automatic data sanitization (removes passwords, tokens)
  - MySQL-specific error diagnostics
  - Performance timing utilities
  - Development mode console output

### 2. Enhanced Shop Creation Route (`src/routes/shop.js`)
- **9 Diagnostic Phases** added to POST `/api/shops`:
  1. **Request Intake**: Logs raw request data, headers, user context
  2. **Data Preparation**: Tracks shopData construction and ID generation
  3. **Model Construction**: Verifies Shop model instantiation
  4. **DB Object Conversion**: Validates `toDbObject()` column mapping
  5. **Uniqueness Check**: Times and logs shop number duplicate detection
  6. **Insert Preparation**: Validates SQL field/placeholder matching
  7. **Database Insert**: Times actual database operation
  8. **Success Response**: Logs successful completion
  9. **Error Handling**: Comprehensive error classification and diagnostics

### 3. Enhanced Error Classification
Added handling for additional MySQL error codes:
- `ER_BAD_FIELD_ERROR`: Column name mismatch
- `ER_NO_DEFAULT_FOR_FIELD`: Missing required field
- `ER_TRUNCATED_WRONG_VALUE`: Data type mismatch
- `ER_DATA_TOO_LONG`: Value exceeds column limits
- `PARAM_MISMATCH`: SQL parameter count errors

## How to Interpret Logs

### Console Output Format (Development)
```
🔍 [shop-creation:request-received:req-1234567890-abc123def] { method: 'POST', bodyKeys: ['shopNumber', 'size'] }
🔍 [shop-creation:db-object-created:req-1234567890-abc123def] { dbObjectKeys: ['id', 'shop_number', ...] }
🔍 [shop-creation:mysql-error:req-1234567890-abc123def] { code: 'ER_BAD_FIELD_ERROR', sqlMessage: '...' }
```

### Key Diagnostic Points
- **Column Mapping Issues**: Look for `column-mapping-validation` logs showing missing/extra columns
- **Parameter Mismatches**: Check `insert-preparation` for placeholder vs value count
- **Timing Issues**: Phase timers show where slowdowns occur
- **MySQL Errors**: `mysql-error-diagnostics` provides specific guidance

### Common Error Patterns

#### 1. Column Mismatch (toDbObject vs Schema)
```json
{
  "label": "column-mapping-validation",
  "data": {
    "missingColumns": ["updated_at"],
    "extraColumns": ["extra_field"]
  }
}
```
**Fix**: Update `Shop.toDbObject()` or database schema

#### 2. Parameter Count Mismatch
```json
{
  "label": "insert-preparation", 
  "data": {
    "valueCount": 9,
    "placeholderCount": 10,
    "parameterMatch": false
  }
}
```
**Fix**: Check SQL query construction logic

#### 3. Missing Required Field
```json
{
  "label": "mysql-error",
  "data": {
    "code": "ER_NO_DEFAULT_FOR_FIELD",
    "sqlMessage": "Field 'status' doesn't have a default value"
  }
}
```
**Fix**: Ensure all NOT NULL fields are provided

## Testing the Diagnostics

### 1. Valid Shop Creation
```bash
curl -X POST http://localhost:8081/api/shops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shopNumber": "SHOP-001",
    "size": 100.5,
    "monthlyRent": 5000,
    "deposit": 15000,
    "status": "Vacant"
  }'
```

### 2. Duplicate Shop Number Test
```bash
# Create first shop, then repeat same request to trigger 409
```

### 3. Invalid Data Test
```bash
curl -X POST http://localhost:8081/api/shops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shopNumber": "SHOP-002",
    "size": "invalid-size",
    "monthlyRent": -1000
  }'
```

## Performance Impact

- **Minimal**: Only console.log in development mode
- **Memory**: Logs are not stored, only streamed
- **Timing**: < 1ms overhead per request
- **Production**: Debug logs disabled by default

## Removal Checklist

After the root cause is identified and fixed:

### 1. Remove Debug Logging
```bash
# Remove diagnostic phases from shop.js POST route
sed -i '/=== DIAGNOSTIC PHASE/,/dbg(/d' src/routes/shop.js

# Remove dbg, dbgTimer, dbgMySQLError calls
sed -i '/dbg[A-Za-z]*(/d' src/routes/shop.js

# Remove generateCorrelationId usage
sed -i '/generateCorrelationId()/d' src/routes/shop.js
```

### 2. Remove Debug Import
```javascript
// Remove from src/routes/shop.js:
import { dbg, dbgMySQLError, dbgTimer, generateCorrelationId } from '../utils/debugLogger.js';
```

### 3. Keep Enhanced Error Handling
**RETAIN** the new MySQL error code classifications:
- `ER_BAD_FIELD_ERROR` handling
- `ER_NO_DEFAULT_FOR_FIELD` handling
- `ER_TRUNCATED_WRONG_VALUE` handling
- `ER_DATA_TOO_LONG` handling
- `PARAM_MISMATCH` handling

### 4. Optional: Remove Debug Utility
```bash
rm src/utils/debugLogger.js
```

## Security Considerations

- **Data Sanitization**: Automatically removes passwords, tokens, authorization headers
- **Text Truncation**: Long fields (description) truncated to 200 chars
- **No Data Storage**: Logs are streamed, not persisted
- **Request IDs**: Safe random identifiers, no user data exposure

## Integration with Existing Logging

This diagnostic system complements the existing pino logger in the codebase:
- **Pino**: Structured production logging
- **Debug Logger**: Temporary diagnostic tracing
- **Console**: Development visibility

Both systems use similar structured log formats for consistency with PR #56.