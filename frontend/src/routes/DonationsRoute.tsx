import React from 'react';
import Donations from '../../components/Donations';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export function DonationsRoute() {
  const { user } = useAuth();
  const { 
    transactions, 
    receiptCounters, 
    createDonation, 
    updateDonation, 
    deleteDonation
  } = useData();
  
  const donations = transactions.filter(t => t.type === "Donation");
  
  const handleUpdateReceiptCounter = (count: number) => {
    // This is a placeholder - in real app this would call API
    console.log(`Receipt counter updated: donations = ${count}`);
  };

  return (
    <Donations
      transactions={donations}
      onAddTransaction={createDonation}
      onUpdateTransaction={updateDonation}
      onDeleteTransaction={deleteDonation}
      receiptCounter={receiptCounters.donations}
      onUpdateReceiptCounter={handleUpdateReceiptCounter}
      currentUser={user}
    />
  );
}