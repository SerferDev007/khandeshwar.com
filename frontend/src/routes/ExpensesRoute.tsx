import React from 'react';
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