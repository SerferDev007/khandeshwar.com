import { v4 as uuidv4 } from 'uuid';

/**
 * Utility functions with comprehensive logging
 * Includes backend activity logging for all utility operations
 */

// Generate UUID v4
export const generateId = () => {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  console.log(`[${timestamp}] [HELPERS] [generateId] 🆔 Generated new UUID:`, { id });
  return id;
};

// Generate random string
export const generateRandomString = (length = 32) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [generateRandomString] 🎲 Generating random string:`, { requestedLength: length });
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  console.log(`[${timestamp}] [HELPERS] [generateRandomString] ✅ Random string generated:`, { 
    length: result.length, 
    actualLength: length,
    preview: result.substring(0, 8) + '...'
  });
  return result;
};

// Format file size in human readable format
export const formatFileSize = (bytes) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [formatFileSize] 📏 Formatting file size:`, { inputBytes: bytes });
  
  if (bytes === 0) {
    console.log(`[${timestamp}] [HELPERS] [formatFileSize] ✅ Formatted size:`, { result: '0 Bytes' });
    return '0 Bytes';
  }
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const result = `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  console.log(`[${timestamp}] [HELPERS] [formatFileSize] ✅ Formatted size:`, { 
    inputBytes: bytes, 
    result,
    unit: sizes[i]
  });
  return result;
};

// Sanitize filename for storage
export const sanitizeFilename = (filename) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [sanitizeFilename] 🧹 Sanitizing filename:`, { original: filename });
  
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  
  console.log(`[${timestamp}] [HELPERS] [sanitizeFilename] ✅ Filename sanitized:`, { 
    original: filename, 
    sanitized,
    changed: filename !== sanitized
  });
  return sanitized;
};

// Generate unique filename with timestamp
export const generateUniqueFilename = (originalName) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [generateUniqueFilename] 📁 Generating unique filename:`, { originalName });
  
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = sanitizeFilename(nameWithoutExt);
  const timestampNum = Date.now();
  const randomString = generateRandomString(8);
  
  const uniqueFilename = `${sanitizedName}_${timestampNum}_${randomString}.${extension}`;
  
  console.log(`[${timestamp}] [HELPERS] [generateUniqueFilename] ✅ Unique filename generated:`, { 
    originalName,
    sanitizedName,
    extension,
    timestamp: timestampNum,
    randomString,
    result: uniqueFilename
  });
  return uniqueFilename;
};

// Check if email is valid format
export const isValidEmail = (email) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [isValidEmail] 📧 Validating email format:`, { 
    email: email?.replace(/(.{3}).*@/, '$1***@') || 'undefined' 
  });
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  console.log(`[${timestamp}] [HELPERS] [isValidEmail] ✅ Email validation result:`, { 
    isValid,
    email: email?.replace(/(.{3}).*@/, '$1***@') || 'undefined'
  });
  return isValid;
};

// Check if password meets requirements
export const isValidPassword = (password) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [isValidPassword] 🔒 Validating password requirements:`, { 
    hasPassword: !!password,
    length: password?.length || 0
  });
  
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const isValid = passwordRegex.test(password);
  
  const requirements = {
    minLength: password?.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password)
  };
  
  console.log(`[${timestamp}] [HELPERS] [isValidPassword] ✅ Password validation result:`, { 
    isValid,
    requirements,
    overallValid: isValid
  });
  return isValid;
};

// Parse pagination parameters
export const parsePagination = (query) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [parsePagination] 📄 Parsing pagination parameters:`, { query });
  
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  
  const result = {
    page,
    limit,
    offset,
    sort: query.sort || 'created_at',
    order: ['asc', 'desc'].includes(query.order?.toLowerCase()) ? query.order.toLowerCase() : 'desc'
  };
  
  console.log(`[${timestamp}] [HELPERS] [parsePagination] ✅ Pagination parsed:`, { 
    input: query,
    result,
    calculations: { page, limit, offset }
  });
  return result;
};

