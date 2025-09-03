import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
import { Shop } from '../models/Shop.js';
import { generateId } from '../utils/helpers.js';
import pino from 'pino';
import { dbg, dbgMySQLError, dbgTimer, generateCorrelationId } from '../utils/debugLogger.js';

const logger = pino({ name: 'shop-router' });
const router = express.Router();

// Validation schemas using Zod
const shopCreateSchema = z.object({
  shopNumber: z.string().min(1, 'Shop number is required'),
  size: z.number().positive('Size must be positive'),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
  deposit: z.number().positive('Deposit must be positive'),
  status: z.enum(['Vacant', 'Occupied', 'Maintenance']).default('Vacant'),
  tenantId: z.string().optional(),
  agreementId: z.string().optional(),
  description: z.string().optional(),
});

const shopUpdateSchema = shopCreateSchema.partial().omit({ shopNumber: true });

// Middleware to validate shop creation
const validateShopCreate = (req, res, next) => {
  try {
    req.body = shopCreateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Shop validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Middleware to validate shop update
const validateShopUpdate = (req, res, next) => {
  try {
    req.body = shopUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Shop update validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Generate unique ID is imported from helpers
// const generateId = () => {
//   return Date.now().toString() + Math.random().toString(36).substr(2, 9);
// };

// GET /api/shops - Get all shops
router.get('/', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM shops ORDER BY shop_number ASC'
    );
    const shops = rows.map(row => Shop.fromDbRow(row));
    
    return res.json({
      success: true,
      data: shops
    });
  } catch (error) {
    logger.error('Get shops error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch shops'
    });
  }
});

// GET /api/shops/:id - Get shop by ID
router.get('/:id', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      'SELECT * FROM shops WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    const shop = Shop.fromDbRow(rows[0]);
    return res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    logger.error('Get shop error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch shop'
    });
  }
});

// POST /api/shops - Create new shop
router.post('/', authenticate, authorize(['Admin', 'Treasurer']), validateShopCreate, async (req, res) => {
  // Generate correlation ID for request tracking
  const requestId = generateCorrelationId();
  
  try {
    // === DIAGNOSTIC PHASE 1: REQUEST INTAKE ===
    dbg('shop-creation', 'request-received', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      bodyKeys: Object.keys(req.body || {}),
      rawBody: req.body,
      userId: req.user?.id,
      userRole: req.user?.role
    }, requestId);

    // === DIAGNOSTIC PHASE 2: DATA PREPARATION ===
    const shopData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    dbg('shop-creation', 'shop-data-prepared', {
      shopData,
      generatedId: shopData.id,
      createdAt: shopData.createdAt,
      originalBodyKeys: Object.keys(req.body || {}),
      finalDataKeys: Object.keys(shopData)
    }, requestId);

    // === DIAGNOSTIC PHASE 3: MODEL CONSTRUCTION ===
    const shop = new Shop(shopData);
    dbg('shop-creation', 'shop-model-created', {
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      modelProperties: Object.keys(shop),
      constructorSuccess: true
    }, requestId);

    // === DIAGNOSTIC PHASE 4: DATABASE OBJECT CONVERSION ===
    const dbObject = shop.toDbObject();
    dbg('shop-creation', 'db-object-created', {
      dbObjectKeys: Object.keys(dbObject),
      dbObjectSample: {
        id: dbObject.id,
        shop_number: dbObject.shop_number,
        size: dbObject.size,
        monthly_rent: dbObject.monthly_rent,
        status: dbObject.status,
        created_at: dbObject.created_at
      },
      allValues: Object.values(dbObject),
      nullValues: Object.entries(dbObject).filter(([k, v]) => v === null || v === undefined).map(([k]) => k),
      undefinedValues: Object.entries(dbObject).filter(([k, v]) => v === undefined).map(([k]) => k)
    }, requestId);

    // Validate that all expected columns are present
    const expectedColumns = ['id', 'shop_number', 'size', 'monthly_rent', 'deposit', 'status', 'tenant_id', 'agreement_id', 'created_at', 'description'];
    const missingColumns = expectedColumns.filter(col => !(col in dbObject));
    const extraColumns = Object.keys(dbObject).filter(col => !expectedColumns.includes(col));
    
    dbg('shop-creation', 'column-mapping-validation', {
      expectedColumns,
      actualColumns: Object.keys(dbObject),
      missingColumns,
      extraColumns,
      columnCount: { expected: expectedColumns.length, actual: Object.keys(dbObject).length }
    }, requestId);

    // === DIAGNOSTIC PHASE 5: UNIQUENESS CHECK ===
    const uniquenessTimer = dbgTimer('shop-creation', 'uniqueness-check', requestId);
    
    dbg('shop-creation', 'uniqueness-check-start', {
      shopNumber: shopData.shopNumber,
      sql: 'SELECT id FROM shops WHERE shop_number = ?',
      params: [shopData.shopNumber]
    }, requestId);

    const existingShops = await query(
      'SELECT id FROM shops WHERE shop_number = ?',
      [shopData.shopNumber]
    );

    uniquenessTimer({ existingShopsCount: existingShops.length });

    if (existingShops.length > 0) {
      dbg('shop-creation', 'duplicate-shop-detected', {
        shopNumber: shopData.shopNumber,
        existingIds: existingShops.map(s => s.id),
        conflictResolution: '409-conflict-response'
      }, requestId);

      return res.status(409).json({
        success: false,
        error: 'Shop number already exists'
      });
    }

    dbg('shop-creation', 'uniqueness-check-passed', {
      shopNumber: shopData.shopNumber,
      proceedToInsert: true
    }, requestId);

    // === DIAGNOSTIC PHASE 6: INSERT PREPARATION ===
    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject).map(() => '?').join(', ');
    const values = Object.values(dbObject);

    dbg('shop-creation', 'insert-preparation', {
      fields,
      placeholders,
      valueCount: values.length,
      placeholderCount: (placeholders.match(/\?/g) || []).length,
      parameterMatch: values.length === (placeholders.match(/\?/g) || []).length,
      sampleValues: values.slice(0, 5), // First 5 values for inspection
      sql: `INSERT INTO shops (${fields}) VALUES (${placeholders})`
    }, requestId);

    // === DIAGNOSTIC PHASE 7: DATABASE INSERT ===
    const insertTimer = dbgTimer('shop-creation', 'database-insert', requestId);
    
    dbg('shop-creation', 'insert-execution-start', {
      tableName: 'shops',
      operation: 'INSERT',
      fieldCount: fields.split(',').length,
      valueCount: values.length
    }, requestId);

    await query(
      `INSERT INTO shops (${fields}) VALUES (${placeholders})`,
      values
    );

    insertTimer({ success: true, operation: 'INSERT' });

    // === DIAGNOSTIC PHASE 8: SUCCESS RESPONSE ===
    dbg('shop-creation', 'creation-success', {
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      responseStatus: 201,
      totalProcessingSteps: 8
    }, requestId);

    logger.info('Shop created successfully:', { id: shop.id, shopNumber: shop.shopNumber, requestId });
    return res.status(201).json({
      success: true,
      data: shop
    });
  } catch (error) {
    // === DIAGNOSTIC PHASE 9: ERROR HANDLING ===
    dbg('shop-creation', 'error-caught', {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      errorType: typeof error,
      hasStack: !!error.stack
    }, requestId);

    // Enhanced MySQL error logging
    dbgMySQLError('shop-creation', error, {
      operation: 'shop-creation',
      phase: 'database-insert'
    }, requestId);

    logger.error('Create shop error:', { error: error.message, code: error.code, requestId });
    
    // Enhanced error classification with diagnostic logging
    if (error.code === 'ER_NO_SUCH_TABLE') {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'ER_NO_SUCH_TABLE',
        diagnosis: 'Database table not found',
        responseStatus: 500,
        userMessage: 'Database table not found. Please contact administrator.'
      }, requestId);
      
      return res.status(500).json({
        success: false,
        error: 'Database table not found. Please contact administrator.'
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'ER_NO_REFERENCED_ROW_2',
        diagnosis: 'Foreign key constraint violation - tenant does not exist',
        responseStatus: 400,
        userMessage: 'Invalid tenant ID. The specified tenant does not exist.'
      }, requestId);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid tenant ID. The specified tenant does not exist.'
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'ER_DUP_ENTRY',
        diagnosis: 'Duplicate entry for unique constraint',
        responseStatus: 409,
        userMessage: 'Shop number already exists',
        note: 'This should have been caught by uniqueness check'
      }, requestId);
      
      return res.status(409).json({
        success: false,
        error: 'Shop number already exists'
      });
    }

    // NEW: Enhanced error classification for additional MySQL error codes
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'ER_BAD_FIELD_ERROR',
        diagnosis: 'Column name mismatch between model and database schema',
        responseStatus: 500,
        userMessage: 'Database schema mismatch. Please contact administrator.',
        technicalNote: 'Check toDbObject() column mapping vs actual table schema'
      }, requestId);
      
      return res.status(500).json({
        success: false,
        error: 'Database schema mismatch. Please contact administrator.'
      });
    }

    if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'ER_NO_DEFAULT_FOR_FIELD',
        diagnosis: 'Missing required field with no default value',
        responseStatus: 400,
        userMessage: 'Missing required field. Please provide all necessary information.',
        technicalNote: 'Check for missing NOT NULL columns in INSERT'
      }, requestId);
      
      return res.status(400).json({
        success: false,
        error: 'Missing required field. Please provide all necessary information.'
      });
    }

    if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      dbg('shop-creation', 'error-classification', {
        errorCode: error.code,
        diagnosis: 'Data type mismatch or invalid value format',
        responseStatus: 400,
        userMessage: 'Invalid data format. Please check your input values.',
        technicalNote: 'Check data types match schema (numbers, dates, enum values)'
      }, requestId);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid data format. Please check your input values.'
      });
    }

    if (error.code === 'ER_DATA_TOO_LONG') {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'ER_DATA_TOO_LONG',
        diagnosis: 'Value exceeds column length limit',
        responseStatus: 400,
        userMessage: 'Input value too long. Please shorten your input.',
        technicalNote: 'Check VARCHAR/TEXT column length limits'
      }, requestId);
      
      return res.status(400).json({
        success: false,
        error: 'Input value too long. Please shorten your input.'
      });
    }

    // Catch parameter mismatch errors from our query helper
    if (error.code === 'PARAM_MISMATCH' || error.message?.includes('Parameter count mismatch')) {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'PARAM_MISMATCH',
        diagnosis: 'SQL parameter count mismatch detected by query helper',
        responseStatus: 500,
        userMessage: 'Database query error. Please contact administrator.',
        technicalNote: 'SQL placeholders do not match parameter count'
      }, requestId);
      
      return res.status(500).json({
        success: false,
        error: 'Database query error. Please contact administrator.'
      });
    }

    // Generic error fallback with enhanced diagnostics
    dbg('shop-creation', 'error-classification', {
      errorCode: error.code || 'UNKNOWN',
      diagnosis: 'Unhandled database error',
      responseStatus: 500,
      userMessage: 'Failed to create shop',
      technicalNote: 'Review diagnostic logs for specific error details',
      errorDetails: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      }
    }, requestId);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create shop'
    });
  }
});

// PUT /api/shops/:id - Update shop
router.put('/:id', authenticate, authorize(['Admin', 'Treasurer']), validate(schemas.idParam), validateShopUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if shop exists
    const existingRows = await query(
      'SELECT * FROM shops WHERE id = ?',
      [id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    const existingShop = Shop.fromDbRow(existingRows[0]);
    const updatedShop = new Shop({ ...existingShop, ...updateData });
    const dbObject = updatedShop.toDbObject();

    const setClause = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => dbObject[key]);

    await query(
      `UPDATE shops SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    logger.info('Shop updated successfully:', { id });
    return res.json({
      success: true,
      data: updatedShop
    });
  } catch (error) {
    logger.error('Update shop error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update shop'
    });
  }
});

// DELETE /api/shops/:id - Delete shop
router.delete('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM shops WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    logger.info('Shop deleted successfully:', { id });
    return res.json({
      success: true,
      data: { message: 'Shop deleted successfully' }
    });
  } catch (error) {
    logger.error('Delete shop error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete shop'
    });
  }
});

export default router;