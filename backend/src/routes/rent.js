import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
import { Shop } from '../models/Shop.js';
import { Tenant } from '../models/Tenant.js';
import { Agreement } from '../models/Agreement.js';
import { Transaction } from '../models/Transaction.js';
import { generateId } from '../utils/helpers.js';
import pino from 'pino';

const logger = pino({ name: 'rent-router' });
const router = express.Router();

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

// Tenant validation schemas using Zod
const tenantCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  phone: z.string().min(5, 'Phone must be at least 5 characters').max(20, 'Phone must be at most 20 characters'),
  email: z.string().email('Invalid email format'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  businessType: z.string().min(2, 'Business type must be at least 2 characters').max(100, 'Business type must be at most 100 characters'),
  status: z.enum(['Active', 'Inactive']).optional(),
  idProof: z.string().optional()
});

const tenantUpdateSchema = tenantCreateSchema.partial();

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
    const rows = await query('SELECT * FROM tenants ORDER BY name');
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

// POST /api/rent/tenants - Create new tenant
router.post('/tenants', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    // Validate input
    const validatedData = tenantCreateSchema.parse(req.body);
    
    // Check for existing tenant with same phone or email
    const existingTenant = await query(
      'SELECT id, phone, email FROM tenants WHERE phone = ? OR email = ?',
      [validatedData.phone, validatedData.email]
    );
    
    if (existingTenant.length > 0) {
      const existing = existingTenant[0];
      const conflictField = existing.phone === validatedData.phone ? 'phone' : 'email';
      return res.status(409).json({
        success: false,
        error: `Tenant with this ${conflictField} already exists`
      });
    }
    
    // Create new tenant
    const tenantData = {
      id: generateId(),
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email,
      address: validatedData.address,
      businessType: validatedData.businessType,
      status: validatedData.status || 'Active',
      idProof: validatedData.idProof || null
      // created_at will be set by database default
    };
    
    const tenant = new Tenant(tenantData);
    const dbObject = tenant.toDbObject();
    
    // Remove created_at to let database handle it
    delete dbObject.created_at;
    
    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject).map(() => '?').join(', ');
    const values = Object.values(dbObject);
    
    await query(
      `INSERT INTO tenants (${fields}) VALUES (${placeholders})`,
      values
    );
    
    // Fetch the created tenant with the database-generated created_at
    const createdTenantRows = await query('SELECT * FROM tenants WHERE id = ?', [tenant.id]);
    const createdTenant = Tenant.fromDbRow(createdTenantRows[0]);
    
    logger.info('Tenant created successfully:', { id: tenant.id, name: tenant.name });
    return res.status(201).json({
      success: true,
      data: createdTenant
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    logger.error('Create tenant error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create tenant'
    });
  }
});

// GET /api/rent/tenants/:id - Get tenant by ID
router.get('/tenants/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM tenants WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    const tenant = Tenant.fromDbRow(rows[0]);
    
    return res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    logger.error('Get tenant by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant'
    });
  }
});

// PUT /api/rent/tenants/:id - Update tenant
router.put('/tenants/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tenant exists
    const existingRows = await query('SELECT * FROM tenants WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Validate input
    const validatedData = tenantUpdateSchema.parse(req.body);
    
    // Check for conflicts if phone or email is being updated
    if (validatedData.phone || validatedData.email) {
      const conflictQuery = [];
      const conflictValues = [];
      
      if (validatedData.phone) {
        conflictQuery.push('phone = ?');
        conflictValues.push(validatedData.phone);
      }
      
      if (validatedData.email) {
        conflictQuery.push('email = ?');
        conflictValues.push(validatedData.email);
      }
      
      conflictValues.push(id); // Exclude current tenant from conflict check
      
      const existingTenant = await query(
        `SELECT id, phone, email FROM tenants WHERE (${conflictQuery.join(' OR ')}) AND id != ?`,
        conflictValues
      );
      
      if (existingTenant.length > 0) {
        const existing = existingTenant[0];
        let conflictField = 'phone';
        if (validatedData.email && existing.email === validatedData.email) {
          conflictField = 'email';
        }
        return res.status(409).json({
          success: false,
          error: `Another tenant with this ${conflictField} already exists`
        });
      }
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case for database
        const dbField = key === 'businessType' ? 'business_type' : 
                       key === 'idProof' ? 'id_proof' : key;
        updateFields.push(`${dbField} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    updateValues.push(id);
    
    await query(
      `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated tenant
    const updatedRows = await query('SELECT * FROM tenants WHERE id = ?', [id]);
    const updatedTenant = Tenant.fromDbRow(updatedRows[0]);
    
    logger.info('Tenant updated successfully:', { id, updatedFields: Object.keys(validatedData) });
    return res.json({
      success: true,
      data: updatedTenant
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    logger.error('Update tenant error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update tenant'
    });
  }
});

// DELETE /api/rent/tenants/:id - Delete tenant
router.delete('/tenants/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tenant exists
    const existingRows = await query('SELECT * FROM tenants WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Check if tenant is referenced by any shops or agreements
    const referencedInShops = await query('SELECT id FROM shops WHERE tenant_id = ?', [id]);
    const referencedInAgreements = await query('SELECT id FROM agreements WHERE tenant_id = ?', [id]);
    
    if (referencedInShops.length > 0 || referencedInAgreements.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tenant: tenant is referenced by existing shops or agreements'
      });
    }
    
    // Delete tenant
    const result = await query('DELETE FROM tenants WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    logger.info('Tenant deleted successfully:', { id });
    return res.json({
      success: true,
      data: { message: 'Tenant deleted successfully' }
    });
  } catch (error) {
    logger.error('Delete tenant error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete tenant'
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