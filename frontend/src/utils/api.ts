/**
 * API Client for Khandeshwar Management System
 * 
 * Features:
 * - Safe localStorage with SSR-friendly initialization
 * - Robust authentication handling with automatic token extraction
 * - Support for both wrapped ({ success, data }) and unwrapped API responses
 * - Comprehensive logging for debugging authentication flows
 * - Automatic retry on network errors and server errors
 * - Cross-tab token synchronization
 * 
 * Authentication Flow:
 * 1. login() method automatically extracts tokens from various response formats
 * 2. Tokens are automatically stored in localStorage with verification
 * 3. All subsequent requests include Authorization: Bearer header
 * 4. 401 responses automatically clear tokens and trigger logout handler
 */

// Add this type declaration at the top of your file (or in a global .d.ts file)
interface ImportMetaEnv {
  VITE_BACKEND_URL?: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}

const API_BASE_URL = "http://localhost:8081";

const AUTH_TOKEN_KEY = "auth_token";

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

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    const testKey = "__ls_test__";
    ls.setItem(testKey, "1");
    ls.removeItem(testKey);
    return ls;
  } catch {
    return null;
  }
}

function isLikelyJwt(token: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * Robustly extracts access tokens from various API response shapes.
 * Handles both wrapped and unwrapped responses with multiple token key variations.
 * 
 * @param obj - The API response object to extract token from
 * @returns The extracted token or null if not found
 */
function pickAccessToken(obj: any): string | null {
  if (!obj || typeof obj !== 'object') {
    console.warn('⚠️ pickAccessToken: Invalid object provided', { obj });
    return null;
  }

  // Direct token keys (unwrapped responses)
  const directKeys = ['accessToken', 'token', 'access_token', 'jwt', 'id_token'];
  for (const key of directKeys) {
    if (obj[key] && typeof obj[key] === 'string') {
      console.log('🔍 Token found at direct key:', { key, tokenStart: obj[key].slice(0, 10) + '...' });
      return obj[key];
    }
  }

  // Nested token keys (wrapped responses)
  const nestedPaths = [
    'data.accessToken',
    'data.tokens.accessToken', 
    'data.token',
    'data.access_token',
    'data.jwt',
    'data.id_token',
    'tokens.accessToken',
    'tokens.token',
    'tokens.access_token'
  ];

  for (const path of nestedPaths) {
    const keys = path.split('.');
    let current = obj;
    let valid = true;

    // Navigate the nested path
    for (const key of keys) {
      if (current && typeof current === 'object' && current[key] !== undefined) {
        current = current[key];
      } else {
        valid = false;
        break;
      }
    }

    if (valid && current && typeof current === 'string') {
      console.log('🔍 Token found at nested path:', { path, tokenStart: current.slice(0, 10) + '...' });
      return current;
    }
  }

  console.warn('⚠️ pickAccessToken: No token found in response', { 
    availableKeys: Object.keys(obj),
    hasData: !!obj.data,
    dataKeys: obj.data ? Object.keys(obj.data) : null
  });
  return null;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private onUnauthorized?: () => void;
  private ls: Storage | null = null;

  constructor(baseURL: string) {
    // Normalize base URL by removing trailing slashes
    this.baseURL = baseURL.replace(/\/+$/, "");
    // DO NOT touch localStorage here (constructor may run on server)
    this.ls = null;
  }

  /**
   * Call this once from a browser-only spot (e.g., in a useEffect or app bootstrap)
   * to hydrate token from localStorage and start listening for cross-tab updates.
   */
  initFromStorage({
    listenCrossTab = true,
  }: { listenCrossTab?: boolean } = {}) {
    this.ls = safeLocalStorage();
    if (this.ls) {
      const stored = this.ls.getItem(AUTH_TOKEN_KEY);
      this.token = stored && stored.trim() ? stored : null;
      console.log("🔄 Token init from storage", {
        present: !!this.token,
        start: this.token ? this.token.slice(0, 10) + "..." : "null",
        ts: new Date().toISOString(),
      });

      if (listenCrossTab && typeof window !== "undefined") {
        window.addEventListener("storage", (e) => {
          if (e.key === AUTH_TOKEN_KEY) {
            const newVal = e.newValue && e.newValue.trim() ? e.newValue : null;
            if (newVal !== this.token) {
              console.log("🪟 Cross-tab token sync", {
                old: this.token ? this.token.slice(0, 10) + "..." : "null",
                new: newVal ? newVal.slice(0, 10) + "..." : "null",
              });
              this.token = newVal;
            }
          }
        });
      }
    } else {
      console.warn(
        "⚠️ localStorage unavailable; token will be in-memory only."
      );
    }
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  setAuthToken(token: string | null) {
    const ts = new Date().toISOString();
    console.log("🔐 setAuthToken()", {
      incoming: !!token,
      start: token ? token.slice(0, 10) + "..." : "null",
      len: token?.length ?? 0,
      ts,
    });

    this.token = token && token.trim() ? token : null;

    // Persist if possible
    const ls = this.ls ?? safeLocalStorage();
    if (!ls) {
      console.warn("⚠️ localStorage unavailable; skipping persist.");
      return;
    }

    try {
      if (this.token) {
        ls.setItem(AUTH_TOKEN_KEY, this.token);
        const verify = ls.getItem(AUTH_TOKEN_KEY);
        const ok = verify === this.token;
        console.log("💾 Token stored", { verified: ok, ts });
        if (!ok) console.warn("⚠️ Token verification mismatch after write.");
      } else {
        ls.removeItem(AUTH_TOKEN_KEY);
        console.log("🗑️ Token cleared", { ts });
      }
    } catch (err) {
      console.error("❌ Token persist failed:", err);
    }
  }

  getAuthToken(): string | null {
    const ls = this.ls ?? safeLocalStorage();
    if (!ls) return this.token; // in-memory fallback
    const stored = ls.getItem(AUTH_TOKEN_KEY);
    if (stored !== this.token) {
      console.log("🔄 Token sync (read)", {
        old: this.token ? this.token.slice(0, 10) + "..." : "null",
        new: stored ? stored.slice(0, 10) + "..." : "null",
      });
      this.token = stored && stored.trim() ? stored : null;
    }
    return this.token;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private isIdempotentMethod(method: string): boolean {
    const m = method.toUpperCase();
    return m === "GET" || m === "HEAD" || m === "OPTIONS";
  }

  protected async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const normalizedEndpoint = ("/" + endpoint).replace(/\/+/g, "/");
    const url = `${this.baseURL}${normalizedEndpoint}`;
    const method = (options.method || "GET").toUpperCase();
    const maxRetries = this.isIdempotentMethod(method) ? 3 : 0;

    // Prepare headers without clobbering caller-provided ones
    const headers = new Headers(options.headers || {});
    const hasBody = options.body != null;
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    // Only set Content-Type if we’re sending JSON and caller didn’t provide one
    if (hasBody && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Fresh token on every request
    const currentToken = this.getAuthToken();

    // Basic format check (still allow non-JWT opaque tokens by skipping hard clear)
    if (currentToken && !isLikelyJwt(currentToken)) {
      console.warn("⚠️ Token does not look like a JWT (proceeding anyway).");
    }

    if (currentToken) {
      headers.set("Authorization", `Bearer ${currentToken}`);
      console.log("🔑 Auth header set", {
        endpoint: normalizedEndpoint,
        tokenStart: currentToken.slice(0, 10) + "...",
      });
    } else {
      console.log("🔓 No auth token for request", {
        endpoint: normalizedEndpoint,
      });
    }

    console.log("📤 API Request:", {
      method,
      url,
      endpoint: normalizedEndpoint,
      hasAuth: !!currentToken,
      retryCount,
    });

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: "include", // keep if you rely on cookies
      });

      if (response.status === 401) {
        const text = await response.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { error: text };
        }

        console.error("🚨 401 Unauthorized", {
          endpoint: normalizedEndpoint,
          parsed,
          hadToken: !!currentToken,
        });

        this.setAuthToken(null); // clear stored token
        this.onUnauthorized?.();

        const err = new Error("Unauthorized: Please login again") as ApiError;
        err.statusCode = 401;
        throw err;
      }

      // Handle 429 Rate Limit errors with retry logic
      if (response.status === 429) {
        const text = await response.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { error: text };
        }

        console.warn("⚠️ 429 Rate Limit Exceeded", {
          endpoint: normalizedEndpoint,
          parsed,
          retryCount
        });

        // Retry for rate limit errors (not just idempotent methods)
        if (retryCount < 3) { // Allow up to 3 retries for rate limits
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // Add jitter
          console.log("⏳ Retry after rate limit", {
            attempt: retryCount + 1,
            delay: Math.round(delay),
          });
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        const err = new Error("Too many requests. Please wait a moment and try again.") as ApiError;
        err.statusCode = 429;
        throw err;
      }

      const raw = await response.text();
      let payload: any;
      
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        console.error("📥 Invalid JSON from server", {
          status: response.status,
          preview: raw.slice(0, 200),
          error: e instanceof Error ? e.message : 'Parse failed'
        });
        throw new Error("Invalid JSON response from server");
      }

      // Handle both wrapped ({ success, data, error }) and unwrapped responses
      const isWrapped = typeof payload.success === 'boolean';
      const responseSuccess = isWrapped ? payload.success : response.ok;
      const responseData = isWrapped ? payload.data : payload;
      const responseError = isWrapped ? payload.error : null;

      console.log("📥 API Response:", {
        endpoint: normalizedEndpoint,
        status: response.status,
        wrapped: isWrapped,
        success: responseSuccess,
        hasData: !!responseData,
        error: responseError,
      });

      if (!response.ok) {
        const errorMessage = responseError || `HTTP ${response.status}`;
        const err = new Error(errorMessage) as ApiError;
        err.statusCode = response.status;
        err.details = isWrapped ? payload.details : undefined;

        // Retry only on 5xx and idempotent methods
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log("⏳ Retry after server error", {
            attempt: retryCount + 1,
            delay,
          });
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw err;
      }

      // For wrapped responses, check the success flag
      if (isWrapped && !responseSuccess) {
        const err = new Error(
          responseError || "API request failed"
        ) as ApiError;
        err.details = payload.details;
        throw err;
      }

      return responseData as T;
    } catch (e: any) {
      // Network error retry (TypeError thrown by fetch)
      if (e instanceof TypeError && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.error("🌐 Network error; retrying", {
          attempt: retryCount + 1,
          delay,
          msg: e.message,
        });
        await this.sleep(delay);
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      console.error("💥 Request failed", {
        endpoint: normalizedEndpoint,
        name: e?.name,
        message: e?.message,
      });
      throw e;
    }
  }

  // ----- Convenience methods -----
  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }
  post<T = any>(endpoint: string, data?: any) {
    const body =
      data instanceof FormData
        ? data
        : data != null
        ? JSON.stringify(data)
        : undefined;
    return this.request<T>(endpoint, { method: "POST", body });
  }
  put<T = any>(endpoint: string, data?: any) {
    const body =
      data instanceof FormData
        ? data
        : data != null
        ? JSON.stringify(data)
        : undefined;
    return this.request<T>(endpoint, { method: "PUT", body });
  }
  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // ----- Auth -----
  async login(email: string, password: string) {
    console.log("🔐 Auth login", { emailMasked: email.slice(0, 3) + "***" });
    
    const response = await this.post("/api/auth/login", { email, password });
    
    // Temporarily log the raw login response for diagnostics
    console.log("🔬 Raw login response:", JSON.stringify(response, null, 2));
    
    // Extract token from response using robust token picker
    const accessToken = pickAccessToken(response);
    
    if (accessToken) {
      console.log("✅ Login successful - extracted and setting auth token", {
        tokenStart: accessToken.slice(0, 10) + "...",
        tokenLength: accessToken.length,
        timestamp: new Date().toISOString()
      });
      
      // Automatically set the auth token
      this.setAuthToken(accessToken);
    } else {
      console.error("❌ Login failed - no access token found in response", {
        response,
        timestamp: new Date().toISOString()
      });
      throw new Error("Login succeeded but no access token found in response");
    }
    
    return response;
  }
  register(userData: any) {
    console.log("🔐 Auth register", { 
      emailMasked: userData.email ? userData.email.slice(0, 3) + "***" : "N/A"
    });
    
    return this.post("/api/auth/register", userData).then(response => {
      // Temporarily log the raw register response for diagnostics
      console.log("🔬 Raw register response:", JSON.stringify(response, null, 2));
      
      // Extract token from response using robust token picker
      const accessToken = pickAccessToken(response);
      
      if (accessToken) {
        console.log("✅ Register successful - extracted and setting auth token", {
          tokenStart: accessToken.slice(0, 10) + "...",
          tokenLength: accessToken.length,
          timestamp: new Date().toISOString()
        });
        
        // Automatically set the auth token
        this.setAuthToken(accessToken);
      } else {
        console.error("❌ Register failed - no access token found in response", {
          response,
          timestamp: new Date().toISOString()
        });
        throw new Error("Registration succeeded but no access token found in response");
      }
      
      return response;
    });
  }
  getProfile() {
    return this.get("/api/auth/profile");
  }
  logout() {
    return this.post("/api/auth/logout");
  }

  // ----- Domain endpoints (unchanged) -----
  getHealth() {
    return this.get("/api/health");
  }
  getUsers() {
    return this.get("/api/users");
  }
  createUser(d: any) {
    return this.post("/api/users", d);
  }
  updateUser(id: string, d: any) {
    return this.put(`/api/users/${id}`, d);
  }
  deleteUser(id: string) {
    return this.delete(`/api/users/${id}`);
  }

  getShops() {
    return this.get("/api/shops");
  }
  getShop(id: string) {
    return this.get(`/api/shops/${id}`);
  }
  createShop(d: any) {
    return this.post("/api/shops", d);
  }
  updateShop(id: string, d: any) {
    return this.put(`/api/shops/${id}`, d);
  }
  deleteShop(id: string) {
    return this.delete(`/api/shops/${id}`);
  }

  getTenants() {
    return this.get("/api/rent/tenants");
  }
  getTenant(id: string) {
    return this.get(`/api/rent/tenants/${id}`);
  }
  createTenant(d: any) {
    return this.post("/api/rent/tenants", d);
  }
  updateTenant(id: string, d: any) {
    return this.put(`/api/rent/tenants/${id}`, d);
  }
  deleteTenant(id: string) {
    return this.delete(`/api/rent/tenants/${id}`);
  }

  getAgreements() {
    return this.get("/api/rent/agreements");
  }
  getAgreement(id: string) {
    return this.get(`/api/rent/agreements/${id}`);
  }
  createAgreement(d: any) {
    return this.post("/api/rent/agreements", d);
  }
  updateAgreement(id: string, d: any) {
    return this.put(`/api/rent/agreements/${id}`, d);
  }
  deleteAgreement(id: string) {
    return this.delete(`/api/rent/agreements/${id}`);
  }
  getAgreementsByTenant(tenantId: string) {
    return this.get(`/api/rent/agreements/tenant/${tenantId}`);
  }

  getLoans() {
    return this.get("/api/loans");
  }
  getLoan(id: string) {
    return this.get(`/api/loans/${id}`);
  }
  createLoan(d: any) {
    return this.post("/api/loans", d);
  }
  updateLoan(id: string, d: any) {
    return this.put(`/api/loans/${id}`, d);
  }
  deleteLoan(id: string) {
    return this.delete(`/api/loans/${id}`);
  }
  getLoansByAgreement(agreementId: string) {
    return this.get(`/api/loans/agreement/${agreementId}`);
  }

  getRentPenalties() {
    return this.get("/api/rent-penalties");
  }
  getRentPenalty(id: string) {
    return this.get(`/api/rent-penalties/${id}`);
  }
  createRentPenalty(d: any) {
    return this.post("/api/rent-penalties", d);
  }
  updateRentPenalty(id: string, d: any) {
    return this.put(`/api/rent-penalties/${id}`, d);
  }
  deleteRentPenalty(id: string) {
    return this.delete(`/api/rent-penalties/${id}`);
  }

  getTransactions() {
    return this.get("/api/transactions");
  }
  getTransaction(id: string) {
    return this.get(`/api/transactions/${id}`);
  }
  createTransaction(d: any) {
    return this.post("/api/transactions", d);
  }
  updateTransaction(id: string, d: any) {
    return this.put(`/api/transactions/${id}`, d);
  }
  deleteTransaction(id: string) {
    return this.delete(`/api/transactions/${id}`);
  }
  getTransactionsByType(type: string) {
    return this.get(`/api/transactions/type/${type}`);
  }

  getUploadUrl(fileName: string, fileType: string) {
    return this.post("/api/files/upload-url", { fileName, fileType });
  }
  getMyFiles() {
    return this.get("/api/files/my-files");
  }
  deleteFile(id: string) {
    return this.delete(`/api/uploaded-files/${id}`);
  }

  getDonations() {
    return this.get("/api/donations");
  }
  getDonation(id: string) {
    return this.get(`/api/donations/${id}`);
  }
  createDonation(d: any) {
    return this.post("/api/donations", d);
  }
  updateDonation(id: string, d: any) {
    return this.put(`/api/donations/${id}`, d);
  }
  deleteDonation(id: string) {
    return this.delete(`/api/donations/${id}`);
  }

  getExpenses() {
    return this.get("/api/expenses");
  }
  getExpense(id: string) {
    return this.get(`/api/expenses/${id}`);
  }
  createExpense(d: any) {
    return this.post("/api/expenses", d);
  }
  updateExpense(id: string, d: any) {
    return this.put(`/api/expenses/${id}`, d);
  }
  deleteExpense(id: string) {
    return this.delete(`/api/expenses/${id}`);
  }

  getRentUnits() {
    return this.get("/api/rent/units");
  }
  getRentTenants() {
    return this.get("/api/rent/tenants");
  }
  getRentLeases() {
    return this.get("/api/rent/leases");
  }
  getRentPayments() {
    return this.get("/api/rent/payments");
  }
  createRentPayment(d: any) {
    return this.post("/api/rent/payments", d);
  }
}

