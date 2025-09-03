/**
 * Test suite for DataContext improvements
 * Tests the enhanced fetchUsers functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { DataProvider, useData } from '../DataContext';
import { useAuth } from '../AuthContext';
import apiClient from '../../utils/api';

// Mock the dependencies
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../utils/api', () => ({
  default: {
    getUsers: vi.fn()
  }
}));

// Test component to access DataContext
function TestComponent() {
  const { users, usersPagination, fetchUsers, loading, errors } = useData();
  
  return (
    <div data-testid="test-component">
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="pagination">{JSON.stringify(usersPagination)}</div>
      <div data-testid="loading">{loading.users.toString()}</div>
      <div data-testid="error">{errors.users || 'null'}</div>
      <button onClick={fetchUsers} data-testid="fetch-users">Fetch Users</button>
    </div>
  );
}

describe('DataContext Users API Improvements', () => {
  const mockUseAuth = vi.mocked(useAuth);
  const mockApiClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle wrapped response shape: { data: { users: [...], pagination: {...} } }', async () => {
    const mockUsers = [
      { id: '1', username: 'admin', email: 'admin@test.com', role: 'Admin', status: 'Active', createdAt: '2024-01-01' }
    ];
    const mockPagination = { page: 1, limit: 10, total: 1, pages: 1 };
    
    mockApiClient.getUsers.mockResolvedValue({
      data: {
        users: mockUsers,
        pagination: mockPagination
      }
    });

    const { getByTestId } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {
      getByTestId('fetch-users').click();
    });

    expect(getByTestId('users-count').textContent).toBe('1');
    expect(JSON.parse(getByTestId('pagination').textContent!)).toEqual(mockPagination);
  });

  it('should handle unwrapped response shape: { users: [...], pagination: {...} }', async () => {
    const mockUsers = [
      { id: '1', username: 'treasurer', email: 'treasurer@test.com', role: 'Treasurer', status: 'Active', createdAt: '2024-01-01' }
    ];
    const mockPagination = { page: 1, limit: 10, total: 1, pages: 1 };
    
    mockApiClient.getUsers.mockResolvedValue({
      users: mockUsers,
      pagination: mockPagination
    });

    const { getByTestId } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {
      getByTestId('fetch-users').click();
    });

    expect(getByTestId('users-count').textContent).toBe('1');
    expect(JSON.parse(getByTestId('pagination').textContent!)).toEqual(mockPagination);
  });

  it('should handle empty response gracefully', async () => {
    mockApiClient.getUsers.mockResolvedValue({});

    const { getByTestId } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {
      getByTestId('fetch-users').click();
    });

    expect(getByTestId('users-count').textContent).toBe('0');
    expect(getByTestId('pagination').textContent).toBe('null');
  });

  it('should preserve existing users data on error and show detailed error message', async () => {
    // Set NODE_ENV to development for this test
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    try {
      const mockUsers = [
        { id: '1', username: 'existing', email: 'existing@test.com', role: 'Admin', status: 'Active', createdAt: '2024-01-01' }
      ];
      
      // First successful call
      mockApiClient.getUsers.mockResolvedValueOnce({
        data: {
          users: mockUsers
        }
      });

      const { getByTestId } = render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      await act(async () => {
        getByTestId('fetch-users').click();
      });

      expect(getByTestId('users-count').textContent).toBe('1');

      // Second call fails with 500 error
      const mockError = new Error('Internal Server Error');
      (mockError as any).statusCode = 500;
      mockApiClient.getUsers.mockRejectedValueOnce(mockError);

      await act(async () => {
        getByTestId('fetch-users').click();
      });

      // Users data should be preserved
      expect(getByTestId('users-count').textContent).toBe('1');
      
      // Error message should include status code in development
      const errorText = getByTestId('error').textContent;
      expect(errorText).toContain('500');
      expect(errorText).toContain('Internal Server Error');
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('should prevent multiple concurrent fetch calls', async () => {
    let resolvePromise: (value: any) => void;
    const slowPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockApiClient.getUsers.mockReturnValue(slowPromise);

    const { getByTestId } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    // First call - should proceed
    act(() => {
      getByTestId('fetch-users').click();
    });

    // Second call - should be skipped
    act(() => {
      getByTestId('fetch-users').click();
    });

    // Should only be called once
    expect(mockApiClient.getUsers).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise!({
      data: {
        users: [{ id: '1', username: 'test', email: 'test@test.com', role: 'Admin', status: 'Active', createdAt: '2024-01-01' }]
      }
    });

    await act(async () => {
      await slowPromise;
    });

    // Now a third call should work
    mockApiClient.getUsers.mockResolvedValue({
      data: { users: [] }
    });

    await act(async () => {
      getByTestId('fetch-users').click();
    });

    expect(mockApiClient.getUsers).toHaveBeenCalledTimes(2);
  });
});