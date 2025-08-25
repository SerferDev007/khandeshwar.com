import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../utils/api';

// Mock fetch for testing
global.fetch = vi.fn();

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: '123' } }))
    });
  });

  describe('Donations API', () => {
    it('should call createDonation with correct endpoint and data', async () => {
      const donationData = {
        date: '2024-01-15',
        category: 'Vargani',
        subCategory: 'shivJayanti',
        description: 'Test donation',
        amount: 100,
        receiptNumber: '0001',
        donorName: 'John Doe',
        donorContact: '9876543210',
        familyMembers: 4,
        amountPerPerson: 25
      };

      await apiClient.createDonation(donationData);

      // Verify the correct endpoint is called
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/donations',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(donationData)
        })
      );
    });

    it('should handle donation API validation errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: [
            { path: ['donorName'], message: 'Donor name is required' }
          ]
        }))
      });

      const invalidData = { date: '2024-01-15' }; // Missing required fields

      await expect(apiClient.createDonation(invalidData)).rejects.toThrow();
    });
  });

  describe('Expenses API', () => {
    it('should call createExpense with correct endpoint and data', async () => {
      const expenseData = {
        date: '2024-01-15',
        category: 'Utsav',
        subCategory: 'ganeshUtsav',
        description: 'Festival expenses',
        amount: 500,
        payeeName: 'Vendor Ltd',
        payeeContact: '9876543210',
        receiptImages: ['base64image1', 'base64image2']
      };

      await apiClient.createExpense(expenseData);

      // Verify the correct endpoint is called
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/expenses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(expenseData)
        })
      );
    });
  });

  describe('Rent Payments API', () => {
    it('should call createRentPayment with correct endpoint and data', async () => {
      const rentPaymentData = {
        agreementId: 'agreement123',
        date: '2024-01-15',
        amount: 5000,
        paymentMethod: 'Cash',
        description: 'Monthly rent payment',
        receiptNumber: 'R001'
      };

      await apiClient.createRentPayment(rentPaymentData);

      // Verify the correct endpoint is called  
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/rent/payments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(rentPaymentData)
        })
      );
    });

    it('should handle rent payment API validation errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: [
            { path: ['agreementId'], message: 'Agreement ID is required' }
          ]
        }))
      });

      const invalidData = { date: '2024-01-15' }; // Missing agreementId

      await expect(apiClient.createRentPayment(invalidData)).rejects.toThrow();
    });
  });

  describe('Authentication', () => {
    it('should make requests when token is set', async () => {
      const testToken = 'test-jwt-token';
      apiClient.setAuthToken(testToken);

      await apiClient.createDonation({ 
        date: '2024-01-15', 
        category: 'test', 
        description: 'test', 
        amount: 100, 
        donorName: 'test' 
      });

      // Verify request was made (token handling is internal to ApiClient)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/donations',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should handle 401 unauthorized responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve(JSON.stringify({
          success: false,
          error: 'Unauthorized'
        }))
      });

      await expect(apiClient.createDonation({})).rejects.toThrow('Unauthorized');
    });
  });
});