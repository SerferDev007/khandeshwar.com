import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  ReceiptCounters
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
  const { isAuthenticated } = useAuth();
  
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

  // Generic fetch function
  const fetchData = async (
    entity: string,
    fetchFn: () => Promise<any>,
    setter: (data: any) => void
  ) => {
    try {
      setLoadingState(entity, true);
      setErrorState(entity, null);
      const data = await fetchFn();
      setter(data);
    } catch (error: any) {
      setErrorState(entity, error.message || `Failed to fetch ${entity}`);
    } finally {
      setLoadingState(entity, false);
    }
  };

  // Fetch functions
  const fetchUsers = async () => {
    try {
      setLoadingState('users', true);
      setErrorState('users', null);
      const response = await apiClient.getUsers();
      // Extract users array from API response: { users: [...], pagination: {...} }
      const users = response?.users || [];
      setUsers(users);
    } catch (error: any) {
      setErrorState('users', error.message || 'Failed to fetch users');
    } finally {
      setLoadingState('users', false);
    }
  };
  const fetchShops = () => fetchData('shops', apiClient.getShops, setShops);
  const fetchTenants = () => fetchData('tenants', apiClient.getTenants, setTenants);
  const fetchAgreements = () => fetchData('agreements', apiClient.getAgreements, setAgreements);
  const fetchLoans = () => fetchData('loans', apiClient.getLoans, setLoans);
  const fetchPenalties = () => fetchData('penalties', apiClient.getRentPenalties, setPenalties);
  const fetchTransactions = () => fetchData('transactions', apiClient.getTransactions, setTransactions);

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
    try {
      const donations = await apiClient.getDonations();
      // Update transactions state with donations
      setTransactions(prev => {
        const nonDonations = prev.filter(t => t.type !== 'Donation');
        return [...nonDonations, ...donations];
      });
    } catch (error: any) {
      setErrorState('transactions', error.message);
    } finally {
      setLoadingState('transactions', false);
    }
  };

  const createDonation = async (donationData: any): Promise<Transaction> => {
    const newDonation = await apiClient.createDonation(donationData);
    setTransactions(prev => [...prev, newDonation]);
    return newDonation;
  };

  const updateDonation = async (id: string, donationData: any): Promise<Transaction> => {
    const updatedDonation = await apiClient.updateDonation(id, donationData);
    setTransactions(prev => prev.map(transaction => transaction.id === id ? updatedDonation : transaction));
    return updatedDonation;
  };

  const deleteDonation = async (id: string): Promise<void> => {
    await apiClient.deleteDonation(id);
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  // CRUD operations for expenses (specific endpoints)
  const fetchExpenses = async (): Promise<void> => {
    setLoadingState('transactions', true);
    try {
      const expenses = await apiClient.getExpenses();
      // Update transactions state with expenses
      setTransactions(prev => {
        const nonExpenses = prev.filter(t => t.type !== 'Expense');
        return [...nonExpenses, ...expenses];
      });
    } catch (error: any) {
      setErrorState('transactions', error.message);
    } finally {
      setLoadingState('transactions', false);
    }
  };

  const createExpense = async (expenseData: any): Promise<Transaction> => {
    const newExpense = await apiClient.createExpense(expenseData);
    setTransactions(prev => [...prev, newExpense]);
    return newExpense;
  };

  const updateExpense = async (id: string, expenseData: any): Promise<Transaction> => {
    const updatedExpense = await apiClient.updateExpense(id, expenseData);
    setTransactions(prev => prev.map(transaction => transaction.id === id ? updatedExpense : transaction));
    return updatedExpense;
  };

  const deleteExpense = async (id: string): Promise<void> => {
    await apiClient.deleteExpense(id);
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
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

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Load all data in parallel
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
      ]);
    } else {
      // Clear data when not authenticated
      setUsers([]);
      setShops([]);
      setTenants([]);
      setAgreements([]);
      setLoans([]);
      setPenalties([]);
      setTransactions([]);
      clearAllErrors();
    }
  }, [isAuthenticated]);

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