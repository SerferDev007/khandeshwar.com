import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import env from '../config/env.js';
import pino from 'pino';

const logger = pino({ name: 'RefreshTokenModel' });

export class RefreshToken {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id || data.userId;
    this.tokenHash = data.token_hash || data.tokenHash;
    this.expiresAt = data.expires_at || data.expiresAt;
    this.isRevoked = data.is_revoked || data.isRevoked || false;
    this.createdAt = data.created_at || data.createdAt;
  }

  // Create a new refresh token
  static async create(userId) {
    try {
      // Validate JWT refresh secret is available
      if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32) {
        logger.error('JWT_REFRESH_SECRET is missing or too short');
        throw new Error('Invalid JWT refresh configuration');
      }

      const id = uuidv4();
      const token = jwt.sign({ userId, tokenId: id }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      });
      
      // Hash the token for storage
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      await query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
        [id, userId, tokenHash, expiresAt]
      );

      logger.info('Refresh token created:', { id, userId });
      
      return { token, tokenId: id };
    } catch (error) {
      logger.error('Failed to create refresh token:', {
        error: error.message,
        userId
      });
      throw new Error('Refresh token generation failed');
    }
  }

  // Find refresh token by token string
  static async findByToken(token) {
    try {
      // Validate JWT refresh secret is available
      if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32) {
        logger.error('JWT_REFRESH_SECRET is missing or too short');
        return null;
      }

      // Verify and decode the token
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
      
      // Hash the token to match stored hash
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const tokens = await query(
        `SELECT * FROM refresh_tokens 
         WHERE id = ? AND token_hash = ? AND expires_at > NOW() AND is_revoked = FALSE`,
        [decoded.tokenId, tokenHash]
      );

      return tokens.length > 0 ? new RefreshToken(tokens[0]) : null;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        logger.warn('Invalid or expired refresh token:', { error: error.message });
        return null;
      }
      logger.error('Failed to find refresh token:', { error: error.message });
      throw error;
    }
  }

  // Find all refresh tokens for a user
  static async findByUserId(userId) {
    try {
      const tokens = await query(
        'SELECT * FROM refresh_tokens WHERE user_id = ? AND is_revoked = FALSE ORDER BY created_at DESC',
        [userId]
      );

      return tokens.map(token => new RefreshToken(token));
    } catch (error) {
      logger.error('Failed to find refresh tokens by user ID:', error);
      throw error;
    }
  }

  // Revoke refresh token
  async revoke() {
    try {
      await query(
        'UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = ?',
        [this.id]
      );

      logger.info('Refresh token revoked:', { id: this.id });
      this.isRevoked = true;
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      throw error;
    }
  }

  // Revoke all refresh tokens for a user
  static async revokeAllForUser(userId) {
    try {
      await query(
        'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?',
        [userId]
      );

      logger.info('All refresh tokens revoked for user:', { userId });
    } catch (error) {
      logger.error('Failed to revoke all refresh tokens for user:', error);
      throw error;
    }
  }

  // Clean up expired tokens
  static async cleanupExpired() {
    try {
      const result = await query(
        'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE'
      );

      logger.info('Cleaned up expired refresh tokens:', { deleted: result.affectedRows });
      return result.affectedRows;
    } catch (error) {
      logger.error('Failed to cleanup expired refresh tokens:', error);
      throw error;
    }
  }

  // Check if token is valid
  isValid() {
    const now = new Date();
    return !this.isRevoked && new Date(this.expiresAt) > now;
  }

  // Convert to database object
  toDbObject() {
    return {
      id: this.id,
      user_id: this.userId,
      token_hash: this.tokenHash,
      expires_at: this.expiresAt,
      is_revoked: this.isRevoked,
      created_at: this.createdAt,
    };
  }

  // Create from database row
  static fromDbRow(row) {
    return new RefreshToken(row);
  }
}