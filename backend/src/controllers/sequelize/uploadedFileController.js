import { UploadedFile, Tenant, Agreement } from '../../models/sequelize/index.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'UploadedFileController' });

export class UploadedFileController {
  // GET /api/uploaded-files - Get all uploaded files
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, include_relations, tenant_id, agreement_id, file_type, category, is_active } = req.query;
      const offset = (page - 1) * limit;

      const includeOptions = [];
      if (include_relations === 'true') {
        includeOptions.push(
          { model: Tenant, as: 'tenant' },
          { model: Agreement, as: 'agreement' }
        );
      }

      // Build where clause for filtering
      const whereClause = {};
      if (tenant_id) whereClause.tenant_id = tenant_id;
      if (agreement_id) whereClause.agreement_id = agreement_id;
      if (file_type) whereClause.file_type = file_type;
      if (category) whereClause.category = category;
      if (is_active !== undefined) whereClause.is_active = is_active === 'true';

      const { count, rows } = await UploadedFile.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      logger.info(`Retrieved ${rows.length} uploaded files`, { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: count,
        filters: whereClause
      });

      return res.json({
        success: true,
        data: {
          uploadedFiles: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching uploaded files:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch uploaded files',
          code: 'FETCH_UPLOADED_FILES_ERROR'
        }
      });
    }
  }

  // GET /api/uploaded-files/:id - Get uploaded file by ID
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

      const uploadedFile = await UploadedFile.findByPk(id, {
        include: includeOptions
      });

      if (!uploadedFile) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Uploaded file not found',
            code: 'UPLOADED_FILE_NOT_FOUND'
          }
        });
      }

      logger.info(`Retrieved uploaded file: ${id}`);

      return res.json({
        success: true,
        data: { uploadedFile }
      });
    } catch (error) {
      logger.error('Error fetching uploaded file:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch uploaded file',
          code: 'FETCH_UPLOADED_FILE_ERROR'
        }
      });
    }
  }

  // POST /api/uploaded-files - Create new uploaded file
  static async create(req, res) {
    try {
      const uploadedFileData = {
        ...req.body,
        id: req.body.id || uuidv4()
      };

      // Verify tenant exists if provided
      if (uploadedFileData.tenant_id) {
        const tenant = await Tenant.findByPk(uploadedFileData.tenant_id);
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

      // Verify agreement exists if provided
      if (uploadedFileData.agreement_id) {
        const agreement = await Agreement.findByPk(uploadedFileData.agreement_id);
        if (!agreement) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Agreement not found',
              code: 'AGREEMENT_NOT_FOUND'
            }
          });
        }

        // If both tenant_id and agreement_id are provided, verify they match
        if (uploadedFileData.tenant_id && agreement.tenant_id !== uploadedFileData.tenant_id) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Agreement does not belong to the specified tenant',
              code: 'INVALID_TENANT_AGREEMENT_MATCH'
            }
          });
        }
      }

      const uploadedFile = await UploadedFile.create(uploadedFileData);

      logger.info(`Created uploaded file: ${uploadedFile.id}`, { uploadedFileData });

      return res.status(201).json({
        success: true,
        data: { uploadedFile }
      });
    } catch (error) {
      logger.error('Error creating uploaded file:', error);
      
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
          message: 'Failed to create uploaded file',
          code: 'CREATE_UPLOADED_FILE_ERROR'
        }
      });
    }
  }

  // PUT /api/uploaded-files/:id - Update uploaded file
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const uploadedFile = await UploadedFile.findByPk(id);
      if (!uploadedFile) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Uploaded file not found',
            code: 'UPLOADED_FILE_NOT_FOUND'
          }
        });
      }

      // Verify tenant exists if being updated
      if (updateData.tenant_id) {
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

      // Verify agreement exists if being updated
      if (updateData.agreement_id) {
        const agreement = await Agreement.findByPk(updateData.agreement_id);
        if (!agreement) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Agreement not found',
              code: 'AGREEMENT_NOT_FOUND'
            }
          });
        }

        // Check tenant-agreement match
        const tenantId = updateData.tenant_id || uploadedFile.tenant_id;
        if (tenantId && agreement.tenant_id !== tenantId) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Agreement does not belong to the specified tenant',
              code: 'INVALID_TENANT_AGREEMENT_MATCH'
            }
          });
        }
      }

      await uploadedFile.update(updateData);

      logger.info(`Updated uploaded file: ${id}`, { updateData });

      return res.json({
        success: true,
        data: { uploadedFile }
      });
    } catch (error) {
      logger.error('Error updating uploaded file:', error);
      
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
          message: 'Failed to update uploaded file',
          code: 'UPDATE_UPLOADED_FILE_ERROR'
        }
      });
    }
  }

  // DELETE /api/uploaded-files/:id - Delete uploaded file
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const uploadedFile = await UploadedFile.findByPk(id);
      if (!uploadedFile) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Uploaded file not found',
            code: 'UPLOADED_FILE_NOT_FOUND'
          }
        });
      }

      await uploadedFile.destroy();

      logger.info(`Deleted uploaded file: ${id}`);

      return res.json({
        success: true,
        data: { 
          message: 'Uploaded file deleted successfully',
          id 
        }
      });
    } catch (error) {
      logger.error('Error deleting uploaded file:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete uploaded file',
          code: 'DELETE_UPLOADED_FILE_ERROR'
        }
      });
    }
  }
}