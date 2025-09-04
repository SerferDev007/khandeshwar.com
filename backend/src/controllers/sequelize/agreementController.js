import { Agreement, Tenant, Loan, RentPenalty, UploadedFile } from '../../models/sequelize/index.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'AgreementController' });

export class AgreementController {
  // GET /api/rent/agreements - Get all agreements
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, include_relations } = req.query;
      const offset = (page - 1) * limit;

      const includeOptions = [];
      if (include_relations === 'true') {
        includeOptions.push(
          { model: Tenant, as: 'tenant' },
          { model: Loan, as: 'loans' },
          { model: RentPenalty, as: 'rentPenalties' },
          { model: UploadedFile, as: 'uploadedFiles' }
        );
      }

      const { count, rows } = await Agreement.findAndCountAll({
        include: includeOptions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      logger.info(`Retrieved ${rows.length} agreements`, { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: count 
      });

      return res.json({
        success: true,
        data: {
          agreements: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching agreements:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch agreements',
          code: 'FETCH_AGREEMENTS_ERROR'
        }
      });
    }
  }

  // GET /api/rent/agreements/:id - Get agreement by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { include_relations } = req.query;

      const includeOptions = [];
      if (include_relations === 'true') {
        includeOptions.push(
          { model: Tenant, as: 'tenant' },
          { model: Loan, as: 'loans' },
          { model: RentPenalty, as: 'rentPenalties' },
          { model: UploadedFile, as: 'uploadedFiles' }
        );
      }

      const agreement = await Agreement.findByPk(id, {
        include: includeOptions
      });

      if (!agreement) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Agreement not found',
            code: 'AGREEMENT_NOT_FOUND'
          }
        });
      }

      logger.info(`Retrieved agreement: ${id}`);

      return res.json({
        success: true,
        data: { agreement }
      });
    } catch (error) {
      logger.error('Error fetching agreement:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch agreement',
          code: 'FETCH_AGREEMENT_ERROR'
        }
      });
    }
  }

  // POST /api/rent/agreements - Create new agreement
  static async create(req, res) {
    try {
      const agreementData = {
        ...req.body,
        id: req.body.id || uuidv4()
      };

      // Verify tenant exists
      const tenant = await Tenant.findByPk(agreementData.tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          }
        });
      }

      const agreement = await Agreement.create(agreementData);

      logger.info(`Created agreement: ${agreement.id}`, { agreementData });

      return res.status(201).json({
        success: true,
        data: { agreement }
      });
    } catch (error) {
      logger.error('Error creating agreement:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              field: err.path,
              message: err.message,
              value: err.value
            }))
          }
        });
      }

      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid foreign key reference',
            code: 'FOREIGN_KEY_ERROR'
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create agreement',
          code: 'CREATE_AGREEMENT_ERROR'
        }
      });
    }
  }

  // PUT /api/rent/agreements/:id - Update agreement
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const agreement = await Agreement.findByPk(id);
      if (!agreement) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Agreement not found',
            code: 'AGREEMENT_NOT_FOUND'
          }
        });
      }

      // If tenant_id is being updated, verify new tenant exists
      if (updateData.tenant_id && updateData.tenant_id !== agreement.tenant_id) {
        const tenant = await Tenant.findByPk(updateData.tenant_id);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Tenant not found',
              code: 'TENANT_NOT_FOUND'
            }
          });
        }
      }

      await agreement.update(updateData);

      logger.info(`Updated agreement: ${id}`, { updateData });

      return res.json({
        success: true,
        data: { agreement }
      });
    } catch (error) {
      logger.error('Error updating agreement:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              field: err.path,
              message: err.message,
              value: err.value
            }))
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update agreement',
          code: 'UPDATE_AGREEMENT_ERROR'
        }
      });
    }
  }

  // DELETE /api/rent/agreements/:id - Delete agreement
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const agreement = await Agreement.findByPk(id);
      if (!agreement) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Agreement not found',
            code: 'AGREEMENT_NOT_FOUND'
          }
        });
      }

      await agreement.destroy();

      logger.info(`Deleted agreement: ${id}`);

      return res.json({
        success: true,
        data: { 
          message: 'Agreement deleted successfully',
          id 
        }
      });
    } catch (error) {
      logger.error('Error deleting agreement:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete agreement',
          code: 'DELETE_AGREEMENT_ERROR'
        }
      });
    }
  }
}