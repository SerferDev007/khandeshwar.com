/**
 * Test API client retry policy and token age functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('API Client Retry Policy', () => {
  let mockFetch;
  
  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    
    // Mock sessionStorage
    global.sessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
  });

  it('should retry up to 3 times for idempotent methods', async () => {
    const { default: ApiClient } = await import('../src/utils/api.ts');
    const client = new ApiClient('http://localhost:8081');
    
    // Mock connection refused error
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    
    try {
      await client.get('/api/test');
    } catch (error) {
      // Should fail after retries
      expect(error.message).toContain('Backend server is offline');
    }
    
    // Should have been called 3 times (initial + 2 retries)
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should not retry for POST methods on network errors', async () => {
    const { default: ApiClient } = await import('../src/utils/api.ts');
    const client = new ApiClient('http://localhost:8081');
    
    // Mock connection refused error
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    
    try {
      await client.post('/api/test', { data: 'test' });
    } catch (error) {
      // Should fail immediately
      expect(error.message).toContain('Failed to fetch');
    }
    
    // Should have been called only once (no retries for non-idempotent methods)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 500 errors for idempotent methods', async () => {
    const { default: ApiClient } = await import('../src/utils/api.ts');
    const client = new ApiClient('http://localhost:8081');
    
    // Mock 500 server error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' })
    });
    
    try {
      await client.get('/api/test');
    } catch (error) {
      // Should fail after retries
      expect(error.message).toContain('Internal Server Error');
    }
    
    // Should have been called 4 times (initial + 3 retries for 5xx)
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('should not retry on 4xx errors except 429', async () => {
    const { default: ApiClient } = await import('../src/utils/api.ts');
    const client = new ApiClient('http://localhost:8081');
    
    // Mock 404 error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not Found' })
    });
    
    try {
      await client.get('/api/test');
    } catch (error) {
      // Should fail immediately
      expect(error.message).toContain('Not Found');
    }
    
    // Should have been called only once (no retries for 4xx)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});