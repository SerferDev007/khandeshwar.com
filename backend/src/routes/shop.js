import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
import { Shop } from '../models/Shop.js';
import { generateId } from '../utils/helpers.js';
import pino from 'pino';

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
  try {
    const shopData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    const shop = new Shop(shopData);
    const dbObject = shop.toDbObject();

    // Check if shop number already exists
    const existingShops = await query(
      'SELECT id FROM shops WHERE shop_number = ?',
      [shopData.shopNumber]
    );

    if (existingShops.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Shop number already exists'
      });
    }

    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject).map(() => '?').join(', ');
    const values = Object.values(dbObject);

    await query(
      `INSERT INTO shops (${fields}) VALUES (${placeholders})`,
      values
    );

    logger.info('Shop created successfully:', { id: shop.id, shopNumber: shop.shopNumber });
    return res.status(201).json({
      success: true,
      data: shop
    });
  } catch (error) {
    logger.error('Create shop error:', error);
    
    // Provide more specific error messages for common issues
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        success: false,
        error: 'Database table not found. Please contact administrator.'
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: 'Invalid tenant ID. The specified tenant does not exist.'
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Shop number already exists'
      });
    }
    
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