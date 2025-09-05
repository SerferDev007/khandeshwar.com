import { v4 as uuidv4 } from 'uuid';

// Generate UUID v4
export const generateId = () => {
  return uuidv4();
};

// Generate random string
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format file size in human readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Sanitize filename for storage
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
};

// Generate unique filename with timestamp
export const generateUniqueFilename = (originalName) => {
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = sanitizeFilename(nameWithoutExt);
  const timestamp = Date.now();
  const randomString = generateRandomString(8);
  
  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
};

// Check if email is valid format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if password meets requirements
export const isValidPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Parse pagination parameters
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return {
    page,
    limit,
    offset,
    sort: query.sort || 'created_at',
    order: ['asc', 'desc'].includes(query.order?.toLowerCase()) ? query.order.toLowerCase() : 'desc'
  };
};

// Create pagination info object
export const createPaginationInfo = (page, limit, total) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const parsedTotal = parseInt(total);
  const totalPages = Math.ceil(parsedTotal / parsedLimit);
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    total: parsedTotal,
    pages: totalPages,
    hasNext: parsedPage < totalPages,
    hasPrev: parsedPage > 1
  };
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
  if (!shopData || typeof shopData !== 'object') {
    throw new Error('Invalid shop data: Expected object but received ' + typeof shopData);
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

  // Validate and normalize required fields
  if (!data.id) {
    throw new Error('Shop normalization failed: Missing required field "id"');
  }
  
  if (!data.shopNumber) {
    throw new Error('Shop normalization failed: Missing required field "shopNumber"');
  }

  // Normalize numeric fields - ensure they are numbers and positive
  const numericFields = ['size', 'monthlyRent', 'deposit'];
  numericFields.forEach(field => {
    if (data[field] !== null) {
      const numValue = parseFloat(data[field]);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error(`Shop normalization failed: Invalid ${field} value - must be a positive number`);
      }
      data[field] = numValue;
    } else {
      throw new Error(`Shop normalization failed: Missing required field "${field}"`);
    }
  });

  // Normalize status field - ensure it's a valid enum value
  const validStatuses = ['Vacant', 'Occupied', 'Maintenance'];
  if (!validStatuses.includes(data.status)) {
    data.status = 'Vacant'; // Default fallback
  }

  // Normalize date field if present
  if (data.createdAt) {
    if (data.createdAt instanceof Date) {
      data.createdAt = data.createdAt.toISOString();
    } else if (typeof data.createdAt === 'string') {
      // Validate the date string
      const parsedDate = new Date(data.createdAt);
      if (isNaN(parsedDate.getTime())) {
        data.createdAt = null;
      } else {
        data.createdAt = parsedDate.toISOString();
      }
    } else {
      data.createdAt = null;
    }
  }

  // Ensure string fields are properly formatted
  data.shopNumber = String(data.shopNumber).trim();
  if (data.description && typeof data.description === 'string') {
    data.description = data.description.trim() || null;
  }

  return data;
};