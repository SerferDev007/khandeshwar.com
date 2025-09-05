import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
import { Shop } from '../models/Shop.js';
import { generateId, normalizeShop } from '../utils/helpers.js';
import pino from 'pino';
import { dbg, dbgMySQLError, dbgTimer, generateCorrelationId } from '../utils/debugLogger.js';
import { filterUndefined, buildInsertStatement, assertNoUndefinedParams } from '../utils/sqlHelpers.js';
import { validateShopPayload } from '../utils/validation/shopValidation.js';

const logger = pino({ name: 'shop-router' });
const router = express.Router();

// Generate unique ID is imported from helpers
// const generateId = () => {
//   return Date.now().toString() + Math.random().toString(36).substr(2, 9);
// };

// GET /api/shops - Get all shops with pagination and filtering
router.get('/', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), async (req, res) => {
  // Generate correlation ID for request tracking
  const requestId = generateCorrelationId();
  
  try {
    // === DIAGNOSTIC PHASE 1: REQUEST INTAKE ===
    dbg('shop-list', 'request-received', {
      method: req.method,
      url: req.url,
      query: req.query,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      userRole: req.user?.role
    }, requestId);

    // === PHASE 2: INPUT VALIDATION AND PARSING ===
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    // Validate status if provided
    const validStatuses = ['Vacant', 'Occupied', 'Maintenance'];
    if (status && !validStatuses.includes(status)) {
      dbg('shop-list', 'error', {
        errorName: 'ValidationError', 
        message: 'Invalid status value',
        providedStatus: status,
        validStatuses
      }, requestId);
      
      return res.status(400).json({
        success: false,
        errors: [{ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }]
      });
    }

    // === PHASE 3: BUILD DYNAMIC QUERY ===
    let whereClauses = [];
    let queryParams = [];

    if (status) {
      whereClauses.push('status = ?');
      queryParams.push(status);
    }

    if (search) {
      whereClauses.push('(shop_number LIKE ? OR description LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Build main select query
    const selectQuery = `
      SELECT id, shop_number, size, monthly_rent, deposit, status, 
             tenant_id, agreement_id, description, created_at 
      FROM shops 
      ${whereClause} 
      ORDER BY created_at DESC, id DESC 
      LIMIT ? OFFSET ?
    `;
    
    // Build count query
    const countQuery = `SELECT COUNT(*) as total FROM shops ${whereClause}`;

    dbg('shop-list', 'query-built', {
      selectQuery: selectQuery.replace(/\s+/g, ' ').trim(),
      countQuery: countQuery.replace(/\s+/g, ' ').trim(),
      whereClauses,
      queryParams: queryParams.length,
      pagination: { page, limit, offset }
    }, requestId);

    // === PHASE 4: EXECUTE COUNT QUERY ===
    const countTimer = dbgTimer('shop-list', 'db-count', requestId);
    const countResults = await query(countQuery, queryParams);
    const total = countResults[0].total;
    countTimer({ total });

    // === PHASE 5: EXECUTE MAIN QUERY ===
    const fetchTimer = dbgTimer('shop-list', 'db-fetch', requestId);
    const selectParams = [...queryParams, limit, offset];
    const rows = await query(selectQuery, selectParams);
    fetchTimer({ itemCount: rows.length });

    // === PHASE 6: TRANSFORM RESULTS ===
    // First convert database rows to Shop objects, then normalize for consistent response structure
    const rawShops = rows.map(row => Shop.fromDbRow(row));
    
    // === PHASE 6.1: NORMALIZE SHOP DATA ===
    // Apply normalization to ensure consistent response structure and handle any data inconsistencies
    const shops = rawShops.map(shop => {
      try {
        return normalizeShop(shop);
      } catch (normalizationError) {
        // Log normalization errors but don't fail the entire request
        dbg('shop-list', 'normalization-warning', {
          shopId: shop.id || 'unknown',
          error: normalizationError.message,
          rawShopData: shop
        }, requestId);
        
        // Return the raw shop data if normalization fails, rather than breaking the response
        return shop;
      }
    });

    // === PHASE 7: BUILD RESPONSE ===
    const hasMore = page * limit < total;
    const pagination = {
      page,
      limit, 
      total,
      hasMore
    };

    const response = {
      success: true,
      data: {
        items: shops,
        pagination
      }
    };

    dbg('shop-list', 'success', {
      itemCount: shops.length,
      page,
      limit,
      total,
      hasMore,
      filters: { status: status || 'none', search: search || 'none' }
    }, requestId);

    return res.json(response);

  } catch (error) {
    dbg('shop-list', 'error', {
      errorName: error.name || 'UnknownError',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    }, requestId);
    
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

    const rawShop = Shop.fromDbRow(rows[0]);
    
    // Normalize shop data for consistent response structure
    const normalizedShop = normalizeShop(rawShop);
    
    return res.json({
      success: true,
      data: normalizedShop
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
router.post('/', authenticate, authorize(['Admin', 'Treasurer']), async (req, res) => {
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

    // === DIAGNOSTIC PHASE 2: PAYLOAD VALIDATION ===
    const validationResult = validateShopPayload(req.body);
    
    if (validationResult && validationResult.errors) {
      dbg('shop-creation', 'validation-failed', {
        errorCount: validationResult.errors.length,
        errors: validationResult.errors,
        originalPayload: req.body
      }, requestId);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.errors
      });
    }

    dbg('shop-creation', 'validation-passed', {
      validatedFields: Object.keys(req.body || {}),
      proceedToDataPreparation: true
    }, requestId);

    // === DIAGNOSTIC PHASE 3: DATA PREPARATION WITH DEFAULTS ===
    const shopData = {
      id: generateId(),
      shopNumber: req.body.shopNumber,
      size: req.body.size,
      monthlyRent: req.body.monthlyRent,
      deposit: req.body.deposit,
      status: req.body.status || 'Vacant', // Default to 'Vacant' if not provided
      tenantId: req.body.tenantId || null, // Explicit null for optional fields
      agreementId: req.body.agreementId || null, // Explicit null for optional fields
      // Omit createdAt intentionally to let DB default (CURRENT_TIMESTAMP) apply
      description: req.body.description || null // Explicit null for optional field
    };
    
    dbg('shop-creation', 'shop-data-prepared', {
      shopData,
      generatedId: shopData.id,
      appliedDefaults: {
        status: !req.body.status ? 'Vacant' : 'from_request',
        tenantId: !req.body.tenantId ? 'null' : 'from_request',
        agreementId: !req.body.agreementId ? 'null' : 'from_request',
        description: !req.body.description ? 'null' : 'from_request'
      },
      originalBodyKeys: Object.keys(req.body || {}),
      finalDataKeys: Object.keys(shopData)
    }, requestId);

    // === DIAGNOSTIC PHASE 4: MODEL CONSTRUCTION ===
    const shop = new Shop(shopData);
    dbg('shop-creation', 'shop-model-created', {
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      modelProperties: Object.keys(shop),
      constructorSuccess: true
    }, requestId);

    // === DIAGNOSTIC PHASE 5: DATABASE OBJECT CONVERSION ===
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

    // === DIAGNOSTIC PHASE 6: FILTER UNDEFINED VALUES ===
    const { filtered: filteredDbObject, removed: removedColumns } = filterUndefined(dbObject);
    
    if (removedColumns.length > 0) {
      dbg('shop-creation', 'undefined-columns-removed', {
        removedColumns,
        originalColumnCount: Object.keys(dbObject).length,
        filteredColumnCount: Object.keys(filteredDbObject).length,
        removedForDbDefaults: removedColumns.includes('created_at') ? ['created_at'] : [],
        removedOther: removedColumns.filter(col => col !== 'created_at')
      }, requestId);
    }

    // Validate that all expected columns are present after filtering
    const expectedColumns = ['id', 'shop_number', 'size', 'monthly_rent', 'deposit', 'status', 'tenant_id', 'agreement_id', 'description'];
    const actualColumns = Object.keys(filteredDbObject);
    const missingColumns = expectedColumns.filter(col => !(col in filteredDbObject));
    
    dbg('shop-creation', 'column-mapping-validation', {
      expectedColumns,
      actualColumns,
      missingColumns,
      columnCount: { expected: expectedColumns.length, actual: actualColumns.length },
      createdAtOmitted: removedColumns.includes('created_at') ? 'intentional_for_db_default' : false
    }, requestId);

    // === DIAGNOSTIC PHASE 7: UNIQUENESS CHECK ===
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

    // === DIAGNOSTIC PHASE 8: BUILD INSERT STATEMENT ===
    const { sql, values, fields, placeholders } = buildInsertStatement('shops', filteredDbObject);

    dbg('shop-creation', 'insert-preparation', {
      fields,
      placeholders,
      valueCount: values.length,
      placeholderCount: (placeholders.match(/\?/g) || []).length,
      parameterMatch: values.length === (placeholders.match(/\?/g) || []).length,
      sampleValues: values.slice(0, 5), // First 5 values for inspection
      fieldCount: fields.split(',').length,
      sql
    }, requestId);

    // === DEFENSIVE ASSERTION: NO UNDEFINED PARAMETERS ===
    try {
      assertNoUndefinedParams(values, fields);
      
      dbg('shop-creation', 'parameter-validation-passed', {
        valueCount: values.length,
        allParametersValid: true,
        proceedToExecution: true
      }, requestId);
    } catch (assertionError) {
      dbg('shop-creation', 'parameter-validation-failed', {
        error: assertionError.message,
        errorCode: assertionError.code,
        undefinedFields: assertionError.undefinedFields,
        undefinedIndexes: assertionError.undefinedIndexes
      }, requestId);

      return res.status(500).json({
        success: false,
        error: 'Internal parameter binding error. Please contact administrator.'
      });
    }

    // === DIAGNOSTIC PHASE 9: DATABASE INSERT ===
    const insertTimer = dbgTimer('shop-creation', 'database-insert', requestId);
    
    dbg('shop-creation', 'insert-execution-start', {
      tableName: 'shops',
      operation: 'INSERT',
      fieldCount: fields.split(',').length,
      valueCount: values.length
    }, requestId);

    await query(sql, values);

    insertTimer({ success: true, operation: 'INSERT' });

    // === DIAGNOSTIC PHASE 10: SUCCESS RESPONSE ===
    dbg('shop-creation', 'creation-success', {
      shopId: shop.id,
      shopNumber: shop.shopNumber,
      responseStatus: 201,
      totalProcessingSteps: 10
    }, requestId);

    logger.info('Shop created successfully:', { id: shop.id, shopNumber: shop.shopNumber, requestId });
    
    // === PHASE 10.1: NORMALIZE RESPONSE DATA ===
    // Normalize the created shop data to ensure consistent response structure
    // Note: We don't include createdAt in response since it wasn't retrieved from DB
    const normalizedShop = normalizeShop(shop);
    
    return res.status(201).json({
      success: true,
      data: normalizedShop
    });
  } catch (error) {
    // === DIAGNOSTIC PHASE 11: ERROR HANDLING ===
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
    
    // Handle our new UNDEFINED_SQL_PARAM error
    if (error.code === 'UNDEFINED_SQL_PARAM') {
      dbg('shop-creation', 'error-classification', {
        errorCode: 'UNDEFINED_SQL_PARAM',
        diagnosis: 'Undefined parameters detected in values array',
        responseStatus: 500,
        userMessage: 'Internal parameter binding error. Please contact administrator.',
        technicalNote: 'Check parameter filtering and default value assignment'
      }, requestId);
      
      return res.status(500).json({
        success: false,
        error: 'Internal parameter binding error. Please contact administrator.'
      });
    }
    
    // Enhanced error classification with diagnostic logging (existing error handlers remain the same)
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
router.put('/:id', authenticate, authorize(['Admin', 'Treasurer']), validate(schemas.idParam), async (req, res) => {
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
    
    // Normalize the updated shop data for consistent response structure
    const normalizedShop = normalizeShop(updatedShop);
    
    return res.json({
      success: true,
      data: normalizedShop
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