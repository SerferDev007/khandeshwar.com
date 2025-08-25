import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../utils/api';
import type { User, LoginCredentials, RegisterData } from '../types';

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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Global logout function for API client 401 handler
  const handleUnauthorized = () => {
    apiClient.setAuthToken(null);
    setUser(null);
    setError('Your session has expired. Please login again.');
  };

  // Set up the global 401 handler on mount
  useEffect(() => {
    apiClient.setUnauthorizedHandler(handleUnauthorized);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthContext: Initializing authentication...');
        
        // Initialize token from storage first (if not already done by AppRoot)
        apiClient.initFromStorage();
        
        const token = apiClient.getAuthToken();
        console.log('🔍 AuthContext: Checking stored token', {
          tokenPresent: !!token,
          tokenStart: token ? token.slice(0, 10) + '...' : 'null',
        });
        
        if (token) {
          // Verify token is still valid by fetching profile
          console.log('📋 AuthContext: Verifying token by fetching profile...');
          const userData = await apiClient.getProfile();
          setUser(userData);
          console.log('✅ AuthContext: Token verified, user authenticated', {
            userId: userData?.id,
            username: userData?.username || userData?.name
          });
        } else {
          console.log('❌ AuthContext: No stored token found');
        }
      } catch (error) {
        console.log('⚠️ AuthContext: Token verification failed', error);
        // Token is invalid or expired
        apiClient.setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('🏁 AuthContext: Authentication initialization complete');
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.login(credentials.email, credentials.password);
      
      // Extract token from the correct path based on backend response structure
      let accessToken: string;
      let user: any;
      
      if (response.data) {
        // Standard backend response: { success: true, data: { user, accessToken } } or { success: true, data: { user, tokens: { accessToken } } }
        if (response.data.tokens?.accessToken) {
          // Production backend structure
          accessToken = response.data.tokens.accessToken;
        } else if (response.data.accessToken) {
          // Demo backend structure
          accessToken = response.data.accessToken;
        } else {
          throw new Error('No access token found in response');
        }
        user = response.data.user;
      } else if (response.accessToken) {
        // Direct response structure (fallback)
        accessToken = response.accessToken;
        user = response.user;
      } else {
        throw new Error('Invalid login response structure');
      }

      console.log('🔐 Login success - setting auth token', {
        tokenPresent: !!accessToken,
        tokenStart: accessToken ? accessToken.slice(0, 10) + '...' : 'null',
        tokenLength: accessToken?.length ?? 0,
        userPresent: !!user
      });
      
      // Set the auth token
      apiClient.setAuthToken(accessToken);
      
      // Set user data
      setUser(user);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.register(userData);
      
      // Extract token from the correct path based on backend response structure
      let accessToken: string;
      let user: any;
      
      if (response.data) {
        // Standard backend response: { success: true, data: { user, accessToken } } or { success: true, data: { user, tokens: { accessToken } } }
        if (response.data.tokens?.accessToken) {
          // Production backend structure
          accessToken = response.data.tokens.accessToken;
        } else if (response.data.accessToken) {
          // Demo backend structure
          accessToken = response.data.accessToken;
        } else {
          throw new Error('No access token found in response');
        }
        user = response.data.user;
      } else if (response.accessToken) {
        // Direct response structure (fallback)
        accessToken = response.accessToken;
        user = response.user;
      } else {
        throw new Error('Invalid register response structure');
      }

      console.log('🔐 Register success - setting auth token', {
        tokenPresent: !!accessToken,
        tokenStart: accessToken ? accessToken.slice(0, 10) + '...' : 'null',
        tokenLength: accessToken?.length ?? 0,
        userPresent: !!user
      });
      
      // Set the auth token
      apiClient.setAuthToken(accessToken);
      
      // Set user data
      setUser(user);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint if user is authenticated
      if (isAuthenticated) {
        await apiClient.logout();
      }
    } catch (error) {
      // Ignore logout errors, just clear local state
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local auth state
      apiClient.setAuthToken(null);
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => {
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}