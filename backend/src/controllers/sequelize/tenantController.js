import { Tenant, Agreement, Loan, RentPenalty, UploadedFile } from '../../models/sequelize/index.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'TenantController' });

export class TenantController {
  // GET /api/rent/tenants - Get all tenants
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, include_relations } = req.query;
      const offset = (page - 1) * limit;

      const includeOptions = [];
      if (include_relations === 'true') {
        includeOptions.push(
          { model: Agreement, as: 'agreements' },
          { model: Loan, as: 'loans' },
          { model: RentPenalty, as: 'rentPenalties' },
          { model: UploadedFile, as: 'uploadedFiles' }
        );
      }

      const { count, rows } = await Tenant.findAndCountAll({
        include: includeOptions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      logger.info(`Retrieved ${rows.length} tenants`, { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: count 
      });

      return res.json({
        success: true,
        data: {
          tenants: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching tenants:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch tenants',
          code: 'FETCH_TENANTS_ERROR'
        }
      });
    }
  }

  // GET /api/rent/tenants/:id - Get tenant by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { include_relations } = req.query;

      const includeOptions = [];
      if (include_relations === 'true') {
        includeOptions.push(
          { model: Agreement, as: 'agreements' },
          { model: Loan, as: 'loans' },
          { model: RentPenalty, as: 'rentPenalties' },
          { model: UploadedFile, as: 'uploadedFiles' }
        );
      }

      const tenant = await Tenant.findByPk(id, {
        include: includeOptions
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          }
        });
      }

      logger.info(`Retrieved tenant: ${id}`);

      return res.json({
        success: true,
        data: { tenant }
      });
    } catch (error) {
      logger.error('Error fetching tenant:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch tenant',
          code: 'FETCH_TENANT_ERROR'
        }
      });
    }
  }

  // POST /api/rent/tenants - Create new tenant
  static async create(req, res) {
    try {
      const tenantData = {
        ...req.body,
        id: req.body.id || uuidv4()
      };

      const tenant = await Tenant.create(tenantData);

      logger.info(`Created tenant: ${tenant.id}`, { tenantData });

      return res.status(201).json({
        success: true,
        data: { tenant }
      });
    } catch (error) {
      logger.error('Error creating tenant:', error);
      
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

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Tenant with this email already exists',
            code: 'DUPLICATE_EMAIL'
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create tenant',
          code: 'CREATE_TENANT_ERROR'
        }
      });
    }
  }

  // PUT /api/rent/tenants/:id - Update tenant
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          }
        });
      }

      await tenant.update(updateData);

      logger.info(`Updated tenant: ${id}`, { updateData });

      return res.json({
        success: true,
        data: { tenant }
      });
    } catch (error) {
      logger.error('Error updating tenant:', error);
      
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
          message: 'Failed to update tenant',
          code: 'UPDATE_TENANT_ERROR'
        }
      });
    }
  }

  // DELETE /api/rent/tenants/:id - Delete tenant
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          }
        });
      }

      await tenant.destroy();

      logger.info(`Deleted tenant: ${id}`);

      return res.json({
        success: true,
        data: { 
          message: 'Tenant deleted successfully',
          id 
        }
      });
    } catch (error) {
      logger.error('Error deleting tenant:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete tenant',
          code: 'DELETE_TENANT_ERROR'
        }
      });
    }
  }
}