import React, { useEffect } from 'react';
import Expenses from '../../components/Expenses';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export function ExpensesRoute() {
  const { user } = useAuth();
  const { 
    transactions, 
    createExpense, 
    updateExpense, 
    deleteExpense
  } = useData();
  
  const expenses = transactions.filter(t => t.type === "Expense");

  // Log route mounting and data changes
  useEffect(() => {
    console.log('[ExpensesRoute] Route mounted:', {
      userId: user?.id,
      userRole: user?.role,
      totalTransactions: transactions.length,
      expenseCount: expenses.length
    });
  }, []);

  useEffect(() => {
    console.log('[ExpensesRoute] Expenses data updated:', {
      totalTransactions: transactions.length,
      expenseCount: expenses.length
    });
  }, [transactions, expenses.length]);

  return (
    <Expenses
      transactions={expenses}
      onAddTransaction={createExpense}
      onUpdateTransaction={updateExpense}
      onDeleteTransaction={deleteExpense}
      currentUser={user}
    />
  );
}