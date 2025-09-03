/**
 * Shop Validation Utilities
 * 
 * Provides payload validation for shop creation with minimal manual validation
 * to catch required fields and basic type errors before database operations.
 */

/**
 * Validate shop payload for creation
 * 
 * @param {Object} body - Request body to validate
 * @returns {Object|null} - Returns { errors: Array } if validation fails, null if valid
 */
export function validateShopPayload(body) {
  const errors = [];

  // Check if body exists
  if (!body || typeof body !== 'object') {
    errors.push({ field: 'body', message: 'Request body is required' });
    return { errors };
  }

  // Required field: shopNumber
  if (!body.shopNumber) {
    errors.push({ field: 'shopNumber', message: 'Shop number is required' });
  } else if (typeof body.shopNumber !== 'string' || body.shopNumber.trim() === '') {
    errors.push({ field: 'shopNumber', message: 'Shop number must be a non-empty string' });
  }

  // Required field: size
  if (body.size === undefined || body.size === null) {
    errors.push({ field: 'size', message: 'Size is required' });
  } else if (typeof body.size !== 'number' || body.size <= 0) {
    errors.push({ field: 'size', message: 'Size must be a positive number' });
  }

  // Required field: monthlyRent
  if (body.monthlyRent === undefined || body.monthlyRent === null) {
    errors.push({ field: 'monthlyRent', message: 'Monthly rent is required' });
  } else if (typeof body.monthlyRent !== 'number' || body.monthlyRent <= 0) {
    errors.push({ field: 'monthlyRent', message: 'Monthly rent must be a positive number' });
  }

  // Required field: deposit
  if (body.deposit === undefined || body.deposit === null) {
    errors.push({ field: 'deposit', message: 'Deposit is required' });
  } else if (typeof body.deposit !== 'number' || body.deposit <= 0) {
    errors.push({ field: 'deposit', message: 'Deposit must be a positive number' });
  }

  // Optional field: status (if provided, must be valid)
  if (body.status !== undefined && body.status !== null) {
    const validStatuses = ['Vacant', 'Occupied', 'Maintenance'];
    if (!validStatuses.includes(body.status)) {
      errors.push({ 
        field: 'status', 
        message: `Status must be one of: ${validStatuses.join(', ')}` 
      });
    }
  }

  // Optional field: tenantId (if provided, must be string)
  if (body.tenantId !== undefined && body.tenantId !== null && typeof body.tenantId !== 'string') {
    errors.push({ field: 'tenantId', message: 'Tenant ID must be a string' });
  }

  // Optional field: agreementId (if provided, must be string)  
  if (body.agreementId !== undefined && body.agreementId !== null && typeof body.agreementId !== 'string') {
    errors.push({ field: 'agreementId', message: 'Agreement ID must be a string' });
  }

  // Optional field: description (if provided, must be string)
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  }

  return errors.length > 0 ? { errors } : null;
}