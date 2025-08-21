/**
 * Simple test for JWT token generation functionality
 */

import jwt from 'jsonwebtoken';
import env from './src/config/env.js';

console.log('🧪 Testing JWT token generation functionality\n');

// Mock user data for testing
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'User'
};

// Test 1: Access token generation
console.log('1. Testing access token generation...');
try {
  const generateAccessToken = (user) => {
    try {
      const { id: userId, username, email, role } = user;
      
      // Validate JWT secret is available
      if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
        console.error('JWT_SECRET is missing or too short');
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
      console.error('Failed to generate access token:', {
        error: error.message,
        userId: user?.id,
        username: user?.username
      });
      throw new Error('Token generation failed');
    }
  };

  const accessToken = generateAccessToken(mockUser);
  const decoded = jwt.verify(accessToken, env.JWT_SECRET);
  
  console.log('   ✅ Access token generated successfully');
  console.log(`   📊 Token length: ${accessToken.length}`);
  console.log(`   📊 Decoded payload:`, { 
    userId: decoded.userId, 
    username: decoded.username, 
    role: decoded.role 
  });
  
} catch (error) {
  console.log('   ❌ Access token test failed:', error.message);
}

// Test 2: Refresh token generation (simulate)
console.log('\n2. Testing refresh token generation...');
try {
  const generateRefreshToken = (userId) => {
    try {
      // Validate JWT refresh secret is available
      if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32) {
        console.error('JWT_REFRESH_SECRET is missing or too short');
        throw new Error('Invalid JWT refresh configuration');
      }

      return jwt.sign({ userId, tokenId: 'test-id' }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      });
    } catch (error) {
      console.error('Failed to generate refresh token:', {
        error: error.message,
        userId
      });
      throw new Error('Refresh token generation failed');
    }
  };

  const refreshToken = generateRefreshToken(mockUser.id);
  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  
  console.log('   ✅ Refresh token generated successfully');
  console.log(`   📊 Token length: ${refreshToken.length}`);
  console.log(`   📊 Decoded payload:`, { 
    userId: decoded.userId, 
    tokenId: decoded.tokenId 
  });
  
} catch (error) {
  console.log('   ❌ Refresh token test failed:', error.message);
}

// Test 3: Invalid secret handling
console.log('\n3. Testing error handling with invalid secret...');
try {
  const result = jwt.sign(mockUser, 'invalid-short-secret', { expiresIn: '15m' });
  console.log('   ❌ Should have failed but succeeded');
} catch (error) {
  console.log('   ✅ Correctly failed with invalid secret');
  console.log(`   📊 Error type: ${error.name}`);
}

console.log('\n🎯 JWT functionality tests completed!');