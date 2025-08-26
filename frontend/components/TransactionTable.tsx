import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useLanguage } from "./LanguageContext";
import { Edit, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  type: 'Donation' | 'Expense' | 'Utilities' | 'Salary' | 'RentIncome';
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  receiptNumber?: string;
  donorName?: string;
  donorContact?: string;
  familyMembers?: number;
  amountPerPerson?: number;
  vendor?: string;
  receipt?: string;
  tenantName?: string;
  tenantContact?: string;
  agreementId?: string;
  shopNumber?: string;
  payeeName?: string;
  payeeContact?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate?: (id: string, transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  currentUser?: any;
}

export default function TransactionTable({ 
  transactions, 
  onUpdate, 
  onDelete,
  currentUser 
}: TransactionTableProps) {
  const { t } = useLanguage();
  
  // Check if user can edit/delete (Admin and Treasurer can modify, Viewer can only view)
  const canModify = currentUser?.role === 'Admin' || currentUser?.role === 'Treasurer';

  const handleEdit = (transaction: Transaction) => {
    if (onUpdate) {
      onUpdate(transaction.id, transaction);
    }
  };

  const handleDelete = (id: string) => {
    if (onDelete && window.confirm(t('common.confirmDelete'))) {
      onDelete(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${t('common.currency')}${amount.toLocaleString()}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Donation':
        return 'bg-green-100 text-green-800';
      case 'RentIncome':
        return 'bg-blue-100 text-blue-800';
      case 'Expense':
        return 'bg-red-100 text-red-800';
      case 'Utilities':
        return 'bg-yellow-100 text-yellow-800';
      case 'Salary':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'Donation':
        return t('reports.donations');
      case 'RentIncome':
        return t('dashboard.totalRentIncome');
      case 'Expense':
        return t('reports.expenses');
      case 'Utilities':
        return t('expenses.utilities');
      case 'Salary':
        return t('expenses.salary');
      default:
        return type;
    }
  };

  const getCategoryDisplay = (transaction: Transaction) => {
    const categoryKey = transaction.category.toLowerCase().replace(/\s+/g, '');
    const categoryName = t(`donations.${categoryKey}`) || transaction.category;
    
    if (transaction.subCategory) {
      const subCategoryName = t(`donations.${transaction.subCategory}`) || transaction.subCategory;
      return `${categoryName} - ${subCategoryName}`;
    }
    
    return categoryName;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('common.date')}</TableHead>
          <TableHead>{t('donations.receiptNumber')}</TableHead>
          <TableHead>{t('common.type')}</TableHead>
          <TableHead>{t('donations.category')}</TableHead>
          <TableHead>{t('donations.donorName')}</TableHead>
          <TableHead>{t('common.description')}</TableHead>
          <TableHead className="text-right">{t('common.amount')}</TableHead>
          {canModify && <TableHead className="text-center">{t('common.actions')}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {(transactions ?? []).map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{transaction.date}</TableCell>
            <TableCell>{transaction.receiptNumber || '-'}</TableCell>
            <TableCell>
              <Badge className={getTypeColor(transaction.type)}>
                {getTypeLabel(transaction.type)}
              </Badge>
            </TableCell>
            <TableCell>{getCategoryDisplay(transaction)}</TableCell>
            <TableCell>
              {transaction.donorName || transaction.vendor || transaction.tenantName || transaction.payeeName || '-'}
              {transaction.shopNumber && transaction.type === 'RentIncome' && (
                <div className="text-xs text-gray-500">
                  Shop: {transaction.shopNumber}
                </div>
              )}
              {transaction.payeeContact && transaction.type === 'Expense' && (
                <div className="text-xs text-gray-500">
                  Contact: {transaction.payeeContact}
                </div>
              )}
            </TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
            {canModify && (
              <TableCell className="text-center">
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(transaction)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(transaction.id)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}