import React, { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Donations from "./components/Donations";
import Expenses from "./components/Expenses";
import Reports from "./components/Reports";
import Login from "./components/Login";
import UserManagement from "./components/UserManagement";
import RentManagement from "./components/RentManagement";
import { LanguageProvider, useLanguage } from "./components/LanguageContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { DataProvider, useData } from "./src/context/DataContext";
import templeImage from "/pics/templeImage.jpg";
import { Alert, AlertDescription } from "./components/ui/alert";
import { toast } from "sonner";

// Import types from shared types file
import type {
  User,
  UploadedFile,
  Shop,
  Tenant,
  Agreement,
  Loan,
  RentPenalty,
  Transaction,
  ReceiptCounters,
} from "./src/types";

function AppContent() {
  const { t } = useLanguage();
  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
    error: authError,
    logout,
  } = useAuth();
  const {
    users,
    shops,
    tenants,
    agreements,
    loans,
    penalties,
    transactions,
    receiptCounters,
    loading,
    errors,
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
    createDonation,
    updateDonation,
    deleteDonation,
    fetchDonations,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses,
    createUser,
    updateUser,
    deleteUser,
    fetchUsers,
  } = useData();

  const [activeTab, setActiveTab] = useState("Dashboard");

  // Handle tab changes and trigger data fetching when needed
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle login error display
  React.useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  // Show loading spinner during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(251, 146, 60, 0.9), rgba(245, 101, 101, 0.9)), url(${templeImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full max-w-md">
          <Login />
        </div>
      </div>
    );
  }

  // Transaction handlers
  const handleAddTransaction = async (
    newTransaction: Omit<Transaction, "id" | "createdAt">
  ) => {
    try {
      await createTransaction(newTransaction);
      toast.success("Transaction added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add transaction");
    }
  };

  const handleUpdateTransaction = async (
    id: string,
    updatedTransaction: Partial<Transaction>
  ) => {
    try {
      await updateTransaction(id, updatedTransaction);
      toast.success("Transaction updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete transaction");
    }
  };

  // Donation handlers (use specific donation API endpoints)
  const handleAddDonation = async (
    newDonation: Omit<Transaction, "id" | "createdAt">
  ) => {
    try {
      await createDonation(newDonation);
      toast.success("Donation added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add donation");
    }
  };

  const handleUpdateDonation = async (
    id: string,
    updatedDonation: Partial<Transaction>
  ) => {
    try {
      await updateDonation(id, updatedDonation);
      toast.success("Donation updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update donation");
    }
  };

  const handleDeleteDonation = async (id: string) => {
    try {
      await deleteDonation(id);
      toast.success("Donation deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete donation");
    }
  };

  // Expense handlers (use specific expense API endpoints)
  const handleAddExpense = async (
    newExpense: Omit<Transaction, "id" | "createdAt">
  ) => {
    try {
      await createExpense(newExpense);
      toast.success("Expense added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add expense");
    }
  };

  const handleUpdateExpense = async (
    id: string,
    updatedExpense: Partial<Transaction>
  ) => {
    try {
      await updateExpense(id, updatedExpense);
      toast.success("Expense updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success("Expense deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete expense");
    }
  };

  // Shop handlers
  const handleAddShop = async (newShop: any) => {
    try {
      await createShop(newShop);
      toast.success("Shop added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add shop");
    }
  };

  const handleUpdateShop = async (id: string, updatedShop: any) => {
    try {
      await updateShop(id, updatedShop);
      toast.success("Shop updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update shop");
    }
  };

  const handleDeleteShop = async (id: string) => {
    try {
      await deleteShop(id);
      toast.success("Shop deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete shop");
    }
  };

  // Tenant handlers
  const handleAddTenant = async (newTenant: any) => {
    try {
      await createTenant(newTenant);
      toast.success("Tenant added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add tenant");
    }
  };

  const handleUpdateTenant = async (id: string, updatedTenant: any) => {
    try {
      await updateTenant(id, updatedTenant);
      toast.success("Tenant updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update tenant");
    }
  };

  const handleDeleteTenant = async (id: string) => {
    try {
      await deleteTenant(id);
      toast.success("Tenant deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tenant");
    }
  };

  // Agreement handlers
  const handleAddAgreement = async (newAgreement: any) => {
    try {
      await createAgreement(newAgreement);
      toast.success("Agreement created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create agreement");
    }
  };

  const handleUpdateAgreement = async (id: string, updatedAgreement: any) => {
    try {
      await updateAgreement(id, updatedAgreement);
      toast.success("Agreement updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update agreement");
    }
  };

  const handleDeleteAgreement = async (id: string) => {
    try {
      await deleteAgreement(id);
      toast.success("Agreement deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete agreement");
    }
  };

  // Loan handlers
  const handleAddLoan = async (newLoan: any) => {
    try {
      await createLoan(newLoan);
      toast.success("Loan created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create loan");
    }
  };

  const handleUpdateLoan = async (id: string, updatedLoan: any) => {
    try {
      await updateLoan(id, updatedLoan);
      toast.success("Loan updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update loan");
    }
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await deleteLoan(id);
      toast.success("Loan deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete loan");
    }
  };

  // User handlers with enhanced error handling
  // This provides specific, actionable error messages instead of generic "Failed to add user"
  const handleAddUser = async (newUser: any) => {
    try {
      await createUser(newUser);
      toast.success("User added successfully!");
    } catch (error: any) {
      console.error("Create user error:", error);

      // Handle validation errors with specific field messages
      // Backend returns structured error responses with details array for validation failures
      if (
        error.status === 400 &&
        error.details &&
        Array.isArray(error.details)
      ) {
        const fieldErrors = error.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(", ");
        toast.error(`Validation failed: ${fieldErrors}`);
      } else if (error.status === 409) {
        // Handle duplicate user errors (username or email already exists)
        toast.error(
          error.message ||
            "User already exists (username or email already taken)"
        );
      } else {
        // Fallback for other errors
        toast.error(error.message || "Failed to add user");
      }
    }
  };

  const handleUpdateUser = async (id: string, updatedUser: any) => {
    try {
      await updateUser(id, updatedUser);
      toast.success("User updated successfully!");
    } catch (error: any) {
      console.error("Update user error:", error);

      // Handle validation errors with specific field messages
      // Same error handling pattern as handleAddUser for consistency
      if (
        error.status === 400 &&
        error.details &&
        Array.isArray(error.details)
      ) {
        const fieldErrors = error.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(", ");
        toast.error(`Validation failed: ${fieldErrors}`);
      } else if (error.status === 409) {
        // Handle duplicate user errors during updates
        toast.error(error.message || "Username or email already taken");
      } else {
        toast.error(error.message || "Failed to update user");
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success("User deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleToggleUserStatus = (id: string) => {
    const userToUpdate = users.find((u) => u.id === id);
    if (userToUpdate) {
      const newStatus =
        userToUpdate.status === "Active" ? "Inactive" : "Active";
      handleUpdateUser(id, { status: newStatus });
    }
  };

  // Placeholder functions for compatibility
  const handleUpdatePenalty = (id: string, penalty: any) => {
    // TODO: Implement penalty update
    console.log("Update penalty:", id, penalty);
  };

  const handleUpdateReceiptCounter = (
    type: "donations" | "rentIncome",
    count: number
  ) => {
    // This will be handled by the backend in the future
    console.log(`Update ${type} counter to:`, count);
  };

  // Document management (placeholder for now)
  const saveDocuments = (key: string, documents: UploadedFile[]) => {
    localStorage.setItem(key, JSON.stringify(documents));
  };

  const loadDocuments = (key: string): UploadedFile[] => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  };

  // Calculate totals from transactions
  const donations = transactions.filter((t) => t.type === "Donation");
  const expenses = transactions.filter(
    (t) => t.type === "Expense" || t.type === "Utilities" || t.type === "Salary"
  );
  const rentIncome = transactions.filter((t) => t.type === "RentIncome");

  const totalDonations = donations.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalRentIncome = rentIncome.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalDonations + totalRentIncome - totalExpenses;

  // Main application content
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={user}
        onLogout={() => logout()}
      />

      <main className="container mx-auto px-4 py-6">
        {activeTab === "Dashboard" && (
          <Dashboard
            totalDonations={totalDonations}
            totalExpenses={totalExpenses}
            totalRentIncome={totalRentIncome}
            netBalance={netBalance}
            transactions={transactions}
          />
        )}

        {activeTab === "Donations" && (
          <Donations
            transactions={donations}
            onAddTransaction={handleAddDonation}
            onUpdateTransaction={handleUpdateDonation}
            onDeleteTransaction={handleDeleteDonation}
            receiptCounter={receiptCounters.donations}
            onUpdateReceiptCounter={(count) =>
              handleUpdateReceiptCounter("donations", count)
            }
            currentUser={user}
          />
        )}

        {activeTab === "Expenses" && (
          <Expenses
            transactions={expenses}
            onAddTransaction={handleAddExpense}
            onUpdateTransaction={handleUpdateExpense}
            onDeleteTransaction={handleDeleteExpense}
            currentUser={user}
          />
        )}

        {activeTab === "Reports" && (
          <Reports
            transactions={transactions}
            shops={shops}
            tenants={tenants}
            agreements={agreements}
            loans={loans}
            penalties={penalties}
          />
        )}

        {activeTab === "Users" && user?.role === "Admin" && (
          <UserManagement
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
            currentUser={user}
            loading={loading.users}
            error={errors.users}
          />
        )}

        {activeTab === "RentManagement" && (
          <RentManagement
            shops={shops}
            tenants={tenants}
            agreements={agreements}
            loans={loans}
            penalties={penalties}
            onAddShop={handleAddShop}
            onUpdateShop={handleUpdateShop}
            onDeleteShop={handleDeleteShop}
            onAddTenant={handleAddTenant}
            onUpdateTenant={handleUpdateTenant}
            onDeleteTenant={handleDeleteTenant}
            onAddAgreement={handleAddAgreement}
            onUpdateAgreement={handleUpdateAgreement}
            onDeleteAgreement={handleDeleteAgreement}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
            onUpdatePenalty={handleUpdatePenalty}
            onAddTransaction={handleAddTransaction}
            receiptCounter={receiptCounters.rentIncome}
            onUpdateReceiptCounter={(count) =>
              handleUpdateReceiptCounter("rentIncome", count)
            }
            currentUser={user}
            saveDocuments={saveDocuments}
            loadDocuments={loadDocuments}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
