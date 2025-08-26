import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import apiClient from "../utils/api";
import type { User, LoginCredentials, RegisterData } from "../types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 1) Pre-hydrate user from localStorage so UI can render immediately
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem("auth_user");
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Consider the user authenticated if a user object exists
  const isAuthenticated = !!user;

  // Keep localStorage in sync with user
  useEffect(() => {
    try {
      if (user) localStorage.setItem("auth_user", JSON.stringify(user));
      else localStorage.removeItem("auth_user");
    } catch {
      // ignore storage errors
    }
  }, [user]);

  // Helper: try calling refresh() if apiClient provides it (withCredentials must be enabled in the client)
  const tryRefresh = async () => {
    const anyClient = apiClient as any;
    if (anyClient && typeof anyClient.refresh === "function") {
      await anyClient.refresh(); // if you don't have this, it will just skip
    }
  };

  // 2) Global 401 handler: try one refresh; if that fails, clear auth
  const handleUnauthorized = async () => {
    try {
      await tryRefresh();
      // if refresh succeeds, api client should retry the original request (if you added that interceptor)
    } catch {
      apiClient.setAuthToken(null);
      setUser(null);
      setError("Your session has expired. Please login again.");
    }
  };

  // Register global 401 handler once
  useEffect(() => {
    apiClient.setUnauthorizedHandler(handleUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) Bootstrap on mount: init from storage → try refresh → fetch profile
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load any stored token (if your apiClient stores it)
        apiClient.initFromStorage();

        // Try to silently refresh access token (handles expired access)
        try {
          await tryRefresh();
        } catch {
          // no refresh cookie or refresh failed — that's OK, we'll still try /profile
        }

        // Verify by fetching profile. Only clear auth on explicit 401.
        const userData = await apiClient.getProfile();
        setUser(userData);
      } catch (err: any) {
        const status =
          err?.statusCode ?? err?.status ?? err?.response?.status ?? 0;

        if (status === 401) {
          // token definitively invalid → clear
          apiClient.setAuthToken(null);
          setUser(null);
        } else {
          // network/server flake: keep pre-hydrated user if we had one
          // this prevents header flicker on temporary failures
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.login(
        credentials.email,
        credentials.password
      );

      let nextUser: any;
      if (response?.data?.user) {
        nextUser = response.data.user;
      } else if (response?.user) {
        nextUser = response.user;
      } else {
        nextUser = response;
      }

      setUser(nextUser as User);
    } catch (err: any) {
      setError(err?.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.register(userData);

      let nextUser: any;
      if (response?.data?.user) {
        nextUser = response.data.user;
      } else if (response?.user) {
        nextUser = response.user;
      } else {
        nextUser = response;
      }

      setUser(nextUser as User);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        await apiClient.logout();
      }
    } catch {
      // ignore logout errors
    } finally {
      apiClient.setAuthToken(null);
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
