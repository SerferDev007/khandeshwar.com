import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
import { Shop } from '../models/Shop.js';
import { Tenant } from '../models/Tenant.js';
import { Agreement } from '../models/Agreement.js';
import { Transaction } from '../models/Transaction.js';
import pino from 'pino';

const logger = pino({ name: 'rent-router' });
const router = express.Router();

// Generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Validation schemas using Zod
const rentPaymentCreateSchema = z.object({
  agreementId: z.string().min(1, 'Agreement ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['Cash', 'Check', 'Bank Transfer', 'UPI']).default('Cash'),
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
});

const rentPaymentUpdateSchema = rentPaymentCreateSchema.partial();

// Middleware to validate rent payment creation
const validateRentPaymentCreate = (req, res, next) => {
  try {
    req.body = rentPaymentCreateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Rent payment validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// GET /api/rent/units - Get all rental units (shops)
router.get('/units', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM shops ORDER BY shop_number');
    const units = rows.map(row => Shop.fromDbRow(row));
    
    return res.json({
      success: true,
      data: units
    });
  } catch (error) {
    logger.error('Get rental units error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rental units'
    });
  }
});

// GET /api/rent/tenants - Get all tenants
router.get('/tenants', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM tenants ORDER BY tenant_name');
    const tenants = rows.map(row => Tenant.fromDbRow(row));
    
    return res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    logger.error('Get tenants error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants'
    });
  }
});

// GET /api/rent/leases - Get all agreements (leases)
router.get('/leases', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.*, s.shop_number, t.tenant_name 
      FROM agreements a
      LEFT JOIN shops s ON a.shop_id = s.id
      LEFT JOIN tenants t ON a.tenant_id = t.id
      ORDER BY a.agreement_date DESC
    `);
    
    const leases = rows.map(row => ({
      ...Agreement.fromDbRow(row),
      shopNumber: row.shop_number,
      tenantName: row.tenant_name
    }));
    
    return res.json({
      success: true,
      data: leases
    });
  } catch (error) {
    logger.error('Get leases error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch leases'
    });
  }
});

// GET /api/rent/payments - Get all rent payments
router.get('/payments', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT t.*, a.shop_id, s.shop_number, tn.tenant_name
      FROM transactions t
      LEFT JOIN agreements a ON t.agreement_id = a.id
      LEFT JOIN shops s ON a.shop_id = s.id
      LEFT JOIN tenants tn ON a.tenant_id = tn.id
      WHERE t.type = 'RentIncome'
      ORDER BY t.date DESC, t.created_at DESC
    `);
    
    const payments = rows.map(row => ({
      ...Transaction.fromDbRow(row),
      shopNumber: row.shop_number,
      tenantName: row.tenant_name
    }));
    
    return res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get rent payments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rent payments'
    });
  }
});

// POST /api/rent/payments - Create new rent payment
router.post('/payments', authenticate, authorize(['Admin']), validateRentPaymentCreate, async (req, res) => {
  try {
    const { agreementId, date, amount, paymentMethod, description, receiptNumber } = req.body;
    
    // Verify agreement exists
    const agreementRows = await query(
      'SELECT a.*, s.shop_number, t.tenant_name FROM agreements a LEFT JOIN shops s ON a.shop_id = s.id LEFT JOIN tenants t ON a.tenant_id = t.id WHERE a.id = ?',
      [agreementId]
    );
    
    if (agreementRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found'
      });
    }
    
    const agreement = agreementRows[0];
    
    const paymentData = {
      id: generateId(),
      date,
      type: 'RentIncome',
      category: 'Rent',
      subCategory: 'Monthly Rent',
      description: description || `Rent payment for shop ${agreement.shop_number}`,
      amount,
      receiptNumber,
      tenantName: agreement.tenant_name,
      tenantContact: '',
      agreementId,
      shopNumber: agreement.shop_number,
      createdAt: new Date().toISOString(),
    };
    
    const payment = new Transaction(paymentData);
    const dbObject = payment.toDbObject();

    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject)
      .map(() => '?')
      .join(', ');
    const values = Object.values(dbObject);

    await query(
      `INSERT INTO transactions (${fields}) VALUES (${placeholders})`,
      values
    );

    logger.info('Rent payment created successfully:', { id: payment.id, amount: payment.amount, agreementId });
    return res.status(201).json({
      success: true,
      data: {
        ...payment,
        shopNumber: agreement.shop_number,
        tenantName: agreement.tenant_name
      }
    });
  } catch (error) {
    logger.error('Create rent payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create rent payment'
    });
  }
});

// GET /api/rent/payments/:id - Get rent payment by ID
router.get('/payments/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT t.*, a.shop_id, s.shop_number, tn.tenant_name
      FROM transactions t
      LEFT JOIN agreements a ON t.agreement_id = a.id
      LEFT JOIN shops s ON a.shop_id = s.id
      LEFT JOIN tenants tn ON a.tenant_id = tn.id
      WHERE t.id = ? AND t.type = 'RentIncome'
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rent payment not found'
      });
    }

    const payment = {
      ...Transaction.fromDbRow(rows[0]),
      shopNumber: rows[0].shop_number,
      tenantName: rows[0].tenant_name
    };
    
    return res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Get rent payment by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rent payment'
    });
  }
});

// DELETE /api/rent/payments/:id - Delete rent payment
router.delete('/payments/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM transactions WHERE id = ? AND type = ?',
      [id, 'RentIncome']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rent payment not found'
      });
    }

    logger.info('Rent payment deleted successfully:', { id });
    return res.json({
      success: true,
      data: { message: 'Rent payment deleted successfully' }
    });
  } catch (error) {
    logger.error('Delete rent payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete rent payment'
    });
  }
});

export default router;