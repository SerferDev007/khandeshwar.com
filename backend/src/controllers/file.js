import { v4 as uuidv4 } from 'uuid';
import { File } from '../models/File.js';
import { generateUploadUrl, generateDownloadUrl, deleteFile } from '../config/aws.js';
import { asyncHandler } from '../middleware/error.js';
import env from '../config/env.js';
import pino from 'pino';

const logger = pino({ name: 'FileController' });

// Get pre-signed URL for file upload
export const getUploadUrl = asyncHandler(async (req, res) => {
  const { filename, contentType, size } = req.validatedData;
  
  console.log('[FileController] Upload URL request:', {
    userId: req.user.id,
    filename,
    contentType,
    size
  });

  // Generate unique key for S3
  const fileExtension = filename.split('.').pop();
  const uniqueFilename = `${uuidv4()}.${fileExtension}`;
  const s3Key = `uploads/${req.user.id}/${uniqueFilename}`;
  
  console.log('[FileController] Generated S3 key:', s3Key);

  // Generate pre-signed upload URL
  console.log('[FileController] Generating pre-signed upload URL...');
  const { uploadUrl } = await generateUploadUrl(s3Key, contentType);
  console.log('[FileController] Pre-signed URL generated successfully');

  // Create file record with 'uploading' status
  console.log('[FileController] Creating file record in database...');
  const file = await File.create({
    userId: req.user.id,
    filename: uniqueFilename,
    originalName: filename,
    mimeType: contentType,
    sizeBytes: size,
    s3Key,
    s3Bucket: env.AWS_S3_BUCKET,
    status: 'uploading',
  });

  console.log('[FileController] File record created:', { fileId: file.id, status: file.status });

  logger.info('Upload URL generated:', {
    fileId: file.id,
    userId: req.user.id,
    filename: filename,
    s3Key,
  });

  res.json({
    success: true,
    data: {
      file: file.toSafeObject(),
      uploadUrl,
      instructions: {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        note: 'Upload the file directly to this URL. After successful upload, call the confirm upload endpoint.',
      },
    },
  });
});

// Confirm file upload completion
export const confirmUpload = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;

  const file = await File.findById(id);
  if (!file) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
    });
  }

  // Check if user owns the file
  if (file.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'You can only confirm your own file uploads',
    });
  }

  // Update file status to uploaded
  await file.updateStatus('uploaded');

  logger.info('File upload confirmed:', {
    fileId: file.id,
    userId: req.user.id,
    filename: file.originalName,
  });

  res.json({
    success: true,
    data: {
      file: file.toSafeObject(),
    },
  });
});

// Get user's files
export const getUserFiles = asyncHandler(async (req, res) => {
  const { page, limit, sort, order } = req.validatedData;

  const result = await File.findByUserId(req.user.id, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
  });

  res.json({
    success: true,
    data: {
      files: result.files.map(file => file.toSafeObject()),
      pagination: result.pagination,
    },
  });
});

// Get all files (Admin only)
export const getAllFiles = asyncHandler(async (req, res) => {
  const { page, limit, sort, order, status, mimeType } = req.validatedData;

  const result = await File.findAll({
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    status,
    mimeType,
  });

  res.json({
    success: true,
    data: {
      files: result.files.map(file => file.toSafeObject()),
      pagination: result.pagination,
    },
  });
});

// Get file by ID with download URL
export const getFileById = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;

  const file = await File.findById(id);
  if (!file) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
    });
  }

  // Check permissions - users can only access their own files, admins can access any file
  if (req.user.role !== 'Admin' && file.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'You can only access your own files',
    });
  }

  // Generate download URL if file is uploaded
  let downloadUrl = null;
  if (file.status === 'uploaded') {
    try {
      downloadUrl = await generateDownloadUrl(file.s3Key);
    } catch (error) {
      logger.error('Failed to generate download URL:', error);
      // Continue without download URL
    }
  }

  res.json({
    success: true,
    data: {
      file: file.toSafeObject(),
      downloadUrl,
      downloadExpiry: downloadUrl ? '1 hour' : null,
    },
  });
});

// Update file metadata
export const updateFile = asyncHandler(async (req, res) => {
  const { id, filename } = req.validatedData;

  const file = await File.findById(id);
  if (!file) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
    });
  }

  // Check permissions
  if (req.user.role !== 'Admin' && file.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'You can only update your own files',
    });
  }

  const updateData = {};
  if (filename) updateData.filename = filename;

  await file.update(updateData);

  logger.info('File updated:', {
    fileId: file.id,
    updatedBy: req.user.id,
    updates: updateData,
  });

  res.json({
    success: true,
    data: {
      file: file.toSafeObject(),
    },
  });
});

// Delete file
export const deleteFileById = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;

  const file = await File.findById(id);
  if (!file) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
    });
  }

  // Check permissions
  if (req.user.role !== 'Admin' && file.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'You can only delete your own files',
    });
  }

  // Delete from S3 if uploaded
  if (file.status === 'uploaded') {
    try {
      await deleteFile(file.s3Key);
    } catch (error) {
      logger.error('Failed to delete file from S3:', error);
      // Continue with database deletion even if S3 deletion fails
    }
  }

  // Delete from database
  await file.delete();

  logger.info('File deleted:', {
    fileId: file.id,
    deletedBy: req.user.id,
    filename: file.originalName,
    s3Key: file.s3Key,
  });

  res.json({
    success: true,
    data: {
      message: 'File deleted successfully',
    },
  });
});

// Get file statistics (Admin only)
export const getFileStats = asyncHandler(async (req, res) => {
  const totalResult = await File.findAll({ limit: 1 });
  const uploadedResult = await File.findAll({ status: 'uploaded', limit: 1 });
  const uploadingResult = await File.findAll({ status: 'uploading', limit: 1 });
  const failedResult = await File.findAll({ status: 'failed', limit: 1 });

  // Get file type statistics
  const imageResult = await File.findAll({ mimeType: 'image', limit: 1 });
  const documentResult = await File.findAll({ mimeType: 'application', limit: 1 });

  res.json({
    success: true,
    data: {
      stats: {
        total: totalResult.pagination.total,
        byStatus: {
          uploaded: uploadedResult.pagination.total,
          uploading: uploadingResult.pagination.total,
          failed: failedResult.pagination.total,
        },
        byType: {
          images: imageResult.pagination.total,
          documents: documentResult.pagination.total,
          other: totalResult.pagination.total - imageResult.pagination.total - documentResult.pagination.total,
        },
      },
    },
  });
});