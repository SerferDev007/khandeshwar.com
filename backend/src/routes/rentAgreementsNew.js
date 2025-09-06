import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAgreements, getAgreementById, createAgreement, updateAgreement, deleteAgreement } from '../controllers/rentAgreementsController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/rent/agreements - List all agreements
router.get('/', authorize(['Admin', 'Treasurer', 'Viewer']), getAgreements);

// GET /api/rent/agreements/:id - Get agreement by ID
router.get('/:id', authorize(['Admin', 'Treasurer', 'Viewer']), getAgreementById);

// POST /api/rent/agreements - Create new agreement
router.post('/', authorize(['Admin']), createAgreement);

// PUT /api/rent/agreements/:id - Update agreement
router.put('/:id', authorize(['Admin']), updateAgreement);

// DELETE /api/rent/agreements/:id - Delete agreement
router.delete('/:id', authorize(['Admin']), deleteAgreement);

export default router;