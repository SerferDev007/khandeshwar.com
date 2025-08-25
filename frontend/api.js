
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the TypeScript source and eval a simplified version
const API_BASE_URL = "http://localhost:8081";
const AUTH_TOKEN_KEY = "auth_token";

function safeLocalStorage() {
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

function pickAccessToken(obj) {
  if (!obj || typeof obj !== 'object') {
    console.warn('⚠️ pickAccessToken: Invalid object provided', { obj });
    return null;
  }

  // Direct token keys
  const directKeys = ['accessToken', 'token', 'access_token', 'jwt', 'id_token'];
  for (const key of directKeys) {
    if (obj[key] && typeof obj[key] === 'string') {
      console.log('🔍 Token found at direct key:', { key, tokenStart: obj[key].slice(0, 10) + '...' });
      return obj[key];
    }
  }

  // Nested token keys
  const nestedPaths = [
    'data.accessToken', 'data.tokens.accessToken', 'data.token', 'data.access_token',
    'data.jwt', 'data.id_token', 'tokens.accessToken', 'tokens.token', 'tokens.access_token'
  ];

  for (const path of nestedPaths) {
    const keys = path.split('.');
    let current = obj;
    let valid = true;

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
  constructor(baseURL) {
    this.baseURL = baseURL.replace(//+$/, "");
    this.token = null;
    this.ls = null;
  }

  initFromStorage() {
    this.ls = safeLocalStorage();
    if (this.ls) {
      const stored = this.ls.getItem(AUTH_TOKEN_KEY);
      this.token = stored && stored.trim() ? stored : null;
      console.log("🔄 Token init from storage", {
        present: !!this.token,
        start: this.token ? this.token.slice(0, 10) + "..." : "null",
      });
    }
  }

  setAuthToken(token) {
    console.log("🔐 setAuthToken()", {
      incoming: !!token,
      start: token ? token.slice(0, 10) + "..." : "null",
      len: token?.length ?? 0,
    });

    this.token = token && token.trim() ? token : null;

    const ls = this.ls ?? safeLocalStorage();
    if (!ls) {
      console.warn("⚠️ localStorage unavailable; skipping persist.");
      return;
    }

    try {
      if (this.token) {
        ls.setItem(AUTH_TOKEN_KEY, this.token);
        console.log("💾 Token stored");
      } else {
        ls.removeItem(AUTH_TOKEN_KEY);
        console.log("🗑️ Token cleared");
      }
    } catch (err) {
      console.error("❌ Token persist failed:", err);
    }
  }

  getAuthToken() {
    const ls = this.ls ?? safeLocalStorage();
    if (!ls) return this.token;
    const stored = ls.getItem(AUTH_TOKEN_KEY);
    if (stored !== this.token) {
      this.token = stored && stored.trim() ? stored : null;
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = this.baseURL + ("/" + endpoint).replace(//+/g, "/");
    const method = (options.method || "GET").toUpperCase();

    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const currentToken = this.getAuthToken();
    if (currentToken) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }

    console.log("📤 API Request:", { method, url, hasAuth: !!currentToken });

    const response = await fetch(url, { ...options, method, headers });
    const raw = await response.text();
    let payload;
    
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      throw new Error("Invalid JSON response from server");
    }

    const isWrapped = typeof payload.success === 'boolean';
    const responseSuccess = isWrapped ? payload.success : response.ok;
    const responseData = isWrapped ? payload.data : payload;

    console.log("📥 API Response:", {
      status: response.status,
      wrapped: isWrapped,
      success: responseSuccess,
    });

    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }

    if (isWrapped && !responseSuccess) {
      throw new Error(payload.error || "API request failed");
    }

    return responseData;
  }

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  post(endpoint, data) {
    const body = data != null ? JSON.stringify(data) : undefined;
    return this.request(endpoint, { method: "POST", body });
  }

  async login(email, password) {
    console.log("🔐 Auth login", { emailMasked: email.slice(0, 3) + "***" });
    
    const response = await this.post("/api/auth/login", { email, password });
    
    console.log("🔬 Raw login response:", JSON.stringify(response, null, 2));
    
    const accessToken = pickAccessToken(response);
    
    if (accessToken) {
      console.log("✅ Login successful - extracted and setting auth token", {
        tokenStart: accessToken.slice(0, 10) + "...",
        tokenLength: accessToken.length,
      });
      
      this.setAuthToken(accessToken);
    } else {
      throw new Error("Login succeeded but no access token found in response");
    }
    
    return response;
  }
}

const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
export { ApiClient };
