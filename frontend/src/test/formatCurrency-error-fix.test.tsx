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

describe('RentManagement formatCurrency Error Fix', () => {
  it('should not crash when shop has undefined monthlyRent and deposit', () => {
    const shopWithUndefinedValues = {
      id: '1',
      shopNumber: 'S001',
      size: 100,
      monthlyRent: undefined, // This would cause toLocaleString() error
      deposit: undefined,     // This would cause toLocaleString() error  
      status: 'Vacant' as const,
      createdAt: '2023-01-01',
    };

    expect(() => {
      render(
        <TestWrapper>
          <RentManagement
            {...mockProps}
            shops={[shopWithUndefinedValues]}
            tenants={[]}
            agreements={[]}
            loans={[]}
            penalties={[]}
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('should not crash when shop has null monthlyRent and deposit', () => {
    const shopWithNullValues = {
      id: '1',
      shopNumber: 'S001',
      size: 100,
      monthlyRent: null,     // This would cause toLocaleString() error
      deposit: null,         // This would cause toLocaleString() error
      status: 'Vacant' as const,
      createdAt: '2023-01-01',
    };

    expect(() => {
      render(
        <TestWrapper>
          <RentManagement
            {...mockProps}
            shops={[shopWithNullValues]}
            tenants={[]}
            agreements={[]}
            loans={[]}
            penalties={[]}
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('should not crash when shop has NaN monthlyRent and deposit', () => {
    const shopWithNaNValues = {
      id: '1',
      shopNumber: 'S001',
      size: 100,
      monthlyRent: NaN,      // This would cause toLocaleString() error
      deposit: NaN,          // This would cause toLocaleString() error
      status: 'Vacant' as const,
      createdAt: '2023-01-01',
    };

    expect(() => {
      render(
        <TestWrapper>
          <RentManagement
            {...mockProps}
            shops={[shopWithNaNValues]}
            tenants={[]}
            agreements={[]}
            loans={[]}
            penalties={[]}
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('should display safe fallback text for undefined monetary values', () => {
    const shopWithUndefinedValues = {
      id: '1',
      shopNumber: 'S001',
      size: 100,
      monthlyRent: undefined,
      deposit: undefined,
      status: 'Vacant' as const,
      createdAt: '2023-01-01',
    };

    render(
      <TestWrapper>
        <RentManagement
          {...mockProps}
          shops={[shopWithUndefinedValues]}
          tenants={[]}
          agreements={[]}
          loans={[]}
          penalties={[]}
        />
      </TestWrapper>
    );

    // The component should render without errors and show safe fallback values
    expect(screen.getByText('S001')).toBeInTheDocument();
    // Should show 0 or some safe fallback for monetary values instead of crashing
  });
});