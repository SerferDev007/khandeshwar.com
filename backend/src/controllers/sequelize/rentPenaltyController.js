import { RentPenalty, Tenant, Agreement } from '../../models/sequelize/index.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'RentPenaltyController' });

export class RentPenaltyController {
  // GET /api/rent-penalties - Get all rent penalties
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, include_relations } = req.query;
      const offset = (page - 1) * limit;

      const includeOptions = [];
      if (include_relations === 'true') {
        includeOptions.push(
          { model: Tenant, as: 'tenant' },
          { model: Agreement, as: 'agreement' }
        );
      }

      const { count, rows } = await RentPenalty.findAndCountAll({
        include: includeOptions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      logger.info(`Retrieved ${rows.length} rent penalties`, { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: count 
      });

      return res.json({
        success: true,
        data: {
          rentPenalties: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching rent penalties:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch rent penalties',
          code: 'FETCH_RENT_PENALTIES_ERROR'
        }
      });
    }
  }

  // GET /api/rent-penalties/:id - Get rent penalty by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { include_relations } = req.query;

      const includeOptions = [];
      if (include_relations === 'true') {
        includeOptions.push(
          { model: Tenant, as: 'tenant' },
          { model: Agreement, as: 'agreement' }
        );
      }

      const rentPenalty = await RentPenalty.findByPk(id, {
        include: includeOptions
      });

      if (!rentPenalty) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Rent penalty not found',
            code: 'RENT_PENALTY_NOT_FOUND'
          }
        });
      }

      logger.info(`Retrieved rent penalty: ${id}`);

      return res.json({
        success: true,
        data: { rentPenalty }
      });
    } catch (error) {
      logger.error('Error fetching rent penalty:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch rent penalty',
          code: 'FETCH_RENT_PENALTY_ERROR'
        }
      });
    }
  }

  // POST /api/rent-penalties - Create new rent penalty
  static async create(req, res) {
    try {
      const rentPenaltyData = {
        ...req.body,
        id: req.body.id || uuidv4()
      };

      // Verify tenant and agreement exist
      const tenant = await Tenant.findByPk(rentPenaltyData.tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          }
        });
      }

      const agreement = await Agreement.findByPk(rentPenaltyData.agreement_id);
      if (!agreement) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Agreement not found',
            code: 'AGREEMENT_NOT_FOUND'
          }
        });
      }

      // Verify the agreement belongs to the tenant
      if (agreement.tenant_id !== rentPenaltyData.tenant_id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Agreement does not belong to the specified tenant',
            code: 'INVALID_TENANT_AGREEMENT_MATCH'
          }
        });
      }

      const rentPenalty = await RentPenalty.create(rentPenaltyData);

      logger.info(`Created rent penalty: ${rentPenalty.id}`, { rentPenaltyData });

      return res.status(201).json({
        success: true,
        data: { rentPenalty }
      });
    } catch (error) {
      logger.error('Error creating rent penalty:', error);
      
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
          message: 'Failed to create rent penalty',
          code: 'CREATE_RENT_PENALTY_ERROR'
        }
      });
    }
  }

  // PUT /api/rent-penalties/:id - Update rent penalty
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const rentPenalty = await RentPenalty.findByPk(id);
      if (!rentPenalty) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Rent penalty not found',
            code: 'RENT_PENALTY_NOT_FOUND'
          }
        });
      }

      // If tenant_id or agreement_id is being updated, verify they exist and match
      if (updateData.tenant_id || updateData.agreement_id) {
        const tenantId = updateData.tenant_id || rentPenalty.tenant_id;
        const agreementId = updateData.agreement_id || rentPenalty.agreement_id;

        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Tenant not found',
              code: 'TENANT_NOT_FOUND'
            }
          });
        }

        const agreement = await Agreement.findByPk(agreementId);
        if (!agreement) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Agreement not found',
              code: 'AGREEMENT_NOT_FOUND'
            }
          });
        }

        if (agreement.tenant_id !== tenantId) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Agreement does not belong to the specified tenant',
              code: 'INVALID_TENANT_AGREEMENT_MATCH'
            }
          });
        }
      }

      await rentPenalty.update(updateData);

      logger.info(`Updated rent penalty: ${id}`, { updateData });

      return res.json({
        success: true,
        data: { rentPenalty }
      });
    } catch (error) {
      logger.error('Error updating rent penalty:', error);
      
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
          message: 'Failed to update rent penalty',
          code: 'UPDATE_RENT_PENALTY_ERROR'
        }
      });
    }
  }

  // DELETE /api/rent-penalties/:id - Delete rent penalty
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const rentPenalty = await RentPenalty.findByPk(id);
      if (!rentPenalty) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Rent penalty not found',
            code: 'RENT_PENALTY_NOT_FOUND'
          }
        });
      }

      await rentPenalty.destroy();

      logger.info(`Deleted rent penalty: ${id}`);

      return res.json({
        success: true,
        data: { 
          message: 'Rent penalty deleted successfully',
          id 
        }
      });
    } catch (error) {
      logger.error('Error deleting rent penalty:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete rent penalty',
          code: 'DELETE_RENT_PENALTY_ERROR'
        }
      });
    }
  }
}