/**
 * Basic authentication persistence test
 * Tests the JWT authentication flow to ensure tokens persist correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient from '../utils/api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('JWT Authentication Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store token in localStorage with correct key after setAuthToken', () => {
    const testToken = 'eyJpZCI6MS5kZmFzZGZhc2RmYXNkZi4zNDU2N2ZnaDc4OQ==';
    
    // Mock localStorage.setItem
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.getItem.mockImplementation(() => testToken);
    
    // Set auth token
    apiClient.setAuthToken(testToken);
    
    // Verify localStorage.setItem was called with correct key
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', testToken);
  });

  it('should retrieve token from localStorage on initFromStorage', () => {
    const testToken = 'eyJpZCI6MS5kZmFzZGZhc2RmYXNkZi4zNDU2N2ZnaDc4OQ==';
    
    // Mock localStorage.getItem to return test token
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return testToken;
      return null;
    });
    
    // Initialize from storage
    apiClient.initFromStorage();
    
    // Verify localStorage.getItem was called with correct key
    expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
    
    // Verify token is now available
    expect(apiClient.getAuthToken()).toBe(testToken);
  });

  it('should clear token from localStorage when setAuthToken(null)', () => {
    // Mock localStorage methods
    localStorageMock.removeItem.mockImplementation(() => {});
    
    // Clear auth token
    apiClient.setAuthToken(null);
    
    // Verify localStorage.removeItem was called with correct key
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('should handle localStorage unavailable gracefully', () => {
    // Mock localStorage to be unavailable (simulating SSR or privacy mode)
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      configurable: true
    });
    
    // This should not throw an error and should log a warning
    expect(() => {
      apiClient.initFromStorage();
    }).not.toThrow();
    
    // Restore localStorage mock for other tests
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true
    });
  });
});