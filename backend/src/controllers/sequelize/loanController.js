import { Loan, Tenant, Agreement } from '../../models/sequelize/index.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'LoanController' });

export class LoanController {
  // GET /api/loans - Get all loans
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

      const { count, rows } = await Loan.findAndCountAll({
        include: includeOptions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      logger.info(`Retrieved ${rows.length} loans`, { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: count 
      });

      return res.json({
        success: true,
        data: {
          loans: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching loans:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch loans',
          code: 'FETCH_LOANS_ERROR'
        }
      });
    }
  }

  // GET /api/loans/:id - Get loan by ID
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

      const loan = await Loan.findByPk(id, {
        include: includeOptions
      });

      if (!loan) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Loan not found',
            code: 'LOAN_NOT_FOUND'
          }
        });
      }

      logger.info(`Retrieved loan: ${id}`);

      return res.json({
        success: true,
        data: { loan }
      });
    } catch (error) {
      logger.error('Error fetching loan:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch loan',
          code: 'FETCH_LOAN_ERROR'
        }
      });
    }
  }

  // POST /api/loans - Create new loan
  static async create(req, res) {
    try {
      const loanData = {
        ...req.body,
        id: req.body.id || uuidv4()
      };

      // Verify tenant and agreement exist
      const tenant = await Tenant.findByPk(loanData.tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          }
        });
      }

      const agreement = await Agreement.findByPk(loanData.agreement_id);
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
      if (agreement.tenant_id !== loanData.tenant_id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Agreement does not belong to the specified tenant',
            code: 'INVALID_TENANT_AGREEMENT_MATCH'
          }
        });
      }

      const loan = await Loan.create(loanData);

      logger.info(`Created loan: ${loan.id}`, { loanData });

      return res.status(201).json({
        success: true,
        data: { loan }
      });
    } catch (error) {
      logger.error('Error creating loan:', error);
      
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
          message: 'Failed to create loan',
          code: 'CREATE_LOAN_ERROR'
        }
      });
    }
  }

  // PUT /api/loans/:id - Update loan
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const loan = await Loan.findByPk(id);
      if (!loan) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Loan not found',
            code: 'LOAN_NOT_FOUND'
          }
        });
      }

      // If tenant_id or agreement_id is being updated, verify they exist and match
      if (updateData.tenant_id || updateData.agreement_id) {
        const tenantId = updateData.tenant_id || loan.tenant_id;
        const agreementId = updateData.agreement_id || loan.agreement_id;

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

      await loan.update(updateData);

      logger.info(`Updated loan: ${id}`, { updateData });

      return res.json({
        success: true,
        data: { loan }
      });
    } catch (error) {
      logger.error('Error updating loan:', error);
      
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
          message: 'Failed to update loan',
          code: 'UPDATE_LOAN_ERROR'
        }
      });
    }
  }

  // DELETE /api/loans/:id - Delete loan
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const loan = await Loan.findByPk(id);
      if (!loan) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Loan not found',
            code: 'LOAN_NOT_FOUND'
          }
        });
      }

      await loan.destroy();

      logger.info(`Deleted loan: ${id}`);

      return res.json({
        success: true,
        data: { 
          message: 'Loan deleted successfully',
          id 
        }
      });
    } catch (error) {
      logger.error('Error deleting loan:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete loan',
          code: 'DELETE_LOAN_ERROR'
        }
      });
    }
  }
}