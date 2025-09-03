import React from 'react';
import Dashboard from '../../components/Dashboard';
import { useData } from '../context/DataContext';

export function DashboardRoute() {
  const { transactions } = useData();
  
  // Extract data for dashboard calculations
  const donations = transactions.filter(t => t.type === "Donation");
  const expenses = transactions.filter(t => t.type === "Expense"); 
  const rentIncome = transactions.filter(t => t.type === "RentIncome");

  const totalDonations = donations.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalRentIncome = rentIncome.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalDonations + totalRentIncome - totalExpenses;

  return (
    <Dashboard
      totalDonations={totalDonations}
      totalExpenses={totalExpenses}
      totalRentIncome={totalRentIncome}
      netBalance={netBalance}
      transactions={transactions}
    />
  );
}