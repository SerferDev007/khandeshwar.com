import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { sendEmail } from '../config/aws.js';
import env from '../config/env.js';
import { asyncHandler } from '../middleware/error.js';
import pino from 'pino';

const logger = pino({ name: 'AuthController' });

// Generate access token
const generateAccessToken = (user) => {
  try {
    const { id: userId, username, email, role } = user;
    
    // Validate JWT secret is available
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      logger.error('JWT_SECRET is missing or too short');
      throw new Error('Invalid JWT configuration');
    }
    
    return jwt.sign(
      {
        userId,
        username,
        email,
        role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  } catch (error) {
    logger.error('Failed to generate access token:', {
      error: error.message,
      userId: user?.id,
      username: user?.username
    });
    throw new Error('Token generation failed');
  }
};

// Register new user
export const register = asyncHandler(async (req, res) => {
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

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = await RefreshToken.create(user.id);

  // Send welcome email (if SES is configured)
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Khandeshwar Management System',
      html: `
        <h2>Welcome ${user.username}!</h2>
        <p>Your account has been successfully created.</p>
        <p>Role: ${user.role}</p>
        <p>You can now log in to the system.</p>
      `,
      text: `Welcome ${user.username}! Your account has been successfully created with role: ${user.role}. You can now log in to the system.`,
    });
  } catch (emailError) {
    logger.warn('Failed to send welcome email:', emailError);
    // Don't fail registration if email fails
  }

  logger.info('User registered successfully:', {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    data: {
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiresIn: env.JWT_EXPIRES_IN,
        refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
      },
    },
  });
});

// Login user
export const login = asyncHandler(async (req, res) => {
  try {
    // Strictly validate req.validatedData
    if (!req.validatedData) {
      logger.error('Login attempt with missing validatedData:', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        hasBody: !!Object.keys(req.body || {}).length
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: [{ field: 'request', message: 'Request validation failed' }]
      });
    }

    const { email, password } = req.validatedData;

    // Ensure email and password are present and valid
    if (!email || !password) {
      logger.error('Login attempt with missing credentials:', {
        hasEmail: !!email,
        hasPassword: !!password,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: [
          ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
          ...(!password ? [{ field: 'password', message: 'Password is required' }] : [])
        ]
      });
    }

    // Additional email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.error('Login attempt with invalid email format:', {
        email: email.substring(0, 3) + '***', // Log partial email for security
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: [{ field: 'email', message: 'Invalid email format' }]
      });
    }

    logger.info('Login attempt:', {
      email: email.substring(0, 3) + '***',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Find user by email with error handling
    let user;
    try {
      user = await User.findByEmail(email);
    } catch (dbError) {
      logger.error('Database error during user lookup:', {
        error: dbError.message,
        email: email.substring(0, 3) + '***',
        ip: req.ip
      });
      return res.status(500).json({
        success: false,
        error: 'An error occurred during login. Please try again.',
      });
    }

    if (!user) {
      logger.warn('Login attempt with non-existent email:', {
        email: email.substring(0, 3) + '***',
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      logger.warn('Login attempt with inactive account:', {
        userId: user.id,
        username: user.username,
        status: user.status,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Account is inactive',
      });
    }

    // Verify password with error handling
    let isPasswordValid;
    try {
      isPasswordValid = await user.verifyPassword(password);
    } catch (passwordError) {
      logger.error('Error during password verification:', {
        error: passwordError.message,
        userId: user.id,
        username: user.username,
        ip: req.ip
      });
      return res.status(500).json({
        success: false,
        error: 'An error occurred during login. Please try again.',
      });
    }

    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password:', {
        userId: user.id,
        username: user.username,
        email: email.substring(0, 3) + '***',
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Update last login with error handling
    try {
      await user.updateLastLogin();
    } catch (updateError) {
      logger.error('Error updating last login:', {
        error: updateError.message,
        userId: user.id,
        username: user.username
      });
      // Continue with login even if last login update fails
    }

    // Generate tokens with error handling
    let accessToken, refreshToken;
    try {
      accessToken = generateAccessToken(user);
    } catch (tokenError) {
      logger.error('Error generating access token:', {
        error: tokenError.message,
        userId: user.id,
        username: user.username
      });
      return res.status(500).json({
        success: false,
        error: 'An error occurred during login. Please try again.',
      });
    }

    try {
      const refreshTokenRecord = await RefreshToken.create(user.id);
      refreshToken = refreshTokenRecord.token;
    } catch (refreshError) {
      logger.error('Error creating refresh token:', {
        error: refreshError.message,
        userId: user.id,
        username: user.username
      });
      return res.status(500).json({
        success: false,
        error: 'An error occurred during login. Please try again.',
      });
    }

    logger.info('User logged in successfully:', {
      userId: user.id,
      username: user.username,
      email: email.substring(0, 3) + '***',
      ip: req.ip
    });

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        tokens: {
          accessToken,
          refreshToken,
          accessTokenExpiresIn: env.JWT_EXPIRES_IN,
          refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
        },
      },
    });

  } catch (error) {
    // Catch any unexpected errors not handled above
    logger.error('Unexpected error during login:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    });
  }
});

// Refresh access token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.validatedData;

  // Find and validate refresh token
  const refreshTokenRecord = await RefreshToken.findByToken(token);
  if (!refreshTokenRecord || !refreshTokenRecord.isValid()) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    });
  }

  // Get user
  const user = await User.findById(refreshTokenRecord.userId);
  if (!user || user.status !== 'Active') {
    return res.status(401).json({
      success: false,
      error: 'User not found or inactive',
    });
  }

  // Revoke old refresh token
  await refreshTokenRecord.revoke();

  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const { token: newRefreshToken } = await RefreshToken.create(user.id);

  logger.info('Tokens refreshed successfully:', {
    userId: user.id,
    username: user.username,
  });

  res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        accessTokenExpiresIn: env.JWT_EXPIRES_IN,
        refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
      },
    },
  });
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  
  if (token) {
    const refreshTokenRecord = await RefreshToken.findByToken(token);
    if (refreshTokenRecord) {
      await refreshTokenRecord.revoke();
    }
  }

  logger.info('User logged out:', {
    userId: req.user?.id,
    username: req.user?.username,
  });

  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

// Logout from all devices
export const logoutAll = asyncHandler(async (req, res) => {
  await RefreshToken.revokeAllForUser(req.user.id);

  logger.info('User logged out from all devices:', {
    userId: req.user.id,
    username: req.user.username,
  });

  res.json({
    success: true,
    data: {
      message: 'Logged out from all devices successfully',
    },
  });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validatedData;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect',
    });
  }

  // Update password
  await user.updatePassword(newPassword);

  // Revoke all refresh tokens to force re-login
  await RefreshToken.revokeAllForUser(user.id);

  logger.info('Password changed successfully:', {
    userId: user.id,
    username: user.username,
  });

  res.json({
    success: true,
    data: {
      message: 'Password changed successfully. Please log in again.',
    },
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

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

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.validatedData;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
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

  // Update user
  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;

  await user.update(updateData);

  logger.info('Profile updated successfully:', {
    userId: user.id,
    updates: updateData,
  });

  res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});