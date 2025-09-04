import express from 'express';
import tenantRoutes from './tenants.js';
import agreementRoutes from './agreements.js';
import loanRoutes from './loans.js';
import rentPenaltyRoutes from './rentPenalties.js';
import uploadedFileRoutes from './uploadedFiles.js';

const router = express.Router();

// Mount all Sequelize routes
router.use('/tenants', tenantRoutes);
router.use('/agreements', agreementRoutes);
router.use('/loans', loanRoutes);
router.use('/rent-penalties', rentPenaltyRoutes);
router.use('/uploaded-files', uploadedFileRoutes);

export default router;