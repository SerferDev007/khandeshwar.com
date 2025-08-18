const express = require('express');
const router = express.Router();
const db = require('../models/db');

/**
 * Devotees Routes for Temple Management System
 * 
 * Routes:
 * - GET / - Get all devotees
 * - GET /:id - Get devotee by ID
 * - POST / - Create new devotee
 * - PUT /:id - Update devotee
 * - DELETE /:id - Delete devotee
 * - GET /search - Search devotees
 */

// Search devotees - must be before /:id route
router.get('/search', async (req, res) => {
    try {
        const { q, type = 'name' } = req.query;

        if (!q) {
            return res.status(400).json({
                error: 'Search query is required'
            });
        }

        // TODO: Implement search based on type (name, phone, email)
        // TODO: Use LIKE queries or full-text search
        
        res.json({
            message: 'Search devotees endpoint - implementation pending',
            data: {
                devotees: [],
                search_query: q,
                search_type: type
            }
        });
    } catch (error) {
        console.error('Search devotees error:', error);
        res.status(500).json({
            error: 'Internal server error while searching devotees'
        });
    }
});

// Get all devotees
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, membership_type, is_active = true } = req.query;
        const offset = (page - 1) * limit;

        // Build where clause
        let whereClause = '';
        let whereParams = [];

        if (is_active !== undefined) {
            whereClause += 'is_active = ?';
            whereParams.push(is_active === 'true');
        }

        if (membership_type) {
            if (whereClause) whereClause += ' AND ';
            whereClause += 'membership_type = ?';
            whereParams.push(membership_type);
        }

        // TODO: Implement actual database query
        // const devotees = await db.select('devotees', '*', whereClause, whereParams, 'created_at DESC', `${offset}, ${limit}`);
        
        // Skeleton response
        res.json({
            message: 'Get devotees endpoint - implementation pending',
            data: {
                devotees: [
                    {
                        id: 1,
                        full_name: 'Sample Devotee',
                        email: 'devotee@example.com',
                        phone: '+1234567890',
                        membership_type: 'regular',
                        is_active: true,
                        created_at: new Date().toISOString()
                    }
                ],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 1,
                    pages: 1
                }
            }
        });
    } catch (error) {
        console.error('Get devotees error:', error);
        res.status(500).json({
            error: 'Internal server error while fetching devotees'
        });
    }
});

// Get devotee by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Valid devotee ID is required'
            });
        }

        // TODO: Implement actual database query
        // const devotee = await db.select('devotees', '*', 'id = ?', [id]);
        
        // Skeleton response
        res.json({
            message: 'Get devotee by ID endpoint - implementation pending',
            data: {
                devotee: {
                    id: parseInt(id),
                    full_name: 'Sample Devotee',
                    email: 'devotee@example.com',
                    phone: '+1234567890',
                    address: 'Sample Address',
                    date_of_birth: '1990-01-01',
                    gender: 'male',
                    occupation: 'Engineer',
                    membership_type: 'regular',
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Get devotee error:', error);
        res.status(500).json({
            error: 'Internal server error while fetching devotee'
        });
    }
});

// Create new devotee
router.post('/', async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            address,
            date_of_birth,
            gender,
            occupation,
            emergency_contact_name,
            emergency_contact_phone,
            membership_type = 'regular'
        } = req.body;

        // Validate required fields
        if (!full_name || !phone) {
            return res.status(400).json({
                error: 'Full name and phone are required'
            });
        }

        // TODO: Validate phone format
        // TODO: Validate email format if provided
        // TODO: Check if devotee already exists
        // TODO: Insert into database
        
        const devoteeData = {
            full_name,
            email,
            phone,
            address,
            date_of_birth,
            gender,
            occupation,
            emergency_contact_name,
            emergency_contact_phone,
            membership_type,
            membership_start_date: new Date().toISOString().split('T')[0]
        };

        // const result = await db.insert('devotees', devoteeData);

        res.status(201).json({
            message: 'Create devotee endpoint - implementation pending',
            data: {
                devotee: {
                    id: 1,
                    ...devoteeData,
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Create devotee error:', error);
        res.status(500).json({
            error: 'Internal server error while creating devotee'
        });
    }
});

// Update devotee
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Valid devotee ID is required'
            });
        }

        // Remove ID from update data
        delete updateData.id;
        delete updateData.created_at;

        // TODO: Check if devotee exists
        // TODO: Validate update data
        // TODO: Update in database
        
        // const result = await db.update('devotees', updateData, 'id = ?', [id]);

        res.json({
            message: 'Update devotee endpoint - implementation pending',
            data: {
                devotee: {
                    id: parseInt(id),
                    ...updateData,
                    updated_at: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Update devotee error:', error);
        res.status(500).json({
            error: 'Internal server error while updating devotee'
        });
    }
});

// Delete devotee (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Valid devotee ID is required'
            });
        }

        // TODO: Check if devotee exists
        // TODO: Soft delete (set is_active = false)
        // const result = await db.update('devotees', { is_active: false }, 'id = ?', [id]);

        res.json({
            message: 'Devotee deactivated successfully',
            data: {
                devotee_id: parseInt(id),
                is_active: false,
                updated_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Delete devotee error:', error);
        res.status(500).json({
            error: 'Internal server error while deleting devotee'
        });
    }
});

module.exports = router;

