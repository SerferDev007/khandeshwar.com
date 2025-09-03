/**
 * Test suite for UsersRoute improvements
 * Tests the role checking and initialization guard functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { UsersRoute } from '../UsersRoute';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

// Mock the dependencies
vi.mock('../../context/DataContext', () => ({
  useData: vi.fn()
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock UserManagement component
vi.mock('../../../components/UserManagement', () => ({
  default: ({ users, loading, error }: any) => (
    <div data-testid="user-management">
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error-state">{error || 'no-error'}</div>
    </div>
  )
}));

describe('UsersRoute Role and Initialization Improvements', () => {
  const mockUseAuth = vi.mocked(useAuth);
  const mockUseData = vi.mocked(useData);
  const mockFetchUsers = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseData.mockReturnValue({
      users: [],
      loading: { users: false } as any,
      errors: { users: null } as any,
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      fetchUsers: mockFetchUsers,
      // Add other required properties with defaults
      shops: [],
      tenants: [],
      agreements: [],
      loans: [],
      penalties: [],
      transactions: [],
      receiptCounters: { donations: 1001, rentIncome: 5001 },
      usersPagination: null,
      fetchShops: vi.fn(),
      fetchTenants: vi.fn(),
      fetchAgreements: vi.fn(),
      fetchLoans: vi.fn(),
      fetchPenalties: vi.fn(),
      fetchTransactions: vi.fn(),
      createShop: vi.fn(),
      updateShop: vi.fn(),
      deleteShop: vi.fn(),
      createTenant: vi.fn(),
      updateTenant: vi.fn(),
      deleteTenant: vi.fn(),
      createAgreement: vi.fn(),
      updateAgreement: vi.fn(),
      deleteAgreement: vi.fn(),
      createLoan: vi.fn(),
      updateLoan: vi.fn(),
      deleteLoan: vi.fn(),
      createTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      createDonation: vi.fn(),
      updateDonation: vi.fn(),
      deleteDonation: vi.fn(),
      fetchDonations: vi.fn(),
      createExpense: vi.fn(),
      updateExpense: vi.fn(),
      deleteExpense: vi.fn(),
      fetchExpenses: vi.fn(),
      clearError: vi.fn(),
      clearAllErrors: vi.fn()
    });
  });

  it('should fetch users when user is Admin', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'Admin', id: '1', username: 'admin', email: 'admin@test.com', status: 'Active', createdAt: '2024-01-01' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    render(<UsersRoute />);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1);
  });

  it('should fetch users when user is Treasurer', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'Treasurer', id: '2', username: 'treasurer', email: 'treasurer@test.com', status: 'Active', createdAt: '2024-01-01' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    render(<UsersRoute />);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1);
  });

  it('should not fetch users when user is Viewer', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'Viewer', id: '3', username: 'viewer', email: 'viewer@test.com', status: 'Active', createdAt: '2024-01-01' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    const { container } = render(<UsersRoute />);

    expect(mockFetchUsers).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull(); // Should return null for Viewer role
  });

  it('should not render anything for Viewer role', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'Viewer', id: '3', username: 'viewer', email: 'viewer@test.com', status: 'Active', createdAt: '2024-01-01' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    const { container } = render(<UsersRoute />);

    expect(container.firstChild).toBeNull();
  });

  it('should render UserManagement component for Admin', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'Admin', id: '1', username: 'admin', email: 'admin@test.com', status: 'Active', createdAt: '2024-01-01' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    const { getByTestId } = render(<UsersRoute />);

    expect(getByTestId('user-management')).toBeInTheDocument();
  });

  it('should render UserManagement component for Treasurer', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'Treasurer', id: '2', username: 'treasurer', email: 'treasurer@test.com', status: 'Active', createdAt: '2024-01-01' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    const { getByTestId } = render(<UsersRoute />);

    expect(getByTestId('user-management')).toBeInTheDocument();
  });

  it('should only call fetchUsers once even with multiple re-renders', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'Admin', id: '1', username: 'admin', email: 'admin@test.com', status: 'Active', createdAt: '2024-01-01' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    const { rerender } = render(<UsersRoute />);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1);

    // Re-render with the same props
    rerender(<UsersRoute />);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1); // Should still be 1 due to initializedRef
  });
});