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

  it('should handle 401 errors properly with session refresh', async () => {
    // Set up a valid token initially
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    apiClient.setAuthToken(mockToken);

    // Mock unauthorized handler (should not be called due to successful session refresh)
    const mockUnauthorizedHandler = vi.fn().mockResolvedValue(undefined);
    apiClient.setUnauthorizedHandler(mockUnauthorizedHandler);

    // Mock fetch responses:
    // 1. First call (donation) returns 401
    // 2. Second call (profile for refresh) returns 200
    // 3. Third call (retry donation) returns 200
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url) => {
      callCount++;
      if (callCount === 1) {
        // First call (donation) returns 401
        return Promise.resolve({
          status: 401,
          ok: false,
          text: () => Promise.resolve('{"error": "Unauthorized"}')
        });
      } else if (callCount === 2) {
        // Second call (profile for session refresh) returns 200
        return Promise.resolve({
          status: 200,
          ok: true,
          text: () => Promise.resolve('{"success": true, "data": {"id": 1, "email": "user@example.com"}}')
        });
      } else {
        // Third call (retry donation) returns success
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

    // Verify that session refresh worked and unauthorized handler was NOT called
    expect(mockUnauthorizedHandler).toHaveBeenCalledTimes(0);
    
    // Verify that fetch was called 3 times (original + profile for refresh + retry)
    expect(fetch).toHaveBeenCalledTimes(3);
    
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