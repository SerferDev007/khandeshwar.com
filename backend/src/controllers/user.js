import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/error.js';
import pino from 'pino';

const logger = pino({ name: 'UserController' });

// Get all users (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const { page, limit, sort, order, role, status } = req.validatedData;

    logger.info('getAllUsers request:', { 
      page, 
      limit, 
      sort, 
      order, 
      role, 
      status,
      user: req.user?.id 
    });

    // Additional safety validation for parameters
    const safeOptions = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 10)),
      sort: sort || 'created_at',
      order: (order === 'asc' || order === 'desc') ? order : 'desc',
    };

    // Only include role and status if they are valid enum values
    if (role && ['Admin', 'Treasurer', 'Viewer'].includes(role)) {
      safeOptions.role = role;
    }
    if (status && ['Active', 'Inactive'].includes(status)) {
      safeOptions.status = status;
    }

    logger.info('getAllUsers sanitized options:', safeOptions);

    const result = await User.findAll(safeOptions);

    const { users, pagination } = result;

    logger.info('getAllUsers success:', { 
      usersCount: users.length, 
      totalPages: pagination.pages,
      currentPage: pagination.page 
    });

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toSafeObject()),
        pagination,
      },
    });
  } catch (error) {
    logger.error('getAllUsers failed:', { 
      error: error.message, 
      stack: error.stack,
      params: req.validatedData 
    });
    
    // Return a user-friendly error message
    res.status(500).json({
      success: false,
      error: 'Failed to load users. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Create user (Admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.validatedData;

  // Check if user already exists
  const existingUserByEmail = await User.findByEmail(email);
  if (existingUserByEmail) {
    return res.status(409).json({
      success: false,
      error: 'Email already registered',
    });
  }

  const existingUserByUsername = await User.findByUsername(username);
  if (existingUserByUsername) {
    return res.status(409).json({
      success: false,
      error: 'Username already taken',
    });
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    role: role || 'Viewer',
  });

  logger.info('User created by admin:', {
    createdUserId: user.id,
    createdBy: req.user.id,
    username: user.username,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id, username, email, role, status } = req.validatedData;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Check permissions - users can only update themselves, admins can update anyone
  if (req.user.role !== 'Admin' && req.user.id !== id) {
    return res.status(403).json({
      success: false,
      error: 'You can only update your own profile',
    });
  }

  // Non-admins cannot change role or status
  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  
  if (req.user.role === 'Admin') {
    if (role) updateData.role = role;
    if (status) updateData.status = status;
  }

  // Check if username is taken by another user
  if (username && username !== user.username) {
    const existingUser = await User.findByUsername(username);
    if (existingUser && existingUser.id !== user.id) {
      return res.status(409).json({
        success: false,
        error: 'Username already taken',
      });
    }
  }

  // Check if email is taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== user.id) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }
  }

  await user.update(updateData);

  logger.info('User updated:', {
    updatedUserId: user.id,
    updatedBy: req.user.id,
    updates: updateData,
  });

  res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Delete user (Admin only) - soft delete
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;

  // Prevent deleting yourself
  if (req.user.id === id) {
    return res.status(400).json({
      success: false,
      error: 'You cannot delete your own account',
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  await user.delete();

  logger.info('User deleted (soft):', {
    deletedUserId: user.id,
    deletedBy: req.user.id,
    username: user.username,
  });

  res.json({
    success: true,
    data: {
      message: 'User deleted successfully',
    },
  });
});

// Get user statistics (Admin only)
export const getUserStats = asyncHandler(async (req, res) => {
  const totalResult = await User.findAll({ limit: 1 });
  const activeResult = await User.findAll({ status: 'Active', limit: 1 });
  const adminResult = await User.findAll({ role: 'Admin', limit: 1 });
  const treasurerResult = await User.findAll({ role: 'Treasurer', limit: 1 });
  const viewerResult = await User.findAll({ role: 'Viewer', limit: 1 });

  res.json({
    success: true,
    data: {
      stats: {
        total: totalResult.pagination.total,
        active: activeResult.pagination.total,
        inactive: totalResult.pagination.total - activeResult.pagination.total,
        byRole: {
          Admin: adminResult.pagination.total,
          Treasurer: treasurerResult.pagination.total,
          Viewer: viewerResult.pagination.total,
        },
      },
    },
  });
});