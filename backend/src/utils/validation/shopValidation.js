/**
 * Shop Validation Utilities
 * 
 * Provides payload validation for shop creation with minimal manual validation
 * to catch required fields and basic type errors before database operations.
 * Includes comprehensive backend logging for all validation operations.
 */

/**
 * Validate shop payload for creation
 * 
 * @param {Object} body - Request body to validate
 * @returns {Object|null} - Returns { errors: Array } if validation fails, null if valid
 */
export function validateShopPayload(body) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] 🔍 Starting shop payload validation:`, { 
    hasBody: !!body,
    bodyType: typeof body,
    bodyKeys: body && typeof body === 'object' ? Object.keys(body) : []
  });

  const errors = [];

  // Check if body exists
  if (!body || typeof body !== 'object') {
    const error = { field: 'body', message: 'Request body is required' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ Body validation failed:`, { 
      error,
      body,
      type: typeof body
    });
    return { errors };
  }

  console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] 📋 Validating fields:`, { 
    shopNumber: body.shopNumber,
    size: body.size,
    monthlyRent: body.monthlyRent,
    deposit: body.deposit,
    status: body.status,
    hasOptionalFields: !!(body.tenantId || body.agreementId || body.description)
  });

  // Required field: shopNumber
  if (!body.shopNumber) {
    const error = { field: 'shopNumber', message: 'Shop number is required' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ shopNumber missing:`, { error });
  } else if (typeof body.shopNumber !== 'string' || body.shopNumber.trim() === '') {
    const error = { field: 'shopNumber', message: 'Shop number must be a non-empty string' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ shopNumber invalid:`, { 
      error,
      value: body.shopNumber,
      type: typeof body.shopNumber
    });
  } else {
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ shopNumber valid:`, { 
      value: body.shopNumber,
      trimmed: body.shopNumber.trim()
    });
  }

  // Required field: size
  if (body.size === undefined || body.size === null) {
    const error = { field: 'size', message: 'Size is required' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ size missing:`, { error });
  } else if (typeof body.size !== 'number' || body.size <= 0) {
    const error = { field: 'size', message: 'Size must be a positive number' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ size invalid:`, { 
      error,
      value: body.size,
      type: typeof body.size
    });
  } else {
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ size valid:`, { value: body.size });
  }

  // Required field: monthlyRent
  if (body.monthlyRent === undefined || body.monthlyRent === null) {
    const error = { field: 'monthlyRent', message: 'Monthly rent is required' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ monthlyRent missing:`, { error });
  } else if (typeof body.monthlyRent !== 'number' || body.monthlyRent <= 0) {
    const error = { field: 'monthlyRent', message: 'Monthly rent must be a positive number' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ monthlyRent invalid:`, { 
      error,
      value: body.monthlyRent,
      type: typeof body.monthlyRent
    });
  } else {
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ monthlyRent valid:`, { value: body.monthlyRent });
  }

  // Required field: deposit
  if (body.deposit === undefined || body.deposit === null) {
    const error = { field: 'deposit', message: 'Deposit is required' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ deposit missing:`, { error });
  } else if (typeof body.deposit !== 'number' || body.deposit <= 0) {
    const error = { field: 'deposit', message: 'Deposit must be a positive number' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ deposit invalid:`, { 
      error,
      value: body.deposit,
      type: typeof body.deposit
    });
  } else {
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ deposit valid:`, { value: body.deposit });
  }

  // Optional field: status (if provided, must be valid)
  if (body.status !== undefined && body.status !== null) {
    const validStatuses = ['Vacant', 'Occupied', 'Maintenance'];
    if (!validStatuses.includes(body.status)) {
      const error = { 
        field: 'status', 
        message: `Status must be one of: ${validStatuses.join(', ')}` 
      };
      errors.push(error);
      console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ status invalid:`, { 
        error,
        value: body.status,
        validStatuses
      });
    } else {
      console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ status valid:`, { value: body.status });
    }
  }

  // Optional field: tenantId (if provided, must be string)
  if (body.tenantId !== undefined && body.tenantId !== null && typeof body.tenantId !== 'string') {
    const error = { field: 'tenantId', message: 'Tenant ID must be a string' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ tenantId invalid:`, { 
      error,
      value: body.tenantId,
      type: typeof body.tenantId
    });
  } else if (body.tenantId !== undefined && body.tenantId !== null) {
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ tenantId valid:`, { value: body.tenantId });
  }

  // Optional field: agreementId (if provided, must be string)  
  if (body.agreementId !== undefined && body.agreementId !== null && typeof body.agreementId !== 'string') {
    const error = { field: 'agreementId', message: 'Agreement ID must be a string' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ agreementId invalid:`, { 
      error,
      value: body.agreementId,
      type: typeof body.agreementId
    });
  } else if (body.agreementId !== undefined && body.agreementId !== null) {
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ agreementId valid:`, { value: body.agreementId });
  }

  // Optional field: description (if provided, must be string)
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    const error = { field: 'description', message: 'Description must be a string' };
    errors.push(error);
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ❌ description invalid:`, { 
      error,
      value: body.description,
      type: typeof body.description
    });
  } else if (body.description !== undefined && body.description !== null) {
    console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] ✅ description valid:`, { 
      value: body.description,
      length: body.description.length
    });
  }

  const result = errors.length > 0 ? { errors } : null;
  
  console.log(`[${timestamp}] [SHOP-VALIDATION] [validateShopPayload] 🎯 Validation completed:`, { 
    isValid: !result,
    errorCount: errors.length,
    errors: errors.map(e => `${e.field}: ${e.message}`),
    fieldCount: Object.keys(body).length
  });

  return result;
}