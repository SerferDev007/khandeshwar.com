import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../utils/api';

// Mock localStorage
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.data = {};
  })
};

// Mock global objects
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Donations authentication integration', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8081');
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should handle 401 errors properly with refresh retry', async () => {
    // Set up a valid token initially
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    apiClient.setAuthToken(mockToken);

    // Mock unauthorized handler that simulates successful refresh
    const mockUnauthorizedHandler = vi.fn().mockResolvedValue(undefined);
    apiClient.setUnauthorizedHandler(mockUnauthorizedHandler);

    // Mock fetch to return 401 first, then success on retry
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call returns 401
        return Promise.resolve({
          status: 401,
          text: () => Promise.resolve('{"error": "Unauthorized"}')
        });
      } else {
        // Second call (after refresh) returns success
        return Promise.resolve({
          status: 200,
          ok: true,
          text: () => Promise.resolve('{"success": true, "data": {"id": "123"}}')
        });
      }
    });

    // Attempt to create donation
    const donationData = { amount: 100, category: 'General' };
    const result = await apiClient.createDonation(donationData);

    // Verify that unauthorized handler was called
    expect(mockUnauthorizedHandler).toHaveBeenCalledTimes(1);
    
    // Verify that fetch was called twice (original + retry)
    expect(fetch).toHaveBeenCalledTimes(2);
    
    // Verify successful result (API client extracts data from response)
    expect(result).toEqual({ id: "123" });
  });

  it('should provide helpful logging for createDonation calls', async () => {
    // Set up a token
    const mockToken = 'test.token.here';
    apiClient.setAuthToken(mockToken);

    // Mock console.log to capture logging
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock fetch to return success
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('{"success": true}')
    });

    await apiClient.createDonation({ amount: 500, category: 'Vargani' });

    // Verify that debug logging was called
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🎯 createDonation called'),
      expect.objectContaining({
        hasToken: true,
        tokenStart: 'test.token...',
        donationData: { category: 'Vargani', amount: 500 }
      })
    );

    consoleSpy.mockRestore();
  });
});