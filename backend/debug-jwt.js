#!/usr/bin/env node

import jwt from 'jsonwebtoken';

const mockEnv = {
  JWT_SECRET: 'test-secret-key-for-middleware-testing-12345',
  JWT_EXPIRES_IN: '15m'
};

// Test token creation and verification
const user = { id: 1, username: 'admin', email: 'admin@example.com', role: 'Admin' };

console.log('Creating token...');
const token = jwt.sign(
  { userId: user.id, username: user.username, email: user.email, role: user.role },
  mockEnv.JWT_SECRET,
  { expiresIn: mockEnv.JWT_EXPIRES_IN }
);

console.log('Token created:', token);

console.log('\nVerifying token...');
try {
  const decoded = jwt.verify(token, mockEnv.JWT_SECRET);
  console.log('Token verified successfully:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}

console.log('\nTesting middleware mock...');
const mockQuery = async (sql, params) => {
  console.log('Mock query called with:', sql, params);
  if (sql.includes('SELECT id, username, email, role, status FROM users WHERE id = ?')) {
    const userId = params[0];
    console.log('Looking up user with ID:', userId);
    if (userId === 1) {
      return [{
        id: 1,
        username: 'admin',
        email: 'admin@example.com', 
        role: 'Admin',
        status: 'Active'
      }];
    }
  }
  return [];
};

// Test the query
const result = await mockQuery(
  'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = ?',
  [1, 'Active']
);
console.log('Query result:', result);