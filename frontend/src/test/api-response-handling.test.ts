/**
 * Tests for robust API response handling and token extraction
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

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('API Response Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  describe('pickAccessToken functionality', () => {
    it('should extract token from wrapped response (demo backend format)', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: 1, username: 'test' },
          accessToken: 'demo-token-123',
          refreshToken: 'refresh-token-456'
        }
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      await apiClient.login('test@example.com', 'password');

      // Verify token was set
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'demo-token-123');
    });

    it('should extract token from nested tokens object', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: 1, username: 'test' },
          tokens: {
            accessToken: 'nested-token-789',
            refreshToken: 'nested-refresh-123'
          }
        }
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      await apiClient.login('test@example.com', 'password');

      // Verify token was set
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'nested-token-789');
    });

    it('should extract token from unwrapped response', async () => {
      const mockResponse = {
        accessToken: 'unwrapped-token-456',
        user: { id: 1, username: 'test' }
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      await apiClient.login('test@example.com', 'password');

      // Verify token was set
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'unwrapped-token-456');
    });

    it('should handle alternative token key names', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: 1, username: 'test' },
          jwt: 'jwt-token-999'
        }
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      await apiClient.login('test@example.com', 'password');

      // Verify token was set
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-999');
    });

    it('should fail gracefully when no token is found', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: 1, username: 'test' }
          // No token fields
        }
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      await expect(apiClient.login('test@example.com', 'password'))
        .rejects.toThrow('Login succeeded but no access token found in response');

      // Verify auth_token was not set (ignore localStorage test calls)
      const authTokenCalls = localStorageMock.setItem.mock.calls.filter(
        call => call[0] === 'auth_token'
      );
      expect(authTokenCalls).toHaveLength(0);
    });
  });

  describe('Response format handling', () => {
    it('should handle wrapped success response', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'test data' }
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      const result = await apiClient.get('/test');
      expect(result).toEqual({ message: 'test data' });
    });

    it('should handle unwrapped success response', async () => {
      const mockResponse = {
        message: 'test data',
        id: 123
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      const result = await apiClient.get('/test');
      expect(result).toEqual({ message: 'test data', id: 123 });
    });

    it('should handle wrapped error response', async () => {
      const mockResponse = {
        success: false,
        error: 'Something went wrong'
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      await expect(apiClient.get('/test'))
        .rejects.toThrow('Something went wrong');
    });
  });
});