/**
 * API Client for Khandeshwar Management System
 * Safe localStorage, SSR-friendly, verified writes, and robust auth handling
 */

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";

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

  private async request<T = any>(
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

      const raw = await response.text();
      let payload: ApiResponse<T>;
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        console.error("📥 Invalid JSON from server", {
          status: response.status,
          preview: raw.slice(0, 200),
        });
        throw new Error("Invalid JSON response from server");
      }

      console.log("📥 API Response:", {
        endpoint: normalizedEndpoint,
        status: response.status,
        success: payload.success,
        hasData: !!payload.data,
        error: payload.error,
      });

      if (!response.ok) {
        const err = new Error(
          payload.error || `HTTP ${response.status}`
        ) as ApiError;
        err.statusCode = response.status;
        err.details = payload.details;

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

      if (!payload.success) {
        const err = new Error(
          payload.error || "API request failed"
        ) as ApiError;
        err.details = payload.details;
        throw err;
      }

      return payload.data!;
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
    return this.post("/api/auth/login", { email, password });
  }
  register(userData: any) {
    return this.post("/api/auth/register", userData);
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
    return this.get("/api/tenants");
  }
  getTenant(id: string) {
    return this.get(`/api/tenants/${id}`);
  }
  createTenant(d: any) {
    return this.post("/api/tenants", d);
  }
  updateTenant(id: string, d: any) {
    return this.put(`/api/tenants/${id}`, d);
  }
  deleteTenant(id: string) {
    return this.delete(`/api/tenants/${id}`);
  }

  getAgreements() {
    return this.get("/api/agreements");
  }
  getAgreement(id: string) {
    return this.get(`/api/agreements/${id}`);
  }
  createAgreement(d: any) {
    return this.post("/api/agreements", d);
  }
  updateAgreement(id: string, d: any) {
    return this.put(`/api/agreements/${id}`, d);
  }
  deleteAgreement(id: string) {
    return this.delete(`/api/agreements/${id}`);
  }
  getAgreementsByTenant(tenantId: string) {
    return this.get(`/api/agreements/tenant/${tenantId}`);
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

// Singleton
const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
export { ApiClient, type ApiError, AUTH_TOKEN_KEY };
