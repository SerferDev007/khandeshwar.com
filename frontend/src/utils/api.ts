/**
 * API Client for Khandeshwar Management System
 * Handles all communication with the backend API with retry logic and proper auth handling
 */

// Centralize API base URL from environment
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
}

interface ApiError extends Error {
  statusCode?: number;
  details?: any[];
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private onUnauthorized?: () => void;

  constructor(baseURL: string) {
    // Normalize base URL by removing trailing slashes
    this.baseURL = baseURL.replace(/\/+$/, '');
    // Initialize token from localStorage if available
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set callback for handling 401 unauthorized responses
   */
  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    // Always return the fresh token from localStorage to ensure synchronization
    this.token = localStorage.getItem('auth_token');
    return this.token;
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a request method is idempotent (safe to retry)
   */
  private isIdempotentMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method.toUpperCase());
  }

  /**
   * Make HTTP request with proper error handling, retry logic, and 401 handling
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Ensure endpoint starts with slash and normalize multiple slashes
    const normalizedEndpoint = ('/' + endpoint).replace(/\/+/g, '/');
    const url = `${this.baseURL}${normalizedEndpoint}`;
    const method = options.method || 'GET';
    const maxRetries = this.isIdempotentMethod(method) ? 3 : 0; // Only retry idempotent requests
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ensure we have the latest token from localStorage for each request
    this.token = localStorage.getItem('auth_token');
    
    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies and credentials for CORS
      });

      // Handle 401 Unauthorized - clear session and route to login
      if (response.status === 401) {
        this.setAuthToken(null); // Clear token
        if (this.onUnauthorized) {
          this.onUnauthorized(); // Call global 401 handler
        }
        const error = new Error('Unauthorized: Please login again') as ApiError;
        error.statusCode = 401;
        throw error;
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`) as ApiError;
        error.statusCode = response.status;
        error.details = data.details;
        
        // Retry logic for server errors (5xx) on idempotent requests
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        
        throw error;
      }

      if (!data.success) {
        const error = new Error(data.error || 'API request failed') as ApiError;
        error.details = data.details;
        throw error;
      }

      return data.data;
    } catch (error) {
      // Network errors - retry idempotent requests
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.post('/api/auth/login', { email, password });
  }

  async register(userData: any) {
    return this.post('/api/auth/register', userData);
  }

  async getProfile() {
    return this.get('/api/auth/profile');
  }

  async logout() {
    return this.post('/api/auth/logout');
  }

  // Health check
  async getHealth() {
    return this.get('/api/health');
  }

  // User endpoints
  async getUsers() {
    return this.get('/api/users');
  }

  async createUser(userData: any) {
    return this.post('/api/users', userData);
  }

  async updateUser(id: string, userData: any) {
    return this.put(`/api/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete(`/api/users/${id}`);
  }

  // Shop endpoints
  async getShops() {
    return this.get('/api/shops');
  }

  async getShop(id: string) {
    return this.get(`/api/shops/${id}`);
  }

  async createShop(shopData: any) {
    return this.post('/api/shops', shopData);
  }

  async updateShop(id: string, shopData: any) {
    return this.put(`/api/shops/${id}`, shopData);
  }

  async deleteShop(id: string) {
    return this.delete(`/api/shops/${id}`);
  }

  // Tenant endpoints
  async getTenants() {
    return this.get('/api/tenants');
  }

  async getTenant(id: string) {
    return this.get(`/api/tenants/${id}`);
  }

  async createTenant(tenantData: any) {
    return this.post('/api/tenants', tenantData);
  }

  async updateTenant(id: string, tenantData: any) {
    return this.put(`/api/tenants/${id}`, tenantData);
  }

  async deleteTenant(id: string) {
    return this.delete(`/api/tenants/${id}`);
  }

  // Agreement endpoints
  async getAgreements() {
    return this.get('/api/agreements');
  }

  async getAgreement(id: string) {
    return this.get(`/api/agreements/${id}`);
  }

  async createAgreement(agreementData: any) {
    return this.post('/api/agreements', agreementData);
  }

  async updateAgreement(id: string, agreementData: any) {
    return this.put(`/api/agreements/${id}`, agreementData);
  }

  async deleteAgreement(id: string) {
    return this.delete(`/api/agreements/${id}`);
  }

  async getAgreementsByTenant(tenantId: string) {
    return this.get(`/api/agreements/tenant/${tenantId}`);
  }

  // Loan endpoints
  async getLoans() {
    return this.get('/api/loans');
  }

  async getLoan(id: string) {
    return this.get(`/api/loans/${id}`);
  }

  async createLoan(loanData: any) {
    return this.post('/api/loans', loanData);
  }

  async updateLoan(id: string, loanData: any) {
    return this.put(`/api/loans/${id}`, loanData);
  }

  async deleteLoan(id: string) {
    return this.delete(`/api/loans/${id}`);
  }

  async getLoansByAgreement(agreementId: string) {
    return this.get(`/api/loans/agreement/${agreementId}`);
  }

  // Rent Penalty endpoints
  async getRentPenalties() {
    return this.get('/api/rent-penalties');
  }

  async getRentPenalty(id: string) {
    return this.get(`/api/rent-penalties/${id}`);
  }

  async createRentPenalty(penaltyData: any) {
    return this.post('/api/rent-penalties', penaltyData);
  }

  async updateRentPenalty(id: string, penaltyData: any) {
    return this.put(`/api/rent-penalties/${id}`, penaltyData);
  }

  async deleteRentPenalty(id: string) {
    return this.delete(`/api/rent-penalties/${id}`);
  }

  // Transaction endpoints
  async getTransactions() {
    return this.get('/api/transactions');
  }

  async getTransaction(id: string) {
    return this.get(`/api/transactions/${id}`);
  }

  async createTransaction(transactionData: any) {
    return this.post('/api/transactions', transactionData);
  }

  async updateTransaction(id: string, transactionData: any) {
    return this.put(`/api/transactions/${id}`, transactionData);
  }

  async deleteTransaction(id: string) {
    return this.delete(`/api/transactions/${id}`);
  }

  async getTransactionsByType(type: string) {
    return this.get(`/api/transactions/type/${type}`);
  }

  // File endpoints
  async getUploadUrl(fileName: string, fileType: string) {
    return this.post('/api/files/upload-url', { fileName, fileType });
  }

  async getMyFiles() {
    return this.get('/api/files/my-files');
  }

  async deleteFile(id: string) {
    return this.delete(`/api/uploaded-files/${id}`);
  }

  // Donation endpoints (transactions with type 'Donation')
  async getDonations() {
    return this.get('/api/donations');
  }

  async getDonation(id: string) {
    return this.get(`/api/donations/${id}`);
  }

  async createDonation(donationData: any) {
    return this.post('/api/donations', donationData);
  }

  async updateDonation(id: string, donationData: any) {
    return this.put(`/api/donations/${id}`, donationData);
  }

  async deleteDonation(id: string) {
    return this.delete(`/api/donations/${id}`);
  }

  // Expense endpoints (transactions with type 'Expense')
  async getExpenses() {
    return this.get('/api/expenses');
  }

  async getExpense(id: string) {
    return this.get(`/api/expenses/${id}`);
  }

  async createExpense(expenseData: any) {
    return this.post('/api/expenses', expenseData);
  }

  async updateExpense(id: string, expenseData: any) {
    return this.put(`/api/expenses/${id}`, expenseData);
  }

  async deleteExpense(id: string) {
    return this.delete(`/api/expenses/${id}`);
  }

  // Rent management endpoints
  async getRentUnits() {
    return this.get('/api/rent/units');
  }

  async getRentTenants() {
    return this.get('/api/rent/tenants');
  }

  async getRentLeases() {
    return this.get('/api/rent/leases');
  }

  async getRentPayments() {
    return this.get('/api/rent/payments');
  }

  async createRentPayment(paymentData: any) {
    return this.post('/api/rent/payments', paymentData);
  }
}

// Create and export singleton instance
const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
export { ApiClient, type ApiError };