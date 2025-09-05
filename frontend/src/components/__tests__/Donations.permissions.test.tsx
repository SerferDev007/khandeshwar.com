/**
 * Test suite for Donations component permissions handling
 * Tests the fix for undefined role issue
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Donations from '../../../components/Donations';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

vi.mock('../../../components/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key // Simple mock that returns the key
  })
}));

vi.mock('../../../components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h2 data-testid="card-title">{children}</h2>
}));

vi.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => 
    <button onClick={onClick} {...props}>{children}</button>
}));

vi.mock('../../../components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}));

vi.mock('../../../components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}));

vi.mock('../../../components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

vi.mock('../../../components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />
}));

vi.mock('../../../components/ui/date-picker', () => ({
  DatePicker: (props: any) => <input type="date" {...props} />
}));

vi.mock('../../../components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h3>{children}</h3>,
  DialogDescription: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../../../components/TransactionTable', () => ({
  default: () => <div data-testid="transaction-table">Transaction Table</div>
}));

vi.mock('../../utils/api', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('Donations Component - Permissions Handling', () => {
  const mockProps = {
    transactions: [],
    onAddTransaction: vi.fn(),
    onUpdateTransaction: vi.fn(),
    onDeleteTransaction: vi.fn(),
    receiptCounter: 1001,
    onUpdateReceiptCounter: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle user with undefined role gracefully', async () => {
    const currentUser = {
      id: '123',
      email: 'test@example.com',
      role: undefined // This was causing the original error
    };

    render(<Donations {...mockProps} currentUser={currentUser} />);

    // Fill out the form
    const donorNameInput = screen.getByLabelText(/donations.donorName/);
    fireEvent.change(donorNameInput, { target: { value: 'Test Donor' } });

    const amountInput = screen.getByLabelText(/donations.amount/);
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /donations.submitButton/ });
    fireEvent.click(submitButton);

    // Should show error message for undefined role
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to verify permissions. Please try logging in again.');
    });

    // Should not call onAddTransaction
    expect(mockProps.onAddTransaction).not.toHaveBeenCalled();
  });

  it('should handle user with no role property gracefully', async () => {
    const currentUser = {
      id: '123',
      email: 'test@example.com'
      // no role property at all
    };

    render(<Donations {...mockProps} currentUser={currentUser} />);

    // Fill out the form
    const donorNameInput = screen.getByLabelText(/donations.donorName/);
    fireEvent.change(donorNameInput, { target: { value: 'Test Donor' } });

    const amountInput = screen.getByLabelText(/donations.amount/);
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /donations.submitButton/ });
    fireEvent.click(submitButton);

    // Should show error message for missing role
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to verify permissions. Please try logging in again.');
    });

    // Should not call onAddTransaction
    expect(mockProps.onAddTransaction).not.toHaveBeenCalled();
  });

  it('should reject user with Viewer role', async () => {
    const currentUser = {
      id: '123',
      email: 'test@example.com',
      role: 'Viewer'
    };

    render(<Donations {...mockProps} currentUser={currentUser} />);

    // Fill out the form
    const donorNameInput = screen.getByLabelText(/donations.donorName/);
    fireEvent.change(donorNameInput, { target: { value: 'Test Donor' } });

    const amountInput = screen.getByLabelText(/donations.amount/);
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /donations.submitButton/ });
    fireEvent.click(submitButton);

    // Should show permission error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You do not have permission to submit donations. Only Admin and Treasurer roles are allowed.');
    });

    // Should not call onAddTransaction
    expect(mockProps.onAddTransaction).not.toHaveBeenCalled();
  });

  it('should allow user with Admin role', async () => {
    const currentUser = {
      id: '123',
      email: 'test@example.com',
      role: 'Admin'
    };

    render(<Donations {...mockProps} currentUser={currentUser} />);

    // Fill out the form
    const donorNameInput = screen.getByLabelText(/donations.donorName/);
    fireEvent.change(donorNameInput, { target: { value: 'Test Donor' } });

    const amountInput = screen.getByLabelText(/donations.amount/);
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /donations.submitButton/ });
    fireEvent.click(submitButton);

    // Should NOT show permission error
    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalledWith('Unable to verify permissions. Please try logging in again.');
      expect(toast.error).not.toHaveBeenCalledWith('You do not have permission to submit donations. Only Admin and Treasurer roles are allowed.');
    });
  });

  it('should allow user with Treasurer role', async () => {
    const currentUser = {
      id: '123',
      email: 'test@example.com',
      role: 'Treasurer'
    };

    render(<Donations {...mockProps} currentUser={currentUser} />);

    // Fill out the form
    const donorNameInput = screen.getByLabelText(/donations.donorName/);
    fireEvent.change(donorNameInput, { target: { value: 'Test Donor' } });

    const amountInput = screen.getByLabelText(/donations.amount/);
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /donations.submitButton/ });
    fireEvent.click(submitButton);

    // Should NOT show permission error
    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalledWith('Unable to verify permissions. Please try logging in again.');
      expect(toast.error).not.toHaveBeenCalledWith('You do not have permission to submit donations. Only Admin and Treasurer roles are allowed.');
    });
  });
});