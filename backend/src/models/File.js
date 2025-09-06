import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import pino from 'pino';

const logger = pino({ name: 'FileModel' });

export class File {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id || data.userId;
    this.filename = data.filename;
    this.originalName = data.original_name || data.originalName;
    this.mimeType = data.mime_type || data.mimeType;
    this.sizeBytes = data.size_bytes || data.sizeBytes;
    this.s3Key = data.s3_key || data.s3Key;
    this.s3Bucket = data.s3_bucket || data.s3Bucket;
    this.status = data.status || 'uploading';
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Create a new file record
  static async create(fileData) {
    const {
      userId,
      filename,
      originalName,
      mimeType,
      sizeBytes,
      s3Key,
      s3Bucket,
      status = 'uploading'
    } = fileData;
    
    try {
      const id = uuidv4();
      
      await query(
        `INSERT INTO files (id, user_id, filename, original_name, mime_type, size_bytes, s3_key, s3_bucket, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, filename, originalName, mimeType, sizeBytes, s3Key, s3Bucket, status]
      );

      logger.info('File record created:', { id, filename, s3Key });
      
      return await File.findById(id);
    } catch (error) {
      logger.error('Failed to create file record:', error);
      throw error;
    }
  }

  // Find file by ID
  static async findById(id) {
    try {
      const files = await query('SELECT * FROM files WHERE id = ?', [id]);
      return files.length > 0 ? new File(files[0]) : null;
    } catch (error) {
      logger.error('Failed to find file by ID:', error);
      throw error;
    }
  }

  // Find files by user ID
  static async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = options;
    const offset = (page - 1) * limit;
    
    // Validate and ensure limit and offset are safe integers for inlining
    const validLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    try {
      // Get total count
      const totalResults = await query(
        'SELECT COUNT(*) as count FROM files WHERE user_id = ?',
        [userId]
      );
      const total = totalResults[0].count;
      
      // Get paginated results - inline LIMIT/OFFSET to avoid MySQL parameter binding issues
      const files = await query(
        `SELECT * FROM files WHERE user_id = ? 
         ORDER BY ${sort} ${order.toUpperCase()} 
         LIMIT ${validLimit} OFFSET ${validOffset}`,
        [userId]
      );

      return {
        files: files.map(file => new File(file)),
        pagination: {
          page,
          limit: validLimit,
          total,
          pages: Math.ceil(total / validLimit),
        },
      };
    } catch (error) {
      logger.error('Failed to find files by user ID:', error);
      throw error;
    }
  }

  // Get all files with pagination
  static async findAll(options = {}) {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc', status, mimeType } = options;
    const offset = (page - 1) * limit;
    
    // Validate and ensure limit and offset are safe integers for inlining
    const validLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    try {
      let whereClause = '';
      const params = [];
      
      if (status) {
        whereClause += ' WHERE status = ?';
        params.push(status);
      }
      
      if (mimeType) {
        whereClause += whereClause ? ' AND mime_type LIKE ?' : ' WHERE mime_type LIKE ?';
        params.push(`${mimeType}%`);
      }
      
      // Get total count
      const totalResults = await query(`SELECT COUNT(*) as count FROM files${whereClause}`, params);
      const total = totalResults[0].count;
      
      // Get paginated results - inline LIMIT/OFFSET to avoid MySQL parameter binding issues
      const files = await query(
        `SELECT * FROM files${whereClause} 
         ORDER BY ${sort} ${order.toUpperCase()} 
         LIMIT ${validLimit} OFFSET ${validOffset}`,
        params
      );

      return {
        files: files.map(file => new File(file)),
        pagination: {
          page,
          limit: validLimit,
          total,
          pages: Math.ceil(total / validLimit),
        },
      };
    } catch (error) {
      logger.error('Failed to find files:', error);
      throw error;
    }
  }

  // Update file status
  async updateStatus(status) {
    try {
      await query(
        'UPDATE files SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, this.id]
      );

      logger.info('File status updated:', { id: this.id, status });
      this.status = status;
      this.updatedAt = new Date();
    } catch (error) {
      logger.error('Failed to update file status:', error);
      throw error;
    }
  }

  // Update file record
  async update(updateData) {
    try {
      const allowedFields = ['filename', 'status'];
      const updates = [];
      const params = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }
      
      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      params.push(this.id);
      
      await query(
        `UPDATE files SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );

      logger.info('File updated:', { id: this.id, updates: updateData });
      
      // Refresh file data
      const updatedFile = await File.findById(this.id);
      Object.assign(this, updatedFile);
      
      return this;
    } catch (error) {
      logger.error('Failed to update file:', error);
      throw error;
    }
  }

  // Delete file record
  async delete() {
    try {
      await query('DELETE FROM files WHERE id = ?', [this.id]);

      logger.info('File record deleted:', { id: this.id, s3Key: this.s3Key });
    } catch (error) {
      logger.error('Failed to delete file record:', error);
      throw error;
    }
  }

  // Get file size in human-readable format
  getFormattedSize() {
    const bytes = this.sizeBytes;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file is an image
  isImage() {
    return this.mimeType && this.mimeType.startsWith('image/');
  }

  // Check if file is a document
  isDocument() {
    const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
    return this.mimeType && (
      this.mimeType.includes('pdf') ||
      this.mimeType.includes('word') ||
      documentTypes.some(type => this.mimeType.includes(type))
    );
  }

  // Convert to safe object (for API responses)
  toSafeObject() {
    return {
      id: this.id,
      filename: this.filename,
      originalName: this.originalName,
      mimeType: this.mimeType,
      sizeBytes: this.sizeBytes,
      formattedSize: this.getFormattedSize(),
      isImage: this.isImage(),
      isDocument: this.isDocument(),
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Convert to database object
  toDbObject() {
    return {
      id: this.id,
      user_id: this.userId,
      filename: this.filename,
      original_name: this.originalName,
      mime_type: this.mimeType,
      size_bytes: this.sizeBytes,
      s3_key: this.s3Key,
      s3_bucket: this.s3Bucket,
      status: this.status,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  // Create from database row
  static fromDbRow(row) {
    return new File(row);
  }
}