import React, { useEffect } from 'react';
import apiClient from '../utils/api';

interface AppRootProps {
  children: React.ReactNode;
}

/**
 * AppRoot component ensures apiClient.initFromStorage() is called exactly once
 * before any other components that might make authenticated API requests.
 * This component should wrap the entire app at the root level.
 */
export function AppRoot({ children }: AppRootProps) {
  useEffect(() => {
    console.log('🚀 AppRoot: Initializing apiClient from storage...');
    
    // Initialize apiClient exactly once from localStorage
    apiClient.initFromStorage();
    
    console.log('✅ AppRoot: apiClient initialization complete');
  }, []); // Empty dependency array ensures this runs exactly once

  return <>{children}</>;
}