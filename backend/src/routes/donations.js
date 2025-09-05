import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query, allocateReceiptNumber, getNextReceiptNumber } from '../config/db.js';
import { Transaction } from '../models/Transaction.js';
import pino from 'pino';

const logger = pino({ name: 'donations-router' });
const router = express.Router();

// Validation schemas using Zod
const donationCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  receiptNumber: z.string().min(1, 'Receipt number is required'),
  donorName: z.string().min(1, 'Donor name is required'),
  donorContact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits').optional().or(z.literal('')),
  familyMembers: z.number().int().positive().optional(),
  amountPerPerson: z.number().positive().optional(),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

const donationUpdateSchema = donationCreateSchema.partial();

// Middleware to validate donation creation
const validateDonationCreate = (req, res, next) => {
  try {
    req.body = donationCreateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Donation validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Middleware to validate donation update
const validateDonationUpdate = (req, res, next) => {
  try {
    req.body = donationUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    logger.error('Donation update validation error:', error);
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// GET /api/donations - Get all donations
router.get('/', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM transactions WHERE type = ? ORDER BY date DESC, created_at DESC',
      ['Donation']
    );
    const donations = rows.map(row => Transaction.fromDbRow(row));
    
    return res.json({
      success: true,
      data: donations
    });
  } catch (error) {
    logger.error('Get donations error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch donations'
    });
  }
});

// GET /api/donations/next-receipt-number - Get next receipt number for preview
router.get('/next-receipt-number', authenticate, authorize(['Admin', 'Treasurer']), async (req, res) => {
  try {
    const nextReceiptNumber = await getNextReceiptNumber('Donation');
    
    return res.json({
      success: true,
      data: { receiptNumber: nextReceiptNumber }
    });
  } catch (error) {
    logger.error('Get next receipt number error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get next receipt number'
    });
  }
});

// GET /api/donations/:id - Get donation by ID
router.get('/:id', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      'SELECT * FROM transactions WHERE id = ? AND type = ?',
      [id, 'Donation']
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    const donation = Transaction.fromDbRow(rows[0]);
    return res.json({
      success: true,
      data: donation
    });
  } catch (error) {
    logger.error('Get donation by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch donation'
    });
  }
});

// POST /api/donations - Create new donation
router.post('/', authenticate, authorize(['Admin', 'Treasurer']), validateDonationCreate, async (req, res) => {
  try {
    const { idempotencyKey, ...donationData } = req.body;
    
    // Check for existing donation with the same idempotency key
    const existingDonation = await query(
      'SELECT * FROM transactions WHERE idempotency_key = ? AND type = ?',
      [idempotencyKey, 'Donation']
    );
    
    if (existingDonation.length > 0) {
      logger.info('Duplicate donation request detected:', { idempotencyKey });
      const donation = Transaction.fromDbRow(existingDonation[0]);
      return res.status(200).json({
        success: true,
        data: donation,
        message: 'Donation already exists'
      });
    }
    
    // Allocate receipt number atomically
    const allocatedReceiptNumber = await allocateReceiptNumber('Donation');
    
    const fullDonationData = {
      ...donationData,
      receiptNumber: allocatedReceiptNumber,
      idempotencyKey,
      id: generateId(),
      type: 'Donation',
    };
    
    const donation = new Transaction(fullDonationData);
    const dbObject = donation.toDbObject();

    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject)
      .map(() => '?')
      .join(', ');
    const values = Object.values(dbObject);

    await query(
      `INSERT INTO transactions (${fields}) VALUES (${placeholders})`,
      values
    );

    logger.info('Donation created successfully:', { 
      id: donation.id, 
      amount: donation.amount, 
      receiptNumber: allocatedReceiptNumber,
      idempotencyKey 
    });
    
    return res.status(201).json({
      success: true,
      data: donation
    });
  } catch (error) {
    logger.error('Create donation error:', error);
    
    // Handle specific duplicate key errors
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('uq_idempotency_key')) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate submission detected'
        });
      }
      if (error.message.includes('uq_receipt_number_type')) {
        return res.status(409).json({
          success: false,
          error: 'Receipt number already exists'
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create donation'
    });
  }
});

// PUT /api/donations/:id - Update donation
router.put('/:id', authenticate, authorize(['Admin', 'Treasurer']), validate(schemas.idParam), validateDonationUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if donation exists
    const existingRows = await query(
      'SELECT * FROM transactions WHERE id = ? AND type = ?',
      [id, 'Donation']
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    const updatedDonation = new Transaction({ ...existingRows[0], ...updateData });
    const dbObject = updatedDonation.toDbObject();

    const setClause = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => dbObject[key]);

    await query(
      `UPDATE transactions SET ${setClause} WHERE id = ? AND type = ?`,
      [...values, id, 'Donation']
    );

    logger.info('Donation updated successfully:', { id });
    return res.json({
      success: true,
      data: updatedDonation
    });
  } catch (error) {
    logger.error('Update donation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update donation'
    });
  }
});

// DELETE /api/donations/:id - Delete donation
router.delete('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM transactions WHERE id = ? AND type = ?',
      [id, 'Donation']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    logger.info('Donation deleted successfully:', { id });
    return res.json({
      success: true,
      data: { message: 'Donation deleted successfully' }
    });
  } catch (error) {
    logger.error('Delete donation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete donation'
    });
  }
});

export default router;