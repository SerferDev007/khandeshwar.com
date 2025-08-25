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
        // Only clear token if it's actually invalid, not on network errors
        if (error.statusCode === 401) {
          console.log('🗑️ AuthContext: Clearing invalid token');
          apiClient.setAuthToken(null);
          setUser(null);
        } else {
          // Keep token for network errors, server errors, etc.
          console.log('⚠️ AuthContext: Keeping token despite verification error (might be network issue)');
        }
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

      // The API client now handles token extraction and setting automatically
      const response = await apiClient.login(credentials.email, credentials.password);
      
      // Extract user data from response
      let user: any;
      if (response.data?.user) {
        // Wrapped response: { data: { user, accessToken } }
        user = response.data.user;
      } else if (response.user) {
        // Unwrapped response: { user, accessToken }
        user = response.user;
      } else {
        // Fallback: assume the response is the user data
        user = response;
      }

      console.log('✅ Login successful', {
        userPresent: !!user,
        userId: user?.id,
        username: user?.username || user?.name,
        timestamp: new Date().toISOString()
      });
      
      // Set user data (token is already handled by apiClient.login)
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

      // The API client now handles token extraction and setting automatically
      const response = await apiClient.register(userData);
      
      // Extract user data from response  
      let user: any;
      if (response.data?.user) {
        // Wrapped response: { data: { user, accessToken } }
        user = response.data.user;
      } else if (response.user) {
        // Unwrapped response: { user, accessToken }
        user = response.user;
      } else {
        // Fallback: assume the response is the user data
        user = response;
      }

      console.log('✅ Register successful', {
        userPresent: !!user,
        userId: user?.id,
        username: user?.username || user?.name,
        timestamp: new Date().toISOString()
      });
      
      // Set user data (token is already handled by apiClient.register)
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