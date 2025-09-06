import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import apiClient from '../utils/api';
import { useAuth } from './AuthContext';
import type { 
  Shop, 
  Tenant, 
  Agreement, 
  Loan, 
  RentPenalty, 
  Transaction, 
  User,
  LoadingState,
  ErrorState,
  ReceiptCounters,
  UsersPagination
} from '../types';

interface DataContextType {
  // Data
  users: User[];
  shops: Shop[];
  tenants: Tenant[];
  agreements: Agreement[];
  loans: Loan[];
  penalties: RentPenalty[];
  transactions: Transaction[];
  receiptCounters: ReceiptCounters;
  
  // Pagination data
  usersPagination: UsersPagination | null;

  // Loading states
  loading: LoadingState;
  
  // Error states
  errors: ErrorState;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchShops: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  fetchAgreements: () => Promise<void>;
  fetchLoans: () => Promise<void>;
  fetchPenalties: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  
  // CRUD operations
  createShop: (shopData: any) => Promise<Shop>;
  updateShop: (id: string, shopData: any) => Promise<Shop>;
  deleteShop: (id: string) => Promise<void>;
  
  createTenant: (tenantData: any) => Promise<Tenant>;
  updateTenant: (id: string, tenantData: any) => Promise<Tenant>;
  deleteTenant: (id: string) => Promise<void>;
  
  createAgreement: (agreementData: any) => Promise<Agreement>;
  updateAgreement: (id: string, agreementData: any) => Promise<Agreement>;
  deleteAgreement: (id: string) => Promise<void>;
  
  createLoan: (loanData: any) => Promise<Loan>;
  updateLoan: (id: string, loanData: any) => Promise<Loan>;
  deleteLoan: (id: string) => Promise<void>;
  
  createTransaction: (transactionData: any) => Promise<Transaction>;
  updateTransaction: (id: string, transactionData: any) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  // Specific donation methods
  createDonation: (donationData: any) => Promise<Transaction>;
  updateDonation: (id: string, donationData: any) => Promise<Transaction>;
  deleteDonation: (id: string) => Promise<void>;
  fetchDonations: () => Promise<void>;

  // Specific expense methods
  createExpense: (expenseData: any) => Promise<Transaction>;
  updateExpense: (id: string, expenseData: any) => Promise<Transaction>;
  deleteExpense: (id: string) => Promise<void>;
  fetchExpenses: () => Promise<void>;

  createUser: (userData: any) => Promise<User>;
  updateUser: (id: string, userData: any) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  
  // Clear errors
  clearError: (entity: string) => void;
  clearAllErrors: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Guard to prevent double mounting and race conditions
  const mountedRef = useRef(false);
  const dataFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('[DataProvider] Component rendering, isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [penalties, setPenalties] = useState<RentPenalty[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receiptCounters, setReceiptCounters] = useState<ReceiptCounters>({
    donations: 1001,
    rentIncome: 5001
  });

  // Log state changes
  useEffect(() => {
    console.log('[DataProvider] Data state updated:', {
      usersCount: users.length,
      shopsCount: shops.length,
      tenantsCount: tenants.length,
      agreementsCount: agreements.length,
      loansCount: loans.length,
      penaltiesCount: penalties.length,
      transactionsCount: transactions.length
    });
  }, [users, shops, tenants, agreements, loans, penalties, transactions]);

  // Pagination state for users
  const [usersPagination, setUsersPagination] = useState<UsersPagination | null>(null);

  // In-flight request tracking to prevent overlapping fetches
  const usersFetchRef = useRef(false);

  // Loading state
  const [loading, setLoading] = useState<LoadingState>({
    users: false,
    shops: false,
    tenants: false,
    agreements: false,
    loans: false,
    penalties: false,
    transactions: false,
    auth: false,
  });

  // Error state
  const [errors, setErrors] = useState<ErrorState>({
    users: null,
    shops: null,
    tenants: null,
    agreements: null,
    loans: null,
    penalties: null,
    transactions: null,
    auth: null,
  });

  // Helper function to set loading state for a specific entity
  const setLoadingState = (entity: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [entity]: isLoading }));
  };

  // Helper function to set error state for a specific entity
  const setErrorState = (entity: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [entity]: error }));
  };

  // Enhanced generic fetch function with response normalization and improved error handling
  const fetchData = async (
    entity: string,
    fetchFn: () => Promise<any>,
    setter: (data: any) => void
  ) => {
    try {
      setLoadingState(entity, true);
      setErrorState(entity, null);
      
      console.debug(`🔍 fetchData(${entity}): Starting API call`);
      const response = await fetchFn();
      
      // Log the raw response structure for development diagnostics
      if ((import.meta as any).env?.VITE_ENV) {
        console.debug(`🔬 fetchData(${entity}): Raw API response structure:`, {
          isArray: Array.isArray(response),
          hasData: !!response?.data,
          hasEntityProperty: !!response?.[entity],
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
          dataKeys: response?.data && typeof response.data === 'object' ? Object.keys(response.data) : null
        });
      }

      /**
       * Safely parse data from response, handling multiple response shapes:
       * 1. Direct array response: [...]
       * 2. Direct object response: { [entity]: [...] }
       * 3. Wrapped response: { data: { [entity]: [...] } }
       * 4. Wrapped array response: { data: [...] }
       * 5. Single item responses (for individual entity fetches)
       */
      let data;
      if (Array.isArray(response)) {
        // Direct array response
        data = response;
      } else if (response?.data?.[entity] && Array.isArray(response.data[entity])) {
        // Wrapped response with data.[entity]
        data = response.data[entity];
      } else if (response?.data && Array.isArray(response.data)) {
        // Wrapped response with data as array
        data = response.data;
      } else if (response?.[entity] && Array.isArray(response[entity])) {
        // Direct response with [entity] property
        data = response[entity];
      } else if (response?.data && typeof response.data === 'object') {
        // Wrapped single item or object response
        data = response.data;
      } else if (response && typeof response === 'object') {
        // Direct single item or object response
        data = response;
      } else {
        data = [];
      }

      console.debug(`✅ fetchData(${entity}): Successfully parsed response`, {
        dataType: Array.isArray(data) ? 'array' : typeof data,
        count: Array.isArray(data) ? data.length : 1
      });

      setter(data);
    } catch (error: any) {
      console.error(`❌ fetchData(${entity}) failed:`, {
        message: error?.message,
        status: error?.statusCode,
        details: error?.details,
        stack: error?.stack?.split('\n').slice(0, 3).join('\n')
      });

      // Enhanced error message with server details in development
      let errorMessage = `Failed to fetch ${entity}`;
      if (error?.statusCode === 500) {
        errorMessage = `${entity.charAt(0).toUpperCase() + entity.slice(1)} unavailable (500). Check server logs.`;
        // Set safe defaults for 500 errors to prevent UI crashes
        if (typeof setter === 'function') {
          setter([]);
        }
      } else if (error?.statusCode === 503) {
        errorMessage = `Backend server is offline. Please try again later.`;
        if (typeof setter === 'function') {
          setter([]);
        }
      } else if (error?.message?.includes('Backend server is offline')) {
        errorMessage = error.message;
        if (typeof setter === 'function') {
          setter([]);
        }
      } else if ((import.meta as any).env?.DEV) {
        if (error?.statusCode) {
          errorMessage += ` (HTTP ${error.statusCode}): ${error.message}`;
        } else {
          errorMessage += `: ${error?.message || 'Unknown error'}`;
        }
      } else {
        errorMessage += '. Please try again.';
      }

      setErrorState(entity, errorMessage);
      
      // Show toast notification for critical errors
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error(errorMessage);
      }
    } finally {
      setLoadingState(entity, false);
    }
  };

  // Enhanced fetchUsers function with idempotent guard and dual response shape support
  const fetchUsers = async () => {
    // Prevent multiple concurrent fetch calls (React Strict Mode double-mount protection)
    if (usersFetchRef.current) {
      console.debug('🔄 fetchUsers already in progress, skipping duplicate call');
      return;
    }

    try {
      usersFetchRef.current = true;
      setLoadingState('users', true);
      setErrorState('users', null);

      console.debug('🔍 fetchUsers: Starting API call to /api/users');
      const response = await apiClient.getUsers();

      // Log the raw response structure for development diagnostics
            if ((import.meta as any).env?.VITE_ENV) {
              console.debug('🔬 fetchUsers: Raw API response structure:', {
                hasUsers: !!response?.users,
                hasData: !!response?.data,
                hasDataUsers: !!response?.data?.users,
                hasPagination: !!response?.pagination,
                hasDataPagination: !!response?.data?.pagination,
                responseKeys: Object.keys(response || {}),
                dataKeys: response?.data ? Object.keys(response.data) : null
              });
            }

      /**
       * Safely parse users from response, handling both:
       * 1. Direct response shape: { users: [...], pagination: {...} }
       * 2. Wrapped response shape: { data: { users: [...], pagination: {...} } }
       */
      const users = response?.data?.users || response?.users || [];
      const pagination = response?.data?.pagination || response?.pagination || null;

      if (!Array.isArray(users)) {
        throw new Error('Invalid response: users is not an array');
      }

      console.debug('✅ fetchUsers: Successfully parsed response', {
        usersCount: users.length,
        hasPagination: !!pagination,
        paginationInfo: pagination ? {
          page: pagination.page,
          total: pagination.total,
          pages: pagination.pages
        } : null
      });

      setUsers(users);
      
      // Store pagination data if available
      if (pagination) {
        setUsersPagination(pagination);
      }
    } catch (error: any) {
      console.error('❌ fetchUsers failed:', {
        message: error.message,
        status: error.statusCode,
        details: error.details,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });

      // Enhanced error message with server details in development
      let errorMessage = 'Failed to fetch users';
      if ((import.meta as any).env?.DEV) {
        if (error.statusCode === 500) {
          errorMessage += ` (Server Error ${error.statusCode}): ${error.message}`;
        } else if (error.statusCode) {
          errorMessage += ` (HTTP ${error.statusCode}): ${error.message}`;
        } else {
          errorMessage += `: ${error.message}`;
        }
      } else {
        errorMessage += '. Please try again.';
      }

      setErrorState('users', errorMessage);
      
      // Don't clear existing users on failure - preserve previous successful data
      console.debug('🔄 fetchUsers: Preserving existing users data on failure');
    } finally {
      usersFetchRef.current = false;
      setLoadingState('users', false);
    }
  };
  const fetchShops = () => fetchData('shops', () => apiClient.getShops(), setShops);
  const fetchTenants = () => fetchData('tenants', () => apiClient.getTenants(), setTenants);
  const fetchAgreements = () => fetchData('agreements', () => apiClient.getAgreements(), setAgreements);
  const fetchLoans = () => fetchData('loans', () => apiClient.getLoans(), setLoans);
  const fetchPenalties = () => fetchData('penalties', () => apiClient.getRentPenalties(), setPenalties);
  const fetchTransactions = () => fetchData('transactions', () => apiClient.getTransactions(), setTransactions);

  // CRUD operations for shops
  const createShop = async (shopData: any): Promise<Shop> => {
    const newShop = await apiClient.createShop(shopData);
    setShops(prev => [...prev, newShop]);
    return newShop;
  };

  const updateShop = async (id: string, shopData: any): Promise<Shop> => {
    const updatedShop = await apiClient.updateShop(id, shopData);
    setShops(prev => prev.map(shop => shop.id === id ? updatedShop : shop));
    return updatedShop;
  };

  const deleteShop = async (id: string): Promise<void> => {
    await apiClient.deleteShop(id);
    setShops(prev => prev.filter(shop => shop.id !== id));
  };

  // CRUD operations for tenants
  const createTenant = async (tenantData: any): Promise<Tenant> => {
    const newTenant = await apiClient.createTenant(tenantData);
    setTenants(prev => [...prev, newTenant]);
    return newTenant;
  };

  const updateTenant = async (id: string, tenantData: any): Promise<Tenant> => {
    const updatedTenant = await apiClient.updateTenant(id, tenantData);
    setTenants(prev => prev.map(tenant => tenant.id === id ? updatedTenant : tenant));
    return updatedTenant;
  };

  const deleteTenant = async (id: string): Promise<void> => {
    await apiClient.deleteTenant(id);
    setTenants(prev => prev.filter(tenant => tenant.id !== id));
  };

  // CRUD operations for agreements
  const createAgreement = async (agreementData: any): Promise<Agreement> => {
    const newAgreement = await apiClient.createAgreement(agreementData);
    setAgreements(prev => [...prev, newAgreement]);
    return newAgreement;
  };

  const updateAgreement = async (id: string, agreementData: any): Promise<Agreement> => {
    const updatedAgreement = await apiClient.updateAgreement(id, agreementData);
    setAgreements(prev => prev.map(agreement => agreement.id === id ? updatedAgreement : agreement));
    return updatedAgreement;
  };

  const deleteAgreement = async (id: string): Promise<void> => {
    await apiClient.deleteAgreement(id);
    setAgreements(prev => prev.filter(agreement => agreement.id !== id));
  };

  // CRUD operations for loans
  const createLoan = async (loanData: any): Promise<Loan> => {
    const newLoan = await apiClient.createLoan(loanData);
    setLoans(prev => [...prev, newLoan]);
    return newLoan;
  };

  const updateLoan = async (id: string, loanData: any): Promise<Loan> => {
    const updatedLoan = await apiClient.updateLoan(id, loanData);
    setLoans(prev => prev.map(loan => loan.id === id ? updatedLoan : loan));
    return updatedLoan;
  };

  const deleteLoan = async (id: string): Promise<void> => {
    await apiClient.deleteLoan(id);
    setLoans(prev => prev.filter(loan => loan.id !== id));
  };

  // CRUD operations for transactions
  const createTransaction = async (transactionData: any): Promise<Transaction> => {
    const newTransaction = await apiClient.createTransaction(transactionData);
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
  };

  const updateTransaction = async (id: string, transactionData: any): Promise<Transaction> => {
    const updatedTransaction = await apiClient.updateTransaction(id, transactionData);
    setTransactions(prev => prev.map(transaction => transaction.id === id ? updatedTransaction : transaction));
    return updatedTransaction;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    await apiClient.deleteTransaction(id);
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  // CRUD operations for donations (specific endpoints)
  const fetchDonations = async (): Promise<void> => {
    setLoadingState('transactions', true);
    setErrorState('transactions', null);
    
    try {
      console.debug('🔍 fetchDonations: Starting API call to /api/donations');
      const response = await apiClient.getDonations();

      // Log the raw response structure for development diagnostics
      if ((import.meta as any).env?.VITE_ENV) {
        console.debug('🔬 fetchDonations: Raw API response structure:', {
          hasDonations: !!response?.donations,
          hasData: !!response?.data,
          hasDataDonations: !!response?.data?.donations,
          responseKeys: Object.keys(response || {}),
          dataKeys: response?.data ? Object.keys(response.data) : null
        });
      }

      /**
       * Safely parse donations from response, handling both:
       * 1. Direct response shape: { donations: [...] } or [...]
       * 2. Wrapped response shape: { data: { donations: [...] } } or { data: [...] }
       */
      let donations;
      if (Array.isArray(response)) {
        // Direct array response
        donations = response;
      } else if (response?.data?.donations && Array.isArray(response.data.donations)) {
        // Wrapped response with data.donations
        donations = response.data.donations;
      } else if (response?.data && Array.isArray(response.data)) {
        // Wrapped response with data as array
        donations = response.data;
      } else if (response?.donations && Array.isArray(response.donations)) {
        // Direct response with donations property
        donations = response.donations;
      } else {
        donations = [];
      }

      if (!Array.isArray(donations)) {
        throw new Error('Invalid response: donations is not an array');
      }

      console.debug('✅ fetchDonations: Successfully parsed response', {
        donationsCount: donations.length
      });

      // Update transactions state with donations
      setTransactions(prev => {
        const nonDonations = prev.filter(t => t.type !== 'Donation');
        return [...nonDonations, ...donations];
      });
    } catch (error: any) {
      console.error('❌ fetchDonations failed:', {
        message: error.message,
        status: error.statusCode,
        details: error.details,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });

      // Enhanced error message with server details in development
      let errorMessage = 'Failed to fetch donations';
      if ((import.meta as any).env?.DEV) {
        if (error.statusCode === 500) {
          errorMessage += ` (Server Error ${error.statusCode}): ${error.message}`;
        } else if (error.statusCode) {
          errorMessage += ` (HTTP ${error.statusCode}): ${error.message}`;
        } else {
          errorMessage += `: ${error.message}`;
        }
      } else {
        errorMessage += '. Please try again.';
      }

      setErrorState('transactions', errorMessage);
    } finally {
      setLoadingState('transactions', false);
    }
  };

  const createDonation = async (donationData: any): Promise<Transaction> => {
    try {
      console.debug('🔍 createDonation: Starting API call', {
        donationData: { 
          category: donationData.category, 
          amount: donationData.amount,
          donorName: donationData.donorName 
        }
      });
      
      const response = await apiClient.createDonation(donationData);
      
      // Handle both normalized and legacy response formats
      const newDonation = response?.data || response;
      
      if (!newDonation || !newDonation.id) {
        throw new Error('Invalid response: missing donation data or ID');
      }
      
      console.debug('✅ createDonation: Successfully created donation', {
        donationId: newDonation.id,
        amount: newDonation.amount
      });
      
      setTransactions(prev => [...prev, newDonation]);
      return newDonation;
    } catch (error: any) {
      console.error('❌ createDonation failed:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details
      });
      throw error;
    }
  };

  const updateDonation = async (id: string, donationData: any): Promise<Transaction> => {
    try {
      console.debug('🔍 updateDonation: Starting API call', {
        donationId: id,
        updateData: { 
          category: donationData.category, 
          amount: donationData.amount,
          donorName: donationData.donorName 
        }
      });
      
      const response = await apiClient.updateDonation(id, donationData);
      
      // Handle both normalized and legacy response formats
      const updatedDonation = response?.data || response;
      
      if (!updatedDonation || !updatedDonation.id) {
        throw new Error('Invalid response: missing donation data or ID');
      }
      
      console.debug('✅ updateDonation: Successfully updated donation', {
        donationId: updatedDonation.id,
        amount: updatedDonation.amount
      });
      
      setTransactions(prev => prev.map(transaction => transaction.id === id ? updatedDonation : transaction));
      return updatedDonation;
    } catch (error: any) {
      console.error('❌ updateDonation failed:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        donationId: id
      });
      throw error;
    }
  };

  const deleteDonation = async (id: string): Promise<void> => {
    try {
      console.debug('🔍 deleteDonation: Starting API call', { donationId: id });
      
      await apiClient.deleteDonation(id);
      
      console.debug('✅ deleteDonation: Successfully deleted donation', { donationId: id });
      
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error: any) {
      console.error('❌ deleteDonation failed:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        donationId: id
      });
      throw error;
    }
  };

  // CRUD operations for expenses (specific endpoints)
  const fetchExpenses = async (): Promise<void> => {
    setLoadingState('transactions', true);
    setErrorState('transactions', null);
    
    try {
      console.debug('🔍 fetchExpenses: Starting API call to /api/expenses');
      const response = await apiClient.getExpenses();

      // Log the raw response structure for development diagnostics
      if ((import.meta as any).env?.VITE_ENV) {
        console.debug('🔬 fetchExpenses: Raw API response structure:', {
          hasExpenses: !!response?.expenses,
          hasData: !!response?.data,
          hasDataExpenses: !!response?.data?.expenses,
          responseKeys: Object.keys(response || {}),
          dataKeys: response?.data ? Object.keys(response.data) : null
        });
      }

      /**
       * Safely parse expenses from response, handling both:
       * 1. Direct response shape: { expenses: [...] } or [...]
       * 2. Wrapped response shape: { data: { expenses: [...] } } or { data: [...] }
       */
      let expenses;
      if (Array.isArray(response)) {
        // Direct array response
        expenses = response;
      } else if (response?.data?.expenses && Array.isArray(response.data.expenses)) {
        // Wrapped response with data.expenses
        expenses = response.data.expenses;
      } else if (response?.data && Array.isArray(response.data)) {
        // Wrapped response with data as array
        expenses = response.data;
      } else if (response?.expenses && Array.isArray(response.expenses)) {
        // Direct response with expenses property
        expenses = response.expenses;
      } else {
        expenses = [];
      }

      if (!Array.isArray(expenses)) {
        throw new Error('Invalid response: expenses is not an array');
      }

      console.debug('✅ fetchExpenses: Successfully parsed response', {
        expensesCount: expenses.length
      });

      // Update transactions state with expenses
      setTransactions(prev => {
        const nonExpenses = prev.filter(t => t.type !== 'Expense');
        return [...nonExpenses, ...expenses];
      });
    } catch (error: any) {
      console.error('❌ fetchExpenses failed:', {
        message: error.message,
        status: error.statusCode,
        details: error.details,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });

      // Enhanced error message with server details in development
      let errorMessage = 'Failed to fetch expenses';
      if ((import.meta as any).env?.DEV) {
        if (error.statusCode === 500) {
          errorMessage += ` (Server Error ${error.statusCode}): ${error.message}`;
        } else if (error.statusCode) {
          errorMessage += ` (HTTP ${error.statusCode}): ${error.message}`;
        } else {
          errorMessage += `: ${error.message}`;
        }
      } else {
        errorMessage += '. Please try again.';
      }

      setErrorState('transactions', errorMessage);
    } finally {
      setLoadingState('transactions', false);
    }
  };

  const createExpense = async (expenseData: any): Promise<Transaction> => {
    try {
      console.debug('🔍 createExpense: Starting API call', {
        expenseData: { 
          category: expenseData.category, 
          amount: expenseData.amount,
          payeeName: expenseData.payeeName 
        }
      });
      
      // Strip client-only fields for API call
      const { receiptImages: clientReceiptImages, ...apiPayload } = expenseData;
      
      // Convert receiptImages to base64 strings for API if they exist
      if (clientReceiptImages && Array.isArray(clientReceiptImages)) {
        apiPayload.receiptImages = clientReceiptImages.map((file: any) => 
          typeof file === 'string' ? file : file.base64
        );
      }
      
      const response = await apiClient.createExpense(apiPayload);
      
      // Handle both normalized and legacy response formats
      const newExpense = response?.data || response;
      
      if (!newExpense || !newExpense.id) {
        throw new Error('Invalid response: missing expense data or ID');
      }
      
      console.debug('✅ createExpense: Successfully created expense', {
        expenseId: newExpense.id,
        amount: newExpense.amount
      });
      
      // Reattach client-only fields for UI display
      const expenseForUI = {
        ...newExpense,
        receiptImages: clientReceiptImages || newExpense.receiptImages
      };
      
      setTransactions(prev => [...prev, expenseForUI]);
      return expenseForUI;
    } catch (error: any) {
      console.error('❌ createExpense failed:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details
      });
      throw error;
    }
  };

  const updateExpense = async (id: string, expenseData: any): Promise<Transaction> => {
    try {
      console.debug('🔍 updateExpense: Starting API call', {
        expenseId: id,
        updateData: { 
          category: expenseData.category, 
          amount: expenseData.amount,
          payeeName: expenseData.payeeName 
        }
      });
      
      const response = await apiClient.updateExpense(id, expenseData);
      
      // Handle both normalized and legacy response formats
      const updatedExpense = response?.data || response;
      
      if (!updatedExpense || !updatedExpense.id) {
        throw new Error('Invalid response: missing expense data or ID');
      }
      
      console.debug('✅ updateExpense: Successfully updated expense', {
        expenseId: updatedExpense.id,
        amount: updatedExpense.amount
      });
      
      setTransactions(prev => prev.map(transaction => transaction.id === id ? updatedExpense : transaction));
      return updatedExpense;
    } catch (error: any) {
      console.error('❌ updateExpense failed:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        expenseId: id
      });
      throw error;
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    try {
      console.debug('🔍 deleteExpense: Starting API call', { expenseId: id });
      
      await apiClient.deleteExpense(id);
      
      console.debug('✅ deleteExpense: Successfully deleted expense', { expenseId: id });
      
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error: any) {
      console.error('❌ deleteExpense failed:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        expenseId: id
      });
      throw error;
    }
  };

  // CRUD operations for users
  const createUser = async (userData: any): Promise<User> => {
    const newUser = await apiClient.createUser(userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (id: string, userData: any): Promise<User> => {
    const updatedUser = await apiClient.updateUser(id, userData);
    setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
    return updatedUser;
  };

  const deleteUser = async (id: string): Promise<void> => {
    await apiClient.deleteUser(id);
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  // Error management
  const clearError = (entity: string) => {
    setErrorState(entity, null);
  };

  const clearAllErrors = () => {
    setErrors({
      users: null,
      shops: null,
      tenants: null,
      agreements: null,
      loans: null,
      penalties: null,
      transactions: null,
      auth: null,
    });
  };

  // Load initial data when authenticated - with debouncing and proper guards
  useEffect(() => {
    // Clear any existing timeout
    if (dataFetchTimeoutRef.current) {
      clearTimeout(dataFetchTimeoutRef.current);
    }

    if (isAuthenticated && !authLoading) {
      console.log('[DataProvider] Auth complete, scheduling data fetch...');
      
      // Debounce data fetching to prevent rapid calls
      dataFetchTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current || !isAuthenticated) return; // Guard against race conditions
        
        mountedRef.current = true;
        console.log('[DataProvider] Starting initial data fetch...');
        
        // Load all data in parallel with error isolation
        Promise.allSettled([
          fetchUsers(),
          fetchShops(),
          fetchTenants(),
          fetchAgreements(),
          fetchLoans(),
          fetchPenalties(),
          fetchTransactions(),
          fetchDonations(), // Load donations from specific endpoint
          fetchExpenses(),  // Load expenses from specific endpoint
        ]).then((results) => {
          console.log('[DataProvider] Initial data fetch completed:', {
            successful: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
          });
        });
      }, 200); // 200ms debounce
    } else {
      // Clear data when not authenticated
      console.log('[DataProvider] Not authenticated, clearing data...');
      mountedRef.current = false;
      setUsers([]);
      setShops([]);
      setTenants([]);
      setAgreements([]);
      setLoans([]);
      setPenalties([]);
      setTransactions([]);
      clearAllErrors();
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (dataFetchTimeoutRef.current) {
        clearTimeout(dataFetchTimeoutRef.current);
      }
    };
  }, [isAuthenticated, authLoading]);

  const value: DataContextType = {
    // Data
    users,
    shops,
    tenants,
    agreements,
    loans,
    penalties,
    transactions,
    receiptCounters,
    
    // Pagination data
    usersPagination,

    // Loading states
    loading,
    
    // Error states
    errors,

    // Fetch functions
    fetchUsers,
    fetchShops,
    fetchTenants,
    fetchAgreements,
    fetchLoans,
    fetchPenalties,
    fetchTransactions,
    
    // CRUD operations
    createShop,
    updateShop,
    deleteShop,
    
    createTenant,
    updateTenant,
    deleteTenant,
    
    createAgreement,
    updateAgreement,
    deleteAgreement,
    
    createLoan,
    updateLoan,
    deleteLoan,
    
    createTransaction,
    updateTransaction,
    deleteTransaction,

    // Specific donation operations
    createDonation,
    updateDonation,
    deleteDonation,
    fetchDonations,

    // Specific expense operations
    createExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses,

    createUser,
    updateUser,
    deleteUser,
    
    // Error management
    clearError,
    clearAllErrors,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}