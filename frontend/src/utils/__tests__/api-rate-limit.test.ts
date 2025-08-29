import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../api';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Rate Limiting Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset API client state
    apiClient.setAuthToken('test-token');
  });

  it('should handle 429 rate limit errors with retry logic', async () => {
    // First two requests return 429, third succeeds
    (fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('{"success": false, "error": "Too many requests"}')
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('{"success": false, "error": "Too many requests"}')
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve('{"success": true, "data": {"id": "test-shop", "shopNumber": "TEST-001"}}')
      });

    const shopData = {
      shopNumber: 'TEST-001',
      size: 100,
      monthlyRent: 5000,
      deposit: 10000,
      description: 'Test shop'
    };

    // This should eventually succeed after retries
    const result = await apiClient.createShop(shopData);
    
    expect(result).toEqual({
      id: 'test-shop',
      shopNumber: 'TEST-001'
    });
    
    // Should have made 3 requests (2 failures + 1 success)
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 15000); // Increase timeout to 15 seconds

  it('should handle immediate success after 429 error', async () => {
    // First request returns 429, second succeeds
    (fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('{"success": false, "error": "Too many requests"}')
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve('{"success": true, "data": {"id": "test-shop-2", "shopNumber": "TEST-002"}}')
      });

    const shopData = {
      shopNumber: 'TEST-002',
      size: 100,
      monthlyRent: 5000,
      deposit: 10000,
      description: 'Test shop 2'
    };

    const result = await apiClient.createShop(shopData);
    
    expect(result).toEqual({
      id: 'test-shop-2',
      shopNumber: 'TEST-002'
    });
    
    // Should have made 2 requests (1 failure + 1 success)
    expect(fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should properly parse 429 error messages', async () => {
    const errorMessage = 'Rate limit exceeded - please wait';
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve(`{"success": false, "error": "${errorMessage}"}`)
    });

    const shopData = {
      shopNumber: 'TEST-003',
      size: 100,
      monthlyRent: 5000,
      deposit: 10000,
      description: 'Test shop 3'
    };

    try {
      await apiClient.createShop(shopData);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests. Please wait a moment and try again.');
    }
  }, 15000);
});