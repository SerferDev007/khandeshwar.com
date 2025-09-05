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

describe('ApiClient refresh method', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8081');
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should throw error when no token is available for refresh', async () => {
    // Ensure no token in storage
    expect(apiClient.getAuthToken()).toBeNull();

    await expect(apiClient.refresh()).rejects.toThrow('No auth token available for refresh');
  });

  it('should attempt to verify token via profile call when refreshing', async () => {
    // Set a mock token
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    apiClient.setAuthToken(mockToken);

    // Mock the getProfile method to simulate a successful response
    vi.spyOn(apiClient, 'getProfile').mockResolvedValue({ 
      id: 1, 
      email: 'test@example.com', 
      role: 'Admin' 
    });

    const result = await apiClient.refresh();
    
    expect(result).toEqual({ 
      id: 1, 
      email: 'test@example.com', 
      role: 'Admin' 
    });
    expect(apiClient.getProfile).toHaveBeenCalledTimes(1);
  });

  it('should throw error when token is invalid during refresh', async () => {
    // Set a mock token
    const mockToken = 'invalid.token.here';
    apiClient.setAuthToken(mockToken);

    // Mock the getProfile method to simulate a 401 response
    vi.spyOn(apiClient, 'getProfile').mockRejectedValue(new Error('Unauthorized'));

    await expect(apiClient.refresh()).rejects.toThrow('Unauthorized');
    expect(apiClient.getProfile).toHaveBeenCalledTimes(1);
  });
});