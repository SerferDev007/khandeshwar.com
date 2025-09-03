import React from 'react';
import Reports from '../../components/Reports';
import { useData } from '../context/DataContext';

export function ReportsRoute() {
  const { 
    transactions, 
    shops, 
    tenants, 
    agreements, 
    loans, 
    penalties 
  } = useData();

  return (
    <Reports
      transactions={transactions}
      shops={shops}
      tenants={tenants}
      agreements={agreements}
      loans={loans}
      penalties={penalties}
    />
  );
}