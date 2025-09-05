import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient, SESSION_CACHE_TTL } from '../utils/api';

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

// Mock window
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

describe('Session-Based Authentication Caching', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
    apiClient = new ApiClient('http://localhost:8081');
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Session Token Caching', () => {
    it('should cache token after successful validation', async () => {
      const testToken = 'test-token-12345';
      const testUser = { id: 1, email: 'test@example.com', username: 'testuser' };

      // Set up token in localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      // Initialize apiClient
      apiClient.initFromStorage();

      // Mock successful profile response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          success: true,
          data: testUser
        })),
      } as Response);

      // Call refreshAuthSession
      const result = await apiClient.refreshAuthSession();

      expect(result).toEqual(testUser);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('session_auth_token', testToken);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('session_current_user', JSON.stringify(testUser));
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('session_token_timestamp', expect.any(String));
    });

    it('should use cached token within TTL without API call', () => {
      const testToken = 'test-token-12345';
      const timestamp = Date.now();

      // Set up localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      // Set up sessionStorage with valid cache
      sessionStorageMock.getItem.mockImplementation((key) => {
        if (key === 'session_auth_token') return testToken;
        if (key === 'session_token_timestamp') return timestamp.toString();
        return null;
      });

      apiClient.initFromStorage();

      // Get session token - should use cache without API call
      const result = apiClient.getSessionToken();

      expect(result).toBe(testToken);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should detect expired cache and indicate validation needed', () => {
      const testToken = 'test-token-12345';
      const expiredTimestamp = Date.now() - SESSION_CACHE_TTL - 1000; // 1 second past TTL

      // Set up localStorage
      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? testToken : null;
      });

      // Set up sessionStorage with expired cache
      sessionStorageMock.getItem.mockImplementation((key) => {
        if (key === 'session_auth_token') return testToken;
        if (key === 'session_token_timestamp') return expiredTimestamp.toString();
        return null;
      });

      apiClient.initFromStorage();

      // Get session token - should return token but indicate validation needed
      const result = apiClient.getSessionToken();

      expect(result).toBe(testToken);
      // Verify expired cache was cleared
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_auth_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_current_user');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_token_timestamp');
    });
  });

  describe('Session User Caching', () => {
    it('should return cached user info without API call', () => {
      const testUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      const timestamp = Date.now();

      // Set up sessionStorage with valid cache
      sessionStorageMock.getItem.mockImplementation((key) => {
        if (key === 'session_current_user') return JSON.stringify(testUser);
        if (key === 'session_token_timestamp') return timestamp.toString();
        if (key === 'session_auth_token') return 'valid-token'; // Need this for session to be valid
        return null;
      });

      apiClient.initFromStorage();

      const result = apiClient.getCurrentSessionUser();

      expect(result).toEqual(testUser);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for expired user cache', () => {
      const testUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      const expiredTimestamp = Date.now() - SESSION_CACHE_TTL - 1000;

      // Set up sessionStorage with expired cache
      sessionStorageMock.getItem.mockImplementation((key) => {
        if (key === 'session_current_user') return JSON.stringify(testUser);
        if (key === 'session_token_timestamp') return expiredTimestamp.toString();
        return null;
      });

      apiClient.initFromStorage();

      const result = apiClient.getCurrentSessionUser();

      expect(result).toBeNull();
    });
  });

  describe('Session Management API', () => {
    it('should clear all session data on clearAuthSession', () => {
      apiClient.initFromStorage();
      apiClient.clearAuthSession();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_auth_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_current_user');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_token_timestamp');
    });

    it('should clear session cache when localStorage token changes', () => {
      const testToken = 'test-token-12345';
      let currentToken = testToken;

      localStorageMock.getItem.mockImplementation((key) => {
        return key === 'auth_token' ? currentToken : null;
      });

      apiClient.initFromStorage();

      // Simulate cross-tab token change
      const storageEvent = new StorageEvent('storage', {
        key: 'auth_token',
        newValue: null,
        oldValue: testToken
      });
      
      window.dispatchEvent(storageEvent);

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_auth_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_current_user');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('session_token_timestamp');
    });
  });

  describe('Login Session Caching', () => {
    it('should cache session data after successful login', async () => {
      const loginResponse = {
        success: true,
        data: {
          user: { id: 1, email: 'test@example.com', username: 'testuser' },
          accessToken: 'new-token-12345'
        },
        user: { id: 1, email: 'test@example.com', username: 'testuser' },
        accessToken: 'new-token-12345'
      };

      // Mock successful login response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(loginResponse)),
      } as Response);

      apiClient.initFromStorage();

      await apiClient.login('test@example.com', 'password');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token-12345');
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('session_auth_token', 'new-token-12345');
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('session_current_user', JSON.stringify(loginResponse.user));
    });
  });
});