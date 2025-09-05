import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';
import { RentPenalty } from '../models/RentPenalty.js';
import { generateId } from '../utils/helpers.js';
import pino from 'pino';

const logger = pino({ name: 'rent-penalties-router' });
const router = express.Router();

// GET /api/rent-penalties - Get all rent penalties
router.get('/', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM rent_penalties ORDER BY created_at DESC');
    const rentPenalties = rows.map(row => RentPenalty.fromDbRow(row));
    
    res.json({
      success: true,
      data: rentPenalties
    });
  } catch (error) {
    logger.error('Get rent penalties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rent penalties'
    });
  }
});

// GET /api/rent-penalties/:id - Get rent penalty by ID
router.get('/:id', authenticate, authorize(['Admin', 'Treasurer', 'Viewer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM rent_penalties WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rent penalty not found'
      });
    }

    const rentPenalty = RentPenalty.fromDbRow(rows[0]);
    res.json({
      success: true,
      data: rentPenalty
    });
  } catch (error) {
    logger.error('Get rent penalty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rent penalty'
    });
  }
});

// POST /api/rent-penalties - Create new rent penalty
router.post('/', authenticate, authorize(['Admin', 'Treasurer']), async (req, res) => {
  try {
    const rentPenaltyData = {
      ...req.body,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const rentPenalty = new RentPenalty(rentPenaltyData);
    const dbObject = rentPenalty.toDbObject();

    const fields = Object.keys(dbObject).join(', ');
    const placeholders = Object.keys(dbObject).map(() => '?').join(', ');
    const values = Object.values(dbObject);

    await query(
      `INSERT INTO rent_penalties (${fields}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({
      success: true,
      data: rentPenalty
    });
  } catch (error) {
    logger.error('Create rent penalty error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/rent-penalties/:id - Update rent penalty
router.put('/:id', authenticate, authorize(['Admin', 'Treasurer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if rent penalty exists
    const existingRows = await query('SELECT * FROM rent_penalties WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rent penalty not found'
      });
    }

    const rentPenalty = new RentPenalty({ ...existingRows[0], ...updateData });
    const dbObject = rentPenalty.toDbObject();

    const setClause = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(dbObject)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => dbObject[key]);

    await query(`UPDATE rent_penalties SET ${setClause} WHERE id = ?`, [...values, id]);

    res.json({
      success: true,
      data: rentPenalty
    });
  } catch (error) {
    logger.error('Update rent penalty error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/rent-penalties/:id - Delete rent penalty
router.delete('/:id', authenticate, authorize(['Admin', 'Treasurer']), validate(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM rent_penalties WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rent penalty not found'
      });
    }

    res.json({
      success: true,
      message: 'Rent penalty deleted successfully'
    });
  } catch (error) {
    logger.error('Delete rent penalty error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;