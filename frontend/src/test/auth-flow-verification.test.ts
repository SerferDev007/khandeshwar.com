/**
 * Manual verification test for authentication flow
 * This test simulates the complete authentication flow to verify:
 * 1. Token is stored in localStorage after login
 * 2. Authorization header is sent on subsequent requests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient from '../utils/api';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Authentication Flow Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  it('should complete full authentication flow: login -> store token -> send auth header', async () => {
    const testToken = 'test-auth-token-12345';
    
    // Step 1: Mock successful login response
    const mockLoginResponse = {
      success: true,
      data: {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        accessToken: testToken,
        refreshToken: 'refresh-token-67890'
      }
    };

    let mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockLoginResponse)),
    } as Response);

    // Step 2: Perform login
    await apiClient.login('test@example.com', 'password');

    // Step 3: Verify token was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', testToken);

    // Step 4: Mock localStorage to return the stored token
    localStorageMock.getItem.mockImplementation((key) => {
      return key === 'auth_token' ? testToken : null;
    });

    // Step 5: Mock successful API response for authenticated request
    const mockApiResponse = {
      success: true,
      data: [{ id: 1, name: 'Test User' }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockApiResponse)),
    } as Response);

    // Step 6: Make an authenticated request
    await apiClient.get('/api/users');

    // Step 7: Verify Authorization header was sent
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const requestOptions = lastCall[1] as RequestInit;
    const headers = requestOptions.headers as Headers;
    
    expect(headers.get('Authorization')).toBe(`Bearer ${testToken}`);
  });

  it('should handle token retrieval after page reload simulation', async () => {
    const testToken = 'stored-token-from-previous-session';

    // Simulate token already exists in localStorage (from previous session)
    localStorageMock.getItem.mockImplementation((key) => {
      return key === 'auth_token' ? testToken : null;
    });

    // Initialize apiClient from storage (simulating page reload)
    apiClient.initFromStorage();

    // Verify token is retrieved
    expect(apiClient.getAuthToken()).toBe(testToken);

    // Mock API response
    const mockApiResponse = { success: true, data: { message: 'authenticated' } };
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockApiResponse)),
    } as Response);

    // Make request with stored token
    await apiClient.get('/api/profile');

    // Verify Authorization header was sent with stored token
    const lastCall = mockFetch.mock.calls[0];
    const requestOptions = lastCall[1] as RequestInit;
    const headers = requestOptions.headers as Headers;
    
    expect(headers.get('Authorization')).toBe(`Bearer ${testToken}`);
  });

  it('should clear token on 401 response', async () => {
    const expiredToken = 'expired-token-123';

    // Set up expired token
    apiClient.setAuthToken(expiredToken);
    localStorageMock.setItem.mockClear(); // Clear previous calls
    localStorageMock.removeItem.mockClear();

    // Mock 401 response
    const mock401Response = {
      success: false,
      error: 'Token expired'
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify(mock401Response)),
    } as Response);

    // Make request that returns 401
    await expect(apiClient.get('/api/protected-resource'))
      .rejects.toThrow('Unauthorized: Please login again');

    // Verify token was cleared from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');

    // Verify token is cleared from memory
    expect(apiClient.getAuthToken()).toBeNull();
  });
});