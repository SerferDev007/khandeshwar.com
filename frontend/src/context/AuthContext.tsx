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
      const parsedUser = cached ? (JSON.parse(cached) as User) : null;
      console.log('[AuthProvider] Pre-hydrating user from localStorage:', parsedUser ? `User: ${parsedUser.email}` : 'No cached user');
      return parsedUser;
    } catch (error) {
      console.error('[AuthProvider] Error parsing cached user:', error);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Consider the user authenticated if a user object exists
  const isAuthenticated = !!user;

  // Log authentication state changes
  useEffect(() => {
    console.log('[AuthProvider] Authentication state changed:', {
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      isLoading,
      hasError: !!error
    });
  }, [isAuthenticated, user, isLoading, error]);

  // Keep localStorage in sync with user
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
        console.log('[AuthProvider] User cached to localStorage:', user.email);
      } else {
        localStorage.removeItem("auth_user");
        console.log('[AuthProvider] User removed from localStorage');
      }
    } catch (error) {
      console.error('[AuthProvider] Error syncing user to localStorage:', error);
      // ignore storage errors
    }
  }, [user]);

  // Helper: try calling refresh() if apiClient provides it (withCredentials must be enabled in the client)
  const tryRefresh = async () => {
    console.log('[AuthProvider] Attempting to refresh authentication...');
    const anyClient = apiClient as any;
    if (anyClient && typeof anyClient.refresh === "function") {
      await anyClient.refresh(); // if you don't have this, it will just skip
      console.log('[AuthProvider] Token refresh successful');
    } else {
      console.log('[AuthProvider] No refresh method available on apiClient');
    }
  };

  // 2) Global 401 handler: try one refresh; if that fails, clear auth
  const handleUnauthorized = async () => {
    console.log('[AuthProvider] Handling unauthorized response (401)');
    try {
      await tryRefresh();
      console.log('[AuthProvider] Successfully refreshed after 401');
      // if refresh succeeds, api client should retry the original request (if you added that interceptor)
    } catch (error) {
      console.error('[AuthProvider] Failed to refresh after 401:', error);
      apiClient.setAuthToken(null);
      setUser(null);
      setError("Your session has expired. Please login again.");
    }
  };

  // Register global 401 handler once
  useEffect(() => {
    console.log('[AuthProvider] Registering global 401 handler');
    apiClient.setUnauthorizedHandler(handleUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) Bootstrap on mount: init from storage → try refresh → fetch profile
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing authentication...');
      try {
        // Load any stored token (if your apiClient stores it)
        console.log('[AuthProvider] Loading stored token from apiClient...');
        apiClient.initFromStorage();

        // Check if we have a token before proceeding
        const currentToken = apiClient.getAuthToken();
        if (!currentToken) {
          console.log('[AuthProvider] No stored token found - skipping profile fetch');
          setUser(null);
          return;
        }

        console.log('[AuthProvider] Token found - proceeding with authentication verification');

        // Try to silently refresh access token (handles expired access)
        try {
          console.log('[AuthProvider] Attempting silent token refresh...');
          await tryRefresh();
        } catch (error) {
          console.log('[AuthProvider] Silent refresh failed, continuing...', error);
          // no refresh cookie or refresh failed — that's OK, we'll still try /profile
        }

        // Verify by fetching profile. Only clear auth on explicit 401.
        console.log('[AuthProvider] Fetching user profile...');
        const response = await apiClient.getProfile();
        
        // Extract user from response (handles wrapped responses like { user: {...} })
        const userData = response.user || response.data?.user || response;
        console.log('[AuthProvider] Profile fetched successfully:', userData?.email);
        setUser(userData);
      } catch (err: any) {
        const status =
          err?.statusCode ?? err?.status ?? err?.response?.status ?? 0;

        console.log('[AuthProvider] Profile fetch failed:', { status, error: err.message });

        if (status === 401) {
          console.log('[AuthProvider] 401 received - clearing authentication');
          // token definitively invalid → clear
          apiClient.setAuthToken(null);
          setUser(null);
        } else {
          console.log('[AuthProvider] Non-401 error - keeping pre-hydrated user if exists');
          // network/server flake: keep pre-hydrated user if we had one
          // this prevents header flicker on temporary failures
        }
      } finally {
        console.log('[AuthProvider] Authentication initialization complete');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    console.log('[AuthProvider] Login attempt started for:', credentials.email);
    try {
      setIsLoading(true);
      setError(null);

      console.log('[AuthProvider] Calling apiClient.login...');
      const response = await apiClient.login(
        credentials.email,
        credentials.password
      );

      console.log('[AuthProvider] Login response received:', { 
        hasUser: !!(response?.user || response?.data?.user),
        responseType: typeof response
      });

      let nextUser: any;
      if (response?.data?.user) {
        nextUser = response.data.user;
      } else if (response?.user) {
        nextUser = response.user;
      } else {
        nextUser = response;
      }

      console.log('[AuthProvider] Setting user after successful login:', nextUser.email);
      setUser(nextUser as User);
    } catch (err: any) {
      console.error('[AuthProvider] Login failed:', err.message || err);
      setError(err?.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
      console.log('[AuthProvider] Login attempt completed');
    }
  };

  const register = async (userData: RegisterData) => {
    console.log('[AuthProvider] Registration attempt started for:', userData.email);
    try {
      setIsLoading(true);
      setError(null);

      console.log('[AuthProvider] Calling apiClient.register...');
      const response = await apiClient.register(userData);

      console.log('[AuthProvider] Registration response received');

      let nextUser: any;
      if (response?.data?.user) {
        nextUser = response.data.user;
      } else if (response?.user) {
        nextUser = response.user;
      } else {
        nextUser = response;
      }

      console.log('[AuthProvider] Setting user after successful registration:', nextUser.email);
      setUser(nextUser as User);
    } catch (err: any) {
      console.error('[AuthProvider] Registration failed:', err.message || err);
      setError(err?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
      console.log('[AuthProvider] Registration attempt completed');
    }
  };

  const logout = async () => {
    console.log('[AuthProvider] Logout initiated');
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        console.log('[AuthProvider] Calling apiClient.logout...');
        await apiClient.logout();
        console.log('[AuthProvider] Server logout successful');
      } else {
        console.log('[AuthProvider] User not authenticated, skipping server logout');
      }
    } catch (error) {
      console.warn('[AuthProvider] Server logout failed, clearing local auth anyway:', error);
      // ignore logout errors
    } finally {
      console.log('[AuthProvider] Clearing local authentication state');
      apiClient.setAuthToken(null);
      setUser(null);
      setError(null);
      setIsLoading(false);
      console.log('[AuthProvider] Logout completed');
    }
  };

  const clearError = () => {
    console.log('[AuthProvider] Clearing error state');
    setError(null);
  };

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
