import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import RentManagement from '../../components/RentManagement';
import { LanguageProvider } from '../../components/LanguageContext';

// Mock API client
vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

// Mock dependencies
const mockProps = {
  onAddRentIncome: vi.fn(),
  nextReceiptNumber: 'R001',
  onAddShop: vi.fn(),
  onUpdateShop: vi.fn(),
  onDeleteShop: vi.fn(),
  onAddTenant: vi.fn(),
  onUpdateTenant: vi.fn(),
  onDeleteTenant: vi.fn(),
  onCreateAgreement: vi.fn(),
  onUpdateAgreement: vi.fn(),
  onAddLoan: vi.fn(),
  onUpdateLoan: vi.fn(),
  onAddPenalty: vi.fn(),
  onUpdatePenalty: vi.fn(),
  onRentCollection: vi.fn(),
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

describe('RentManagement Array Normalization', () => {
  it('should render without errors when props are undefined/null', () => {
    const { container } = render(
      <TestWrapper>
        <RentManagement
          {...mockProps}
          shops={undefined}
          tenants={null}
          agreements={undefined}
          loans={null}
          penalties={undefined}
        />
      </TestWrapper>
    );

    // Should render without crashing - this tests the toArray normalization
    expect(container).toBeInTheDocument();
  });

  it('should render without errors when props are arrays', () => {
    const shops = [
      {
        id: '1',
        shopNumber: 'S001',
        size: 100,
        monthlyRent: 5000,
        deposit: 10000,
        status: 'Vacant' as const,
        createdAt: '2023-01-01',
      }
    ];

    const { container } = render(
      <TestWrapper>
        <RentManagement
          {...mockProps}
          shops={shops}
          tenants={[]}
          agreements={[]}
          loans={[]}
          penalties={[]}
        />
      </TestWrapper>
    );

    expect(container).toBeInTheDocument();
  });

  it('should render without errors when props are single objects', () => {
    const singleShop = {
      id: '1',
      shopNumber: 'S001',
      size: 100,
      monthlyRent: 5000,
      deposit: 10000,
      status: 'Vacant' as const,
      createdAt: '2023-01-01',
    };

    const { container } = render(
      <TestWrapper>
        <RentManagement
          {...mockProps}
          shops={singleShop} // Single object instead of array
          tenants={[]}
          agreements={[]}
          loans={[]}
          penalties={[]}
        />
      </TestWrapper>
    );

    // Should render without crashing - this tests that single objects are converted to arrays
    expect(container).toBeInTheDocument();
  });

  it('should render without map errors when given mixed data types', () => {
    const mixedData = {
      shops: [{ id: '1', shopNumber: 'S001', size: 100, monthlyRent: 5000, deposit: 10000, status: 'Vacant' as const, createdAt: '2023-01-01' }],
      tenants: { id: '1', name: 'John Doe', phone: '1234567890', email: 'john@example.com', address: '123 Main St', businessType: 'Retail', createdAt: '2023-01-01', status: 'Active' as const },
      agreements: undefined,
      loans: null,
      penalties: []
    };

    const { container } = render(
      <TestWrapper>
        <RentManagement
          {...mockProps}
          shops={mixedData.shops}
          tenants={mixedData.tenants}
          agreements={mixedData.agreements}
          loans={mixedData.loans}
          penalties={mixedData.penalties}
        />
      </TestWrapper>
    );

    // Should render without runtime errors like ".map is not a function"
    expect(container).toBeInTheDocument();
  });
});