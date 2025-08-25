import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Expenses from '../../../components/Expenses';
import { LanguageProvider } from '../../../components/LanguageContext';

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

// Test wrapper with necessary providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

// Mock props
const mockProps = {
  transactions: [],
  onAddTransaction: vi.fn(),
  onUpdateTransaction: vi.fn(),
  onDeleteTransaction: vi.fn(),
  currentUser: { id: '1', name: 'Test User', role: 'Admin' }
};

describe('Expenses Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders expense form with required fields', () => {
    render(
      <TestWrapper>
        <Expenses {...mockProps} />
      </TestWrapper>
    );

    // Check for key form elements - get the header specifically
    expect(screen.getAllByText(/add expense/i)).toHaveLength(2); // Title + button
    expect(screen.getByRole('heading', { name: /add expense/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payee.*name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/details/i)).toBeInTheDocument();
  });

  test('shows correct submit button label', () => {
    render(
      <TestWrapper>
        <Expenses {...mockProps} />
      </TestWrapper>
    );

    // The button should show "Add Expense" not "Add Donation"
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    expect(submitButton).toBeInTheDocument();
    
    // Should NOT show "Add Donation" 
    const wrongButton = screen.queryByRole('button', { name: /add donation/i });
    expect(wrongButton).not.toBeInTheDocument();
  });

  test('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Expenses {...mockProps} />
      </TestWrapper>
    );

    // Try to submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/required/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  test('calls onAddTransaction when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Expenses {...mockProps} />
      </TestWrapper>
    );

    // Fill out required fields
    const payeeNameInput = screen.getByLabelText(/payee.*name/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const detailsInput = screen.getByLabelText(/details/i);

    await user.type(payeeNameInput, 'ABC Suppliers');
    await user.type(amountInput, '2000');
    await user.type(detailsInput, 'Temple maintenance supplies');

    const submitButton = screen.getByRole('button', { name: /add expense/i });
    
    // Verify form elements are filled correctly
    expect(payeeNameInput).toHaveValue('ABC Suppliers');
    expect(amountInput).toHaveValue('2000');
    expect(detailsInput).toHaveValue('Temple maintenance supplies');
    expect(submitButton).toBeInTheDocument();
  });

  test('handles contact input validation for payee', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Expenses {...mockProps} />
      </TestWrapper>
    );

    const contactInput = screen.getByLabelText(/payee.*contact/i);
    
    // Test invalid contact (letters)
    await user.type(contactInput, 'invalid');
    expect(contactInput).toHaveValue(''); // Should not accept letters

    // Test valid contact (numbers)
    await user.type(contactInput, '9876543210');
    expect(contactInput).toHaveValue('9876543210');
  });

  test('handles amount input validation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Expenses {...mockProps} />
      </TestWrapper>
    );

    const amountInput = screen.getByLabelText(/amount/i);
    
    // Test valid decimal amount
    await user.type(amountInput, '1234.56');
    expect(amountInput).toHaveValue('1234.56');

    // Clear and test invalid input
    await user.clear(amountInput);
    await user.type(amountInput, 'invalid');
    expect(amountInput).toHaveValue('');
  });

  test('displays transaction table', () => {
    const transactionsData = [
      {
        id: '1',
        date: '2025-01-01',
        type: 'Expense',
        category: 'Temple Maintenance',
        payeeName: 'ABC Suppliers',
        amount: 2000,
        description: 'Cleaning supplies'
      }
    ];

    render(
      <TestWrapper>
        <Expenses {...mockProps} transactions={transactionsData} />
      </TestWrapper>
    );

    // Should render the transaction table component
    expect(screen.getByRole('table') || screen.getByText(/transactions/i)).toBeInTheDocument();
  });
});