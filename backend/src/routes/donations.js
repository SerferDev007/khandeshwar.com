import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { query } from '../config/db.js';
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
  receiptNumber: z.string().optional(),
  donorName: z.string().min(1, 'Donor name is required'),
  donorContact: z.string().regex(/^\d{10}$/, 'Contact must be 10 digits').optional().or(z.literal('')),
  familyMembers: z.number().int().positive().optional(),
  amountPerPerson: z.number().positive().optional(),
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
router.get('/', authenticate, authorize(['Admin']), async (req, res) => {
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

// GET /api/donations/:id - Get donation by ID
router.get('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), async (req, res) => {
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
router.post('/', authenticate, authorize(['Admin']), validateDonationCreate, async (req, res) => {
  try {
    const donationData = {
      ...req.body,
      id: generateId(),
      type: 'Donation',
    };
    
    const donation = new Transaction(donationData);
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

    logger.info('Donation created successfully:', { id: donation.id, amount: donation.amount });
    return res.status(201).json({
      success: true,
      data: donation
    });
  } catch (error) {
    logger.error('Create donation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create donation'
    });
  }
});

// PUT /api/donations/:id - Update donation
router.put('/:id', authenticate, authorize(['Admin']), validate(schemas.idParam), validateDonationUpdate, async (req, res) => {
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