import MockApiClient from './mockApiClient';

// Development fallback mode
let useMockMode = false;
let mockClient: MockApiClient | null = null;

class ApiClientWithFallback extends ApiClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    try {
      // Try real API first
      return await super.request<T>(endpoint, options, retryCount);
    } catch (error: any) {
      // If network error and not already using mock mode, switch to mock
      if (error instanceof TypeError && error.message === 'Failed to fetch' && !useMockMode) {
        console.warn('🔄 Backend not available, switching to mock mode for development');
        useMockMode = true;
        mockClient = new MockApiClient();
        
        // Extract auth token if available and set it in mock client
        const currentToken = this.getAuthToken();
        if (currentToken) {
          mockClient.setAuthToken(currentToken);
        }
        
        return this.handleMockRequest<T>(endpoint, options);
      }
      
      // If already using mock mode, handle with mock
      if (useMockMode && mockClient) {
        return this.handleMockRequest<T>(endpoint, options);
      }
      
      throw error;
    }
  }

  private async handleMockRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!mockClient) {
      mockClient = new MockApiClient();
    }

    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    
    // Route to appropriate mock method based on endpoint and method
    try {
      if (endpoint === '/api/auth/login' && method === 'POST') {
        return await mockClient.login(body.email, body.password) as T;
      }
      
      if (endpoint === '/api/auth/profile' && method === 'GET') {
        return await mockClient.getProfile() as T;
      }
      
      if (endpoint === '/api/auth/logout' && method === 'POST') {
        this.setAuthToken(null); // Clear real client token too
        return await mockClient.logout() as T;
      }
      
      if (endpoint === '/api/shops') {
        if (method === 'GET') return await mockClient.getShops() as T;
        if (method === 'POST') return await mockClient.createShop(body) as T;
      }
      
      if (endpoint.startsWith('/api/shops/')) {
        const id = endpoint.split('/').pop()!;
        if (method === 'PUT') return await mockClient.updateShop(id, body) as T;
        if (method === 'DELETE') return await mockClient.deleteShop(id) as T;
      }
      
      if (endpoint === '/api/rent/tenants') {
        if (method === 'GET') return await mockClient.getTenants() as T;
        if (method === 'POST') return await mockClient.createTenant(body) as T;
      }
      
      if (endpoint.startsWith('/api/rent/tenants/')) {
        const id = endpoint.split('/').pop()!;
        if (method === 'PUT') return await mockClient.updateTenant(id, body) as T;
        if (method === 'DELETE') return await mockClient.deleteTenant(id) as T;
      }
      
      if (endpoint === '/api/rent/agreements') {
        if (method === 'GET') return await mockClient.getAgreements() as T;
        if (method === 'POST') return await mockClient.createAgreement(body) as T;
      }
      
      if (endpoint.startsWith('/api/rent/agreements/')) {
        const id = endpoint.split('/').pop()!;
        if (method === 'PUT') return await mockClient.updateAgreement(id, body) as T;
        if (method === 'DELETE') return await mockClient.deleteAgreement(id) as T;
      }
      
      if (endpoint === '/api/loans') {
        if (method === 'GET') return await mockClient.getLoans() as T;
        if (method === 'POST') return await mockClient.createLoan(body) as T;
      }
      
      if (endpoint.startsWith('/api/loans/')) {
        const id = endpoint.split('/').pop()!;
        if (method === 'PUT') return await mockClient.updateLoan(id, body) as T;
        if (method === 'DELETE') return await mockClient.deleteLoan(id) as T;
      }
      
      if (endpoint === '/api/rent/payments' && method === 'POST') {
        return await mockClient.createRentPayment(body) as T;
      }
      
      if (endpoint === '/api/rent-penalties') {
        if (method === 'GET') return await mockClient.getRentPenalties() as T;
        if (method === 'POST') return await mockClient.createRentPenalty(body) as T;
      }
      
      if (endpoint.startsWith('/api/rent-penalties/')) {
        const id = endpoint.split('/').pop()!;
        if (method === 'PUT') return await mockClient.updateRentPenalty(id, body) as T;
      }
      
      // Default responses for other endpoints
      if (endpoint === '/api/transactions') return [] as T;
      if (endpoint === '/api/donations') return [] as T;
      if (endpoint === '/api/expenses') return [] as T;
      if (endpoint === '/api/users') return await mockClient.getUsers() as T;
      
      console.warn(`🚧 Mock endpoint not implemented: ${method} ${endpoint}`);
      return {} as T;
      
    } catch (error: any) {
      console.error(`Mock API error for ${method} ${endpoint}:`, error);
      throw error;
    }
  }
  
  // Override auth token methods to sync with mock client
  setAuthToken(token: string | null): void {
    super.setAuthToken(token);
    if (mockClient) {
      mockClient.setAuthToken(token);
    }
  }
}

// Singleton
const apiClient = new ApiClientWithFallback(API_BASE_URL);
export default apiClient;
export { ApiClient, type ApiError, AUTH_TOKEN_KEY };
