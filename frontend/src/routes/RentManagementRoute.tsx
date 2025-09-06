import React from "react";
import RentManagement from "../../components/RentManagement";
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import type { UploadedFile } from '../types';

// Minimal, defensive helper to ensure arrays
const toArray = <T,>(val: unknown): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (val != null && typeof val === 'object') return [val as T];
  return [];
};

export function RentManagementRoute() {
  const { user } = useAuth();
  const { 
    shops, 
    tenants, 
    agreements, 
    loans, 
    penalties,
    receiptCounters,
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
    updatePenalty,
    createTransaction
  } = useData();

  // Handler functions
  const handleAddShop = async (newShop: any) => {
    try {
      await createShop(newShop);
      toast.success("Shop added successfully!");
    } catch (error: any) {
      if (error.statusCode === 429) {
        toast.error("Too many requests. Please wait a moment and try again. The system has rate limiting to prevent overload.");
      } else if (error.statusCode === 409) {
        toast.error("Shop number already exists. Please use a different shop number.");
      } else {
        toast.error(error.message || "Failed to add shop");
      }
      throw error;
    }
  };

  const handleUpdateShop = async (id: string, updatedShop: any) => {
    try {
      await updateShop(id, updatedShop);
      toast.success("Shop updated successfully!");
    } catch (error: any) {
      if (error.statusCode === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to update shop");
      }
      throw error;
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

  const handleAddLoan = async (newLoan: any) => {
    try {
      await createLoan(newLoan);
      toast.success("Loan added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add loan");
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

  const handleUpdatePenalty = async (id: string, updatedPenalty: any) => {
    try {
      await updatePenalty(id, updatedPenalty);
      toast.success("Penalty updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update penalty");
    }
  };

  const handleAddTransaction = async (newTransaction: any) => {
    try {
      await createTransaction(newTransaction);
      toast.success("Transaction added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add transaction");
    }
  };

  const handleUpdateReceiptCounter = (count: number) => {
    // This is a placeholder - in real app this would call API
    console.log(`Receipt counter updated: rentIncome = ${count}`);
  };

  // Document management (placeholder for now)
  const saveDocuments = (key: string, documents: UploadedFile[]) => {
    localStorage.setItem(key, JSON.stringify(documents));
  };

  const loadDocuments = (key: string): UploadedFile[] => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  };

  return (
    <RentManagement
      shops={toArray(shops)}
      tenants={toArray(tenants)}
      agreements={toArray(agreements)}
      loans={toArray(loans)}
      penalties={toArray(penalties)}
      onAddShop={handleAddShop}
      onUpdateShop={handleUpdateShop}
      onDeleteShop={handleDeleteShop}
      onAddTenant={handleAddTenant}
      onUpdateTenant={handleUpdateTenant}
      onDeleteTenant={handleDeleteTenant}
      onCreateAgreement={handleAddAgreement}
      onUpdateAgreement={handleUpdateAgreement}
      onDeleteAgreement={handleDeleteAgreement}
      onAddLoan={handleAddLoan}
      onUpdateLoan={handleUpdateLoan}
      onDeleteLoan={handleDeleteLoan}
      onUpdatePenalty={handleUpdatePenalty}
      onAddTransaction={handleAddTransaction}
      receiptCounter={receiptCounters.rentIncome}
      onUpdateReceiptCounter={handleUpdateReceiptCounter}
      currentUser={user}
      saveDocuments={saveDocuments}
      loadDocuments={loadDocuments}
    />
  );
}