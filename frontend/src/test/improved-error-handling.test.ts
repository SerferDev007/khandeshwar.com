import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from '../utils/api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock storage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

describe('Improved Error Handling', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
    apiClient = new ApiClient('http://localhost:8081');
  });

  describe('401 Error Handling', () => {
    it('should attempt session refresh before clearing token on 401', async () => {
      const testToken = 'test-token-12345';
      const testUser = { id: 1, email: 'test@example.com' };

      // Set up token in localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      apiClient.initFromStorage();

      // First call - return 401 (expired token)
      // Second call - return 200 (profile for refresh)
      // Third call - return 200 (retry original request)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ success: false, error: 'Token expired' })),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ success: true, data: testUser })),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ success: true, data: { message: 'success' } })),
        } as Response);

      // Make request that initially returns 401
      const result = await apiClient.get('/api/protected-resource');

      expect(result).toEqual({ message: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Verify session was cached after successful refresh
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('session_auth_token', testToken);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('session_current_user', JSON.stringify(testUser));
    });

    it('should clear session only after session refresh fails', async () => {
      const testToken = 'invalid-token-12345';

      // Set up token in localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      apiClient.initFromStorage();

      // First call - return 401 (expired token)
      // Second call - return 401 (profile call for refresh also fails)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ success: false, error: 'Token expired' })),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ success: false, error: 'Token invalid' })),
        } as Response);

      // Make request that returns 401 and refresh also fails
      await expect(apiClient.get('/api/protected-resource')).rejects.toThrow('Unauthorized: Please login again');

      // Verify session was cleared after failed refresh
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_auth_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_current_user');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_token_timestamp');
    });

    it('should not attempt refresh on retry attempts to prevent infinite loops', async () => {
      const testToken = 'test-token-12345';

      // Set up token in localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      apiClient.initFromStorage();

      // Mock 401 response for both calls
      mockFetch
        .mockResolvedValue({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ success: false, error: 'Token expired' })),
        } as Response);

      // Make request - should attempt refresh once but not on retry
      await expect(apiClient.get('/api/protected-resource')).rejects.toThrow('Unauthorized: Please login again');

      // Should be called 2 times: original request and profile for refresh (which also fails)
      // No retry attempt because refresh fails
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('403 Error Handling', () => {
    it('should preserve session on 403 Forbidden errors', async () => {
      const testToken = 'valid-token-12345';
      const timestamp = Date.now();

      // Set up valid session
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      sessionStorageMock.getItem.mockImplementation((key) => {
        if (key === 'session_auth_token') return testToken;
        if (key === 'session_token_timestamp') return timestamp.toString();
        return null;
      });

      apiClient.initFromStorage();

      // Mock 403 response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ 
          success: false, 
          error: 'Insufficient permissions' 
        })),
      } as Response);

      // Make request that returns 403
      await expect(apiClient.get('/api/admin-only-resource')).rejects.toThrow('Insufficient permissions');

      // Verify session was NOT cleared
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('auth_token');
      expect(sessionStorageMock.removeItem).not.toHaveBeenCalledWith('session_auth_token');
      expect(sessionStorageMock.removeItem).not.toHaveBeenCalledWith('session_current_user');
      expect(sessionStorageMock.removeItem).not.toHaveBeenCalledWith('session_token_timestamp');
    });
  });

  describe('Network Error Handling', () => {
    it('should not clear session on network errors', async () => {
      const testToken = 'valid-token-12345';
      const timestamp = Date.now();

      // Set up valid session
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      sessionStorageMock.getItem.mockImplementation((key) => {
        if (key === 'session_auth_token') return testToken;
        if (key === 'session_token_timestamp') return timestamp.toString();
        return null;
      });

      apiClient.initFromStorage();

      // Mock network error for all attempts (to avoid long retry delays)
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      // Make request that fails with network error
      await expect(apiClient.get('/api/some-resource')).rejects.toThrow('Failed to fetch');

      // Verify session was NOT cleared
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('auth_token');
      expect(sessionStorageMock.removeItem).not.toHaveBeenCalledWith('session_auth_token');
      expect(sessionStorageMock.removeItem).not.toHaveBeenCalledWith('session_current_user');
      expect(sessionStorageMock.removeItem).not.toHaveBeenCalledWith('session_token_timestamp');
    }, 10000); // Allow longer timeout for retries
  });
});