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
    console.log('🔐 Token Management: Setting auth token', {
      tokenPresent: !!token,
      tokenStart: token ? token.substring(0, 10) + '...' : 'null',
      tokenLength: token?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
      console.log('💾 Token Management: Token stored in localStorage', {
        action: 'store',
        tokenStart: token.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      });
    } else {
      localStorage.removeItem('auth_token');
      console.log('🗑️ Token Management: Token removed from localStorage', {
        action: 'remove',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    // Always return the fresh token from localStorage to ensure synchronization
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedToken !== this.token) {
      console.log('🔄 Token Management: Token sync from localStorage', {
        previousTokenStart: this.token ? this.token.substring(0, 10) + '...' : 'null',
        newTokenStart: storedToken ? storedToken.substring(0, 10) + '...' : 'null',
        tokenChanged: storedToken !== this.token,
        timestamp: new Date().toISOString()
      });
    }
    
    this.token = storedToken;
    return this.token;
  }

  /**
   * Check if a token appears to be valid (basic format check)
   */
  private isTokenValid(token: string | null): boolean {
    if (!token) return false;
    // JWT tokens should have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
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
    
    // Validate token format before using it
    if (this.token && !this.isTokenValid(this.token)) {
      console.warn('⚠️ Token Management: Invalid token format detected, clearing token', {
        tokenStart: this.token.substring(0, 10) + '...',
        tokenLength: this.token.length,
        timestamp: new Date().toISOString()
      });
      this.setAuthToken(null);
      this.token = null;
    }
    
    // Add authorization header if valid token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('🔑 Request: Authorization header added', {
        endpoint: normalizedEndpoint,
        method,
        tokenStart: this.token.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('🔓 Request: No authorization token available', {
        endpoint: normalizedEndpoint,
        method,
        timestamp: new Date().toISOString()
      });
    }

    // Log outgoing request details
    console.log('📤 API Request:', {
      method,
      url,
      endpoint: normalizedEndpoint,
      hasAuth: !!this.token,
      headers: {
        'Content-Type': headers['Content-Type'],
        Authorization: this.token ? `Bearer ${this.token.substring(0, 10)}...` : 'none'
      },
      retryCount,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies and credentials for CORS
      });

      // Handle 401 Unauthorized - clear session and route to login
      if (response.status === 401) {
        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: responseText };
        }
        
        console.error('🚨 401 Unauthorized Response:', {
          method,
          url,
          endpoint: normalizedEndpoint,
          status: response.status,
          statusText: response.statusText,
          responseData,
          headers: {
            'content-type': response.headers.get('content-type'),
            'www-authenticate': response.headers.get('www-authenticate')
          },
          hadToken: !!this.token,
          tokenStart: this.token ? this.token.substring(0, 10) + '...' : 'none',
          timestamp: new Date().toISOString()
        });
        
        console.log('🔄 Token Management: Clearing token due to 401', {
          previousToken: this.token ? this.token.substring(0, 10) + '...' : 'none',
          timestamp: new Date().toISOString()
        });
        
        this.setAuthToken(null); // Clear token
        if (this.onUnauthorized) {
          console.log('📞 Calling unauthorized handler due to 401');
          this.onUnauthorized(); // Call global 401 handler
        }
        const error = new Error('Unauthorized: Please login again') as ApiError;
        error.statusCode = 401;
        throw error;
      }

      const responseText = await response.text();
      let data: ApiResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('📥 Response parsing error:', {
          method,
          url,
          status: response.status,
          responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          timestamp: new Date().toISOString()
        });
        throw new Error('Invalid JSON response from server');
      }

      // Log response details
      console.log('📥 API Response:', {
        method,
        url,
        endpoint: normalizedEndpoint,
        status: response.status,
        statusText: response.statusText,
        success: data.success,
        hasData: !!data.data,
        error: data.error,
        responseHeaders: {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length')
        },
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`) as ApiError;
        error.statusCode = response.status;
        error.details = data.details;
        
        console.error('❌ API Error Response:', {
          method,
          url,
          endpoint: normalizedEndpoint,
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          willRetry: response.status >= 500 && retryCount < maxRetries,
          retryCount,
          timestamp: new Date().toISOString()
        });
        
        // Retry logic for server errors (5xx) on idempotent requests
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log('⏳ Retrying request after error:', {
            method,
            url,
            retryCount: retryCount + 1,
            maxRetries,
            delayMs: delay,
            timestamp: new Date().toISOString()
          });
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        
        throw error;
      }

      if (!data.success) {
        const error = new Error(data.error || 'API request failed') as ApiError;
        error.details = data.details;
        
        console.error('❌ API Business Logic Error:', {
          method,
          url,
          endpoint: normalizedEndpoint,
          error: data.error,
          details: data.details,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      }

      console.log('✅ Request completed successfully:', {
        method,
        url,
        endpoint: normalizedEndpoint,
        hasData: !!data.data,
        timestamp: new Date().toISOString()
      });

      return data.data;
    } catch (error) {
      // Network errors - retry idempotent requests
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network Error:', {
          method,
          url,
          endpoint: normalizedEndpoint,
          error: error.message,
          retryCount,
          maxRetries,
          willRetry: retryCount < maxRetries,
          timestamp: new Date().toISOString()
        });
        
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log('⏳ Retrying request after network error:', {
            method,
            url,
            retryCount: retryCount + 1,
            maxRetries,
            delayMs: delay,
            timestamp: new Date().toISOString()
          });
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      
      console.error('💥 Request failed:', {
        method,
        url,
        endpoint: normalizedEndpoint,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount,
        timestamp: new Date().toISOString()
      });
      
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
    console.log('🔐 Auth: Login attempt', {
      email: email.substring(0, 3) + '***',
      hasPassword: !!password,
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await this.post('/api/auth/login', { email, password });
      
      console.log('✅ Auth: Login successful', {
        email: email.substring(0, 3) + '***',
        hasTokens: !!(result.accessToken || result.tokens?.accessToken),
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('❌ Auth: Login failed', {
        email: email.substring(0, 3) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async register(userData: any) {
    return this.post('/api/auth/register', userData);
  }

  async getProfile() {
    return this.get('/api/auth/profile');
  }

  async logout() {
    console.log('🚪 Auth: Logout attempt', {
      hasToken: !!this.token,
      tokenStart: this.token ? this.token.substring(0, 10) + '...' : 'none',
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await this.post('/api/auth/logout');
      
      console.log('✅ Auth: Logout successful', {
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('❌ Auth: Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
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