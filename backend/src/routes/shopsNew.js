import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getShops, getShopById, createShop, updateShop, deleteShop } from '../controllers/shopsController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/shops - List all shops
router.get('/', authorize(['Admin', 'Treasurer', 'Viewer']), getShops);

// GET /api/shops/:id - Get shop by ID
router.get('/:id', authorize(['Admin', 'Treasurer', 'Viewer']), getShopById);

// POST /api/shops - Create new shop
router.post('/', authorize(['Admin']), createShop);

// PUT /api/shops/:id - Update shop
router.put('/:id', authorize(['Admin']), updateShop);

// DELETE /api/shops/:id - Delete shop
router.delete('/:id', authorize(['Admin']), deleteShop);

export default router;