// Create pagination info object
export const createPaginationInfo = (page, limit, total) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [createPaginationInfo] 📊 Creating pagination info:`, { page, limit, total });
  
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const parsedTotal = parseInt(total);
  const totalPages = Math.ceil(parsedTotal / parsedLimit);
  
  const paginationInfo = {
    page: parsedPage,
    limit: parsedLimit,
    total: parsedTotal,
    pages: totalPages,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1
  };
  
  console.log(`[${timestamp}] [HELPERS] [createPaginationInfo] ✅ Pagination info created:`, { 
    input: { page, limit, total },
    result: paginationInfo
  });
  return paginationInfo;
};

// Delay execution (for testing/demos)
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

// Remove sensitive fields from object
export const sanitizeObject = (obj, sensitiveFields = ['password', 'passwordHash', 'token', 'secret']) => {
  const sanitized = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
};

// Convert database row naming (snake_case) to camelCase
export const dbRowToCamelCase = (row) => {
  const camelCased = {};
  
  Object.keys(row).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    camelCased[camelKey] = row[key];
  });
  
  return camelCased;
};

// Convert camelCase object to snake_case for database
export const camelCaseToDbRow = (obj) => {
  const snakeCased = {};
  
  Object.keys(obj).forEach(key => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeCased[snakeKey] = obj[key];
  });
  
  return snakeCased;
};

/**
 * Normalize shop data to ensure consistent response structure across all endpoints.
 * This function handles various possible input shapes from database rows, partial updates,
 * or incomplete data, and returns a fully normalized shop object.
 * 
 * @param {Object} shopData - Raw shop data from database, API request, or partial object
 * @returns {Object} Normalized shop object with consistent structure and data types
 */
export const normalizeShop = (shopData) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HELPERS] [normalizeShop] 🏪 Normalizing shop data:`, { 
    hasData: !!shopData,
    dataType: typeof shopData,
    keys: shopData ? Object.keys(shopData) : []
  });
  
  if (!shopData || typeof shopData !== 'object') {
    const error = new Error('Invalid shop data: Expected object but received ' + typeof shopData);
    console.log(`[${timestamp}] [HELPERS] [normalizeShop] ❌ Normalization failed:`, { 
      error: error.message,
      receivedType: typeof shopData
    });
    throw error;
  }

  // Handle both camelCase (from Shop model) and snake_case (from database) inputs
  const data = {
    // Primary fields - required
    id: shopData.id || null,
    shopNumber: shopData.shopNumber || shopData.shop_number || null,
    size: shopData.size || null,
    monthlyRent: shopData.monthlyRent || shopData.monthly_rent || null,
    deposit: shopData.deposit || null,
    status: shopData.status || 'Vacant',
    
    // Optional fields - can be null
    tenantId: shopData.tenantId || shopData.tenant_id || null,
    agreementId: shopData.agreementId || shopData.agreement_id || null,
    description: shopData.description || null,
    
    // Timestamp field
    createdAt: shopData.createdAt || shopData.created_at || null
  };

  console.log(`[${timestamp}] [HELPERS] [normalizeShop] 🔄 Initial data mapping:`, { 
    mappedFields: Object.keys(data),
    hasId: !!data.id,
    hasShopNumber: !!data.shopNumber
  });

  // Validate and normalize required fields
  if (!data.id) {
    const error = new Error('Shop normalization failed: Missing required field "id"');
    console.log(`[${timestamp}] [HELPERS] [normalizeShop] ❌ Validation failed:`, { error: error.message });
    throw error;
  }
  
  if (!data.shopNumber) {
    const error = new Error('Shop normalization failed: Missing required field "shopNumber"');
    console.log(`[${timestamp}] [HELPERS] [normalizeShop] ❌ Validation failed:`, { error: error.message });
    throw error;
  }

  // Normalize numeric fields - ensure they are numbers and positive
  const numericFields = ['size', 'monthlyRent', 'deposit'];
  console.log(`[${timestamp}] [HELPERS] [normalizeShop] 🔢 Validating numeric fields:`, { numericFields });
  
  numericFields.forEach(field => {
    if (data[field] !== null) {
      const numValue = parseFloat(data[field]);
      if (isNaN(numValue) || numValue < 0) {
        const error = new Error(`Shop normalization failed: Invalid ${field} value - must be a positive number`);
        console.log(`[${timestamp}] [HELPERS] [normalizeShop] ❌ Numeric validation failed:`, { 
          field, 
          value: data[field], 
          error: error.message 
        });
        throw error;
      }
      data[field] = numValue;
      console.log(`[${timestamp}] [HELPERS] [normalizeShop] ✅ Numeric field validated:`, { 
        field, 
        originalValue: shopData[field], 
        normalizedValue: numValue 
      });
    } else {
      const error = new Error(`Shop normalization failed: Missing required field "${field}"`);
      console.log(`[${timestamp}] [HELPERS] [normalizeShop] ❌ Required field missing:`, { 
        field, 
        error: error.message 
      });
      throw error;
    }
  });

  // Normalize status field - ensure it's a valid enum value
  const validStatuses = ['Vacant', 'Occupied', 'Maintenance'];
  const originalStatus = data.status;
  if (!validStatuses.includes(data.status)) {
    data.status = 'Vacant'; // Default fallback
    console.log(`[${timestamp}] [HELPERS] [normalizeShop] ⚠️ Invalid status normalized:`, { 
      originalStatus, 
      normalizedStatus: data.status,
      validStatuses
    });
  } else {
    console.log(`[${timestamp}] [HELPERS] [normalizeShop] ✅ Status validated:`, { status: data.status });
  }

  // Normalize date field if present
  if (data.createdAt) {
    const originalDate = data.createdAt;
    if (data.createdAt instanceof Date) {
      data.createdAt = data.createdAt.toISOString();
    } else if (typeof data.createdAt === 'string') {
      // Validate the date string
      const parsedDate = new Date(data.createdAt);
      if (isNaN(parsedDate.getTime())) {
        data.createdAt = null;
        console.log(`[${timestamp}] [HELPERS] [normalizeShop] ⚠️ Invalid date string:`, { originalDate });
      } else {
        data.createdAt = parsedDate.toISOString();
      }
    } else {
      data.createdAt = null;
    }
    console.log(`[${timestamp}] [HELPERS] [normalizeShop] ✅ Date field processed:`, { 
      originalDate, 
      normalizedDate: data.createdAt 
    });
  }

  // Ensure string fields are properly formatted
  const originalShopNumber = data.shopNumber;
  data.shopNumber = String(data.shopNumber).trim();
  if (data.description && typeof data.description === 'string') {
    const originalDescription = data.description;
    data.description = data.description.trim() || null;
    console.log(`[${timestamp}] [HELPERS] [normalizeShop] 🧹 Description trimmed:`, { 
      originalLength: originalDescription.length,
      newLength: data.description?.length || 0
    });
  }

  console.log(`[${timestamp}] [HELPERS] [normalizeShop] ✅ Shop normalization completed:`, { 
    shopId: data.id,
    shopNumber: data.shopNumber,
    status: data.status,
    fieldCount: Object.keys(data).length,
    hasAllRequired: !!(data.id && data.shopNumber && data.size && data.monthlyRent && data.deposit)
  });

  return data;
};