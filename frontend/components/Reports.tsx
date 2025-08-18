import { useState, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Download,
  Upload,
  FileText,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  RotateCcw,
  Eye,
  BarChart3,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Transaction {
  id: string;
  date: string;
  type: "Donation" | "Expense" | "Utilities" | "Salary" | "RentIncome";
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
  loanId?: string;
  emiAmount?: number;
  penaltyId?: string;
  penaltyAmount?: number;
}

interface ReportsProps {
  transactions: Transaction[];
  onImportTransactions?: (transactions: Transaction[]) => void;
}

interface FilterState {
  transactionType: string;
  category: string;
  subCategory: string;
  month: string;
  year: string;
  fromDate: string;
  toDate: string;
  dateFilterType: "all" | "month" | "range";
}

interface ExportFilterState {
  fromDate: string;
  toDate: string;
  transactionType: string;
  exportType: string;
  exportFormat: string;
  pdfLanguage: string;
  // New export-specific filters
  category: string;
  subCategory: string;
  month: string;
  year: string;
  dateFilterType: "all" | "month" | "range";
}

const initialFilterState: FilterState = {
  transactionType: "all",
  category: "all",
  subCategory: "all",
  month: "",
  year: "",
  fromDate: "",
  toDate: "",
  dateFilterType: "all",
};

const initialExportFilterState: ExportFilterState = {
  fromDate: "",
  toDate: "",
  transactionType: "all",
  exportType: "transactions",
  exportFormat: "csv",
  pdfLanguage: "en",
  category: "all",
  subCategory: "all",
  month: "",
  year: "",
  dateFilterType: "all",
};

export default function Reports({
  transactions,
  onImportTransactions,
}: ReportsProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportDialog, setExportDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("filtered");
  const [viewMode, setViewMode] = useState<"table" | "summary">("table");

  // Filter state
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [showFilters, setShowFilters] = useState(true);

  // Export state with enhanced filters
  const [exportFilters, setExportFilters] = useState<ExportFilterState>(
    initialExportFilterState
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Get unique categories and subcategories for main view
  const getUniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach((t) => {
      if (
        filters.transactionType === "all" ||
        (filters.transactionType === "donations" && t.type === "Donation") ||
        (filters.transactionType === "expenses" &&
          (t.type === "Expense" ||
            t.type === "Utilities" ||
            t.type === "Salary")) ||
        (filters.transactionType === "rentIncome" && t.type === "RentIncome")
      ) {
        categories.add(t.category);
      }
    });
    return Array.from(categories).sort();
  }, [transactions, filters.transactionType]);

  const getUniqueSubCategories = useMemo(() => {
    const subCategories = new Set<string>();
    transactions.forEach((t) => {
      if (
        t.subCategory &&
        (filters.transactionType === "all" ||
          (filters.transactionType === "donations" && t.type === "Donation") ||
          (filters.transactionType === "expenses" &&
            (t.type === "Expense" ||
              t.type === "Utilities" ||
              t.type === "Salary")) ||
          (filters.transactionType === "rentIncome" &&
            t.type === "RentIncome")) &&
        (filters.category === "all" || t.category === filters.category)
      ) {
        subCategories.add(t.subCategory);
      }
    });
    return Array.from(subCategories).sort();
  }, [transactions, filters.transactionType, filters.category]);

  // Get unique categories and subcategories for export filters
  const getExportUniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach((t) => {
      if (
        exportFilters.transactionType === "all" ||
        (exportFilters.transactionType === "donations" &&
          t.type === "Donation") ||
        (exportFilters.transactionType === "expenses" &&
          (t.type === "Expense" ||
            t.type === "Utilities" ||
            t.type === "Salary")) ||
        (exportFilters.transactionType === "rentIncome" &&
          t.type === "RentIncome")
      ) {
        categories.add(t.category);
      }
    });
    return Array.from(categories).sort();
  }, [transactions, exportFilters.transactionType]);

  const getExportUniqueSubCategories = useMemo(() => {
    const subCategories = new Set<string>();
    transactions.forEach((t) => {
      if (
        t.subCategory &&
        (exportFilters.transactionType === "all" ||
          (exportFilters.transactionType === "donations" &&
            t.type === "Donation") ||
          (exportFilters.transactionType === "expenses" &&
            (t.type === "Expense" ||
              t.type === "Utilities" ||
              t.type === "Salary")) ||
          (exportFilters.transactionType === "rentIncome" &&
            t.type === "RentIncome")) &&
        (exportFilters.category === "all" ||
          t.category === exportFilters.category)
      ) {
        subCategories.add(t.subCategory);
      }
    });
    return Array.from(subCategories).sort();
  }, [transactions, exportFilters.transactionType, exportFilters.category]);

  // Get unique years from transactions
  const getUniqueYears = useMemo(() => {
    const years = new Set<string>();
    transactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear().toString());
    });
    return Array.from(years).sort().reverse();
  }, [transactions]);

  // Filter transactions based on current filter state
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Type filter
      if (filters.transactionType !== "all") {
        if (
          filters.transactionType === "donations" &&
          transaction.type !== "Donation"
        )
          return false;
        if (
          filters.transactionType === "expenses" &&
          !["Expense", "Utilities", "Salary"].includes(transaction.type)
        )
          return false;
        if (
          filters.transactionType === "rentIncome" &&
          transaction.type !== "RentIncome"
        )
          return false;
      }

      // Category filter
      if (
        filters.category !== "all" &&
        transaction.category !== filters.category
      )
        return false;

      // SubCategory filter
      if (
        filters.subCategory !== "all" &&
        transaction.subCategory !== filters.subCategory
      )
        return false;

      // Date filters
      const transactionDate = new Date(transaction.date);

      if (filters.dateFilterType === "month" && filters.month && filters.year) {
        const filterMonth = parseInt(filters.month);
        const filterYear = parseInt(filters.year);
        if (
          transactionDate.getMonth() + 1 !== filterMonth ||
          transactionDate.getFullYear() !== filterYear
        ) {
          return false;
        }
      }

      if (filters.dateFilterType === "range") {
        if (filters.fromDate && transaction.date < filters.fromDate)
          return false;
        if (filters.toDate && transaction.date > filters.toDate) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Calculate summary statistics for filtered transactions
  const summaryStats = useMemo(() => {
    const donations = filteredTransactions.filter((t) => t.type === "Donation");
    const expenses = filteredTransactions.filter(
      (t) =>
        t.type === "Expense" || t.type === "Utilities" || t.type === "Salary"
    );
    const rentIncomes = filteredTransactions.filter(
      (t) => t.type === "RentIncome"
    );

    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRentIncome = rentIncomes.reduce((sum, r) => sum + r.amount, 0);
    const netBalance = totalDonations + totalRentIncome - totalExpenses;

    // Category wise breakdown
    const categoryWiseIncome = donations.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryWiseExpenses = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    // Monthly breakdown
    const monthlyData = filteredTransactions.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[month]) {
        acc[month] = { donations: 0, expenses: 0, rentIncome: 0 };
      }
      if (t.type === "Donation") {
        acc[month].donations += t.amount;
      } else if (t.type === "RentIncome") {
        acc[month].rentIncome += t.amount;
      } else {
        acc[month].expenses += t.amount;
      }
      return acc;
    }, {} as Record<string, { donations: number; expenses: number; rentIncome: number }>);

    return {
      totalDonations,
      totalExpenses,
      totalRentIncome,
      netBalance,
      categoryWiseIncome,
      categoryWiseExpenses,
      monthlyData,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return `${t("common.currency")}${amount.toLocaleString()}`;
  };

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value };

        // Reset subcategory when category changes
        if (key === "category") {
          newFilters.subCategory = "all";
        }

        // Reset category and subcategory when transaction type changes
        if (key === "transactionType") {
          newFilters.category = "all";
          newFilters.subCategory = "all";
        }

        return newFilters;
      });
    },
    []
  );

  // Handle export filter changes
  const handleExportFilterChange = useCallback(
    (key: keyof ExportFilterState, value: string) => {
      setExportFilters((prev) => {
        const newFilters = { ...prev, [key]: value };

        // Reset subcategory when category changes
        if (key === "category") {
          newFilters.subCategory = "all";
        }

        // Reset category and subcategory when transaction type changes
        if (key === "transactionType") {
          newFilters.category = "all";
          newFilters.subCategory = "all";
        }

        // Reset date-related filters when dateFilterType changes
        if (key === "dateFilterType") {
          if (value !== "month") {
            newFilters.month = "";
            newFilters.year = "";
          }
          if (value !== "range") {
            newFilters.fromDate = "";
            newFilters.toDate = "";
          }
        }

        return newFilters;
      });
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  // Clear export filters
  const clearExportFilters = useCallback(() => {
    setExportFilters((prev) => ({
      ...initialExportFilterState,
      exportType: prev.exportType,
      exportFormat: prev.exportFormat,
      pdfLanguage: prev.pdfLanguage,
    }));
  }, []);

  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      filters.transactionType !== "all" ||
      filters.category !== "all" ||
      filters.subCategory !== "all" ||
      filters.dateFilterType !== "all" ||
      (filters.dateFilterType === "month" && (filters.month || filters.year)) ||
      (filters.dateFilterType === "range" &&
        (filters.fromDate || filters.toDate))
    );
  }, [filters]);

  // Check if any export filters are applied
  const hasActiveExportFilters = useMemo(() => {
    return (
      exportFilters.transactionType !== "all" ||
      exportFilters.category !== "all" ||
      exportFilters.subCategory !== "all" ||
      exportFilters.dateFilterType !== "all" ||
      (exportFilters.dateFilterType === "month" &&
        (exportFilters.month || exportFilters.year)) ||
      (exportFilters.dateFilterType === "range" &&
        (exportFilters.fromDate || exportFilters.toDate))
    );
  }, [exportFilters]);

  // Get translation for specific language
  const getTranslation = (key: string, language: "en" | "mr") => {
    const translations = {
      en: {
        "header.titleMarathi": "श्री क्षेत्र खंडेश्वर देवस्थान कुसळंब",
        "header.title": "Shree Kshetra Khandeshar Devasthan Kusalamb",
        "header.subtitle": "Temple Management System",
        "reports.financialReport": "Financial Report",
        "reports.generatedOn": "Generated On",
        "reports.period": "Period",
        "reports.srNo": "Sr. No.",
        "reports.totalAmount": "Total Amount",
        "dashboard.totalDonations": "Total Donations",
        "dashboard.totalRentIncome": "Total Rent Income",
        "dashboard.totalExpenses": "Total Expenses",
        "dashboard.netBalance": "Net Balance",
        "common.date": "Date",
        "common.type": "Type",
        "donations.category": "Category",
        "common.description": "Description",
        "common.amount": "Amount",
        "reports.donations": "Donations",
        "reports.expenses": "Expenses",
        "reports.overview": "Financial Overview",
        "reports.categoryBreakdown": "Category Breakdown",
        "reports.monthlyTrend": "Monthly Trend",
        "reports.transactionReport": "Transaction Report",
        "reports.summaryReport": "Summary Report",
        "reports.categoryReport": "Category Report",
        "reports.monthlyReport": "Monthly Report",
        "reports.month": "Month",
      },
      mr: {
        "header.titleMarathi": "श्री क्षेत्र खंडेश्वर देवस्थान कुसळंब",
        "header.title": "श्री क्षेत्र खंडेश्वर देवस्थान कुसळंब",
        "header.subtitle": "मंदिर व्यवस्थापन प्रणाली",
        "reports.financialReport": "आर्थिक अहवाल",
        "reports.generatedOn": "तयार केले",
        "reports.period": "कालावधी",
        "reports.srNo": "अ. क्र.",
        "reports.totalAmount": "एकूण रक्कम",
        "dashboard.totalDonations": "एकूण जमा",
        "dashboard.totalRentIncome": "एकूण भाडे उत्पन्न",
        "dashboard.totalExpenses": "एकूण खर्च",
        "dashboard.netBalance": "निव्वळ शिल्लक",
        "common.date": "दिनांक",
        "common.type": "प्रकार",
        "donations.category": "श्रेणी",
        "common.description": "वर्णन",
        "common.amount": "रक्कम",
        "reports.donations": "जमा",
        "reports.expenses": "खर्च",
        "reports.overview": "आर्थिक सारांश",
        "reports.categoryBreakdown": "श्रेणी विभाजन",
        "reports.monthlyTrend": "मासिक प्रवृत्ती",
        "reports.transactionReport": "व्यवहार अहवाल",
        "reports.summaryReport": "सारांश अहवाल",
        "reports.categoryReport": "श्रेणी अहवाल",
        "reports.monthlyReport": "मासिक अहवाल",
        "reports.month": "महिना",
      },
    };
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  // Enhanced filter transactions based on export criteria
  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by transaction type
    switch (exportFilters.transactionType) {
      case "donations":
        filtered = filtered.filter((t) => t.type === "Donation");
        break;
      case "expenses":
        filtered = filtered.filter(
          (t) =>
            t.type === "Expense" ||
            t.type === "Utilities" ||
            t.type === "Salary"
        );
        break;
      case "rentIncome":
        filtered = filtered.filter((t) => t.type === "RentIncome");
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Filter by category
    if (exportFilters.category !== "all") {
      filtered = filtered.filter((t) => t.category === exportFilters.category);
    }

    // Filter by sub-category
    if (exportFilters.subCategory !== "all") {
      filtered = filtered.filter(
        (t) => t.subCategory === exportFilters.subCategory
      );
    }

    // Date filters
    const transactionDate = (dateStr: string) => new Date(dateStr);

    if (
      exportFilters.dateFilterType === "month" &&
      exportFilters.month &&
      exportFilters.year
    ) {
      const filterMonth = parseInt(exportFilters.month);
      const filterYear = parseInt(exportFilters.year);
      filtered = filtered.filter((t) => {
        const date = transactionDate(t.date);
        return (
          date.getMonth() + 1 === filterMonth &&
          date.getFullYear() === filterYear
        );
      });
    }

    if (exportFilters.dateFilterType === "range") {
      if (exportFilters.fromDate) {
        filtered = filtered.filter((t) => t.date >= exportFilters.fromDate);
      }
      if (exportFilters.toDate) {
        filtered = filtered.filter((t) => t.date <= exportFilters.toDate);
      }
    }

    // Legacy date range filter (for backward compatibility)
    if (exportFilters.dateFilterType === "all") {
      if (exportFilters.fromDate) {
        filtered = filtered.filter((t) => t.date >= exportFilters.fromDate);
      }
      if (exportFilters.toDate) {
        filtered = filtered.filter((t) => t.date <= exportFilters.toDate);
      }
    }

    return filtered;
  };

  // Convert data to CSV format
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in values
            return typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  // Download CSV file
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Manual table drawing function
  const drawTable = (
    doc: jsPDF,
    startY: number,
    headers: string[],
    data: string[][],
    options: {
      headerColor?: number[];
      cellPadding?: number;
      fontSize?: number;
      columnWidths?: number[];
      tableWidth?: number;
    } = {}
  ) => {
    const {
      headerColor = [66, 139, 202],
      cellPadding = 3,
      fontSize = 9,
      columnWidths,
      tableWidth = 170,
    } = options;

    const pageWidth = doc.internal.pageSize.width;
    const startX = (pageWidth - tableWidth) / 2;
    let currentY = startY;

    // Calculate column widths
    const colWidths =
      columnWidths || headers.map(() => tableWidth / headers.length);
    const rowHeight = fontSize + cellPadding * 2;

    doc.setFontSize(fontSize);

    // Draw header
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.setTextColor(255, 255, 255);
    doc.rect(startX, currentY, tableWidth, rowHeight, "F");

    headers.forEach((header, i) => {
      const x =
        startX + colWidths.slice(0, i).reduce((sum, width) => sum + width, 0);
      doc.text(header, x + cellPadding, currentY + rowHeight - cellPadding);
    });

    currentY += rowHeight;

    // Draw data rows
    doc.setTextColor(0, 0, 0);
    data.forEach((row, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, currentY, tableWidth, rowHeight, "F");
      }

      row.forEach((cell, colIndex) => {
        const x =
          startX +
          colWidths.slice(0, colIndex).reduce((sum, width) => sum + width, 0);
        const cellText = cell.toString();

        // Truncate text if too long
        const maxWidth = colWidths[colIndex] - cellPadding * 2;
        const textWidth = doc.getTextWidth(cellText);

        let finalText = cellText;
        if (textWidth > maxWidth) {
          // Simple truncation
          const ratio = maxWidth / textWidth;
          const truncateLength = Math.floor(cellText.length * ratio) - 3;
          finalText = cellText.substring(0, truncateLength) + "...";
        }

        // Right align for amount columns (last column usually)
        if (colIndex === headers.length - 1 && cellText.includes("₹")) {
          doc.text(
            finalText,
            x + colWidths[colIndex] - cellPadding,
            currentY + rowHeight - cellPadding,
            { align: "right" }
          );
        } else {
          doc.text(
            finalText,
            x + cellPadding,
            currentY + rowHeight - cellPadding
          );
        }
      });

      currentY += rowHeight;

      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 30) {
        doc.addPage();
        currentY = 20;
      }
    });

    // Draw border
    doc.setDrawColor(0, 0, 0);
    doc.rect(startX, startY, tableWidth, (data.length + 1) * rowHeight);

    // Draw column lines
    let x = startX;
    colWidths.forEach((width) => {
      x += width;
      if (x < startX + tableWidth) {
        doc.line(x, startY, x, startY + (data.length + 1) * rowHeight);
      }
    });

    // Draw row lines
    for (let i = 0; i <= data.length; i++) {
      const y = startY + i * rowHeight;
      doc.line(startX, y, startX + tableWidth, y);
    }

    return currentY + 10;
  };

  // Generate PDF report
  const generatePDF = (reportType: string, language: "en" | "mr") => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Header with temple name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    if (language === "mr") {
      doc.text(
        "श्री क्षेत्र खंडेश्वर देवस्थान कुसळंब",
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
    } else {
      doc.text(
        getTranslation("header.title", language),
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
    }
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(
      getTranslation("header.subtitle", language),
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 20;

    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    let reportTitle = "";
    switch (reportType) {
      case "transactions":
        reportTitle = getTranslation("reports.transactionReport", language);
        break;
      case "summary":
        reportTitle = getTranslation("reports.summaryReport", language);
        break;
      case "categoryBreakdown":
        reportTitle = getTranslation("reports.categoryReport", language);
        break;
      case "monthly":
        reportTitle = getTranslation("reports.monthlyReport", language);
        break;
    }
    doc.text(reportTitle, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Generated on
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `${getTranslation(
        "reports.generatedOn",
        language
      )}: ${new Date().toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 10;

    // Applied filters summary
    if (hasActiveExportFilters) {
      doc.text("Applied Filters:", 20, yPosition);
      yPosition += 5;
      if (exportFilters.transactionType !== "all") {
        doc.text(`- Type: ${exportFilters.transactionType}`, 25, yPosition);
        yPosition += 5;
      }
      if (exportFilters.category !== "all") {
        doc.text(`- Category: ${exportFilters.category}`, 25, yPosition);
        yPosition += 5;
      }
      if (exportFilters.subCategory !== "all") {
        doc.text(`- Sub-Category: ${exportFilters.subCategory}`, 25, yPosition);
        yPosition += 5;
      }
      if (
        exportFilters.dateFilterType === "month" &&
        exportFilters.month &&
        exportFilters.year
      ) {
        const monthName = new Date(
          parseInt(exportFilters.year),
          parseInt(exportFilters.month) - 1,
          1
        ).toLocaleString("default", { month: "long", year: "numeric" });
        doc.text(`- Month: ${monthName}`, 25, yPosition);
        yPosition += 5;
      }
      if (
        exportFilters.dateFilterType === "range" &&
        (exportFilters.fromDate || exportFilters.toDate)
      ) {
        const fromDate = exportFilters.fromDate || "Start";
        const toDate = exportFilters.toDate || "End";
        doc.text(`- Date Range: ${fromDate} to ${toDate}`, 25, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
    }

    // Period
    if (
      exportFilters.fromDate ||
      exportFilters.toDate ||
      exportFilters.dateFilterType !== "all"
    ) {
      let periodText = "";
      if (
        exportFilters.dateFilterType === "month" &&
        exportFilters.month &&
        exportFilters.year
      ) {
        const monthName = new Date(
          parseInt(exportFilters.year),
          parseInt(exportFilters.month) - 1,
          1
        ).toLocaleString("default", { month: "long", year: "numeric" });
        periodText = `${getTranslation(
          "reports.period",
          language
        )}: ${monthName}`;
      } else {
        const fromDate = exportFilters.fromDate || "Start";
        const toDate = exportFilters.toDate || "End";
        periodText = `${getTranslation(
          "reports.period",
          language
        )}: ${fromDate} to ${toDate}`;
      }
      doc.text(periodText, 20, yPosition);
      yPosition += 15;
    } else {
      yPosition += 10;
    }

    // Generate content based on report type
    switch (reportType) {
      case "transactions":
        generateTransactionPDF(doc, yPosition, language);
        break;
      case "summary":
        generateSummaryPDF(doc, yPosition, language);
        break;
      case "categoryBreakdown":
        generateCategoryPDF(doc, yPosition, language);
        break;
      case "monthly":
        generateMonthlyPDF(doc, yPosition, language);
        break;
    }

    return doc;
  };

  const generateTransactionPDF = (
    doc: jsPDF,
    startY: number,
    language: "en" | "mr"
  ) => {
    const filtered = getFilteredTransactions();
    const headers = [
      getTranslation("reports.srNo", language),
      getTranslation("common.date", language),
      getTranslation("common.type", language),
      getTranslation("donations.category", language),
      getTranslation("common.description", language),
      getTranslation("common.amount", language),
    ];

    const tableData = filtered.map((t, index) => [
      (index + 1).toString(),
      t.date,
      t.type === "RentIncome"
        ? language === "mr"
          ? "भाडे उत्पन्न"
          : "Rent Income"
        : t.type === "Donation"
        ? getTranslation("reports.donations", language)
        : getTranslation("reports.expenses", language),
      t.category,
      t.description.length > 20
        ? t.description.substring(0, 20) + "..."
        : t.description,
      `₹${t.amount.toLocaleString()}`,
    ]);

    const finalY = drawTable(doc, startY, headers, tableData, {
      columnWidths: [15, 25, 30, 30, 45, 25],
      tableWidth: 170,
    });

    // Add total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      `${getTranslation("reports.totalAmount", language)}: ₹${filtered
        .reduce((sum, t) => sum + t.amount, 0)
        .toLocaleString()}`,
      20,
      finalY + 5
    );
  };

  const generateSummaryPDF = (
    doc: jsPDF,
    startY: number,
    language: "en" | "mr"
  ) => {
    const filtered = getFilteredTransactions();
    const donations = filtered.filter((t) => t.type === "Donation");
    const expenses = filtered.filter(
      (t) =>
        t.type === "Expense" || t.type === "Utilities" || t.type === "Salary"
    );
    const rentIncomes = filtered.filter((t) => t.type === "RentIncome");

    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRentIncome = rentIncomes.reduce((sum, r) => sum + r.amount, 0);
    const netBalance = totalDonations + totalRentIncome - totalExpenses;

    const headers = [
      getTranslation("reports.overview", language),
      getTranslation("common.amount", language),
    ];
    const summaryData = [
      [
        getTranslation("dashboard.totalDonations", language),
        `₹${totalDonations.toLocaleString()}`,
      ],
      [
        getTranslation("dashboard.totalRentIncome", language),
        `₹${totalRentIncome.toLocaleString()}`,
      ],
      [
        getTranslation("dashboard.totalExpenses", language),
        `₹${totalExpenses.toLocaleString()}`,
      ],
      [
        getTranslation("dashboard.netBalance", language),
        `₹${netBalance.toLocaleString()}`,
      ],
    ];

    drawTable(doc, startY, headers, summaryData, {
      columnWidths: [120, 50],
      tableWidth: 170,
      fontSize: 12,
      cellPadding: 5,
    });
  };

  const generateCategoryPDF = (
    doc: jsPDF,
    startY: number,
    language: "en" | "mr"
  ) => {
    const filtered = getFilteredTransactions();
    const donations = filtered.filter((t) => t.type === "Donation");
    const expenses = filtered.filter(
      (t) =>
        t.type === "Expense" || t.type === "Utilities" || t.type === "Salary"
    );

    const categoryWiseIncome = donations.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryWiseExpenses = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const headers = [
      getTranslation("donations.category", language),
      getTranslation("common.type", language),
      getTranslation("common.amount", language),
    ];

    const categoryData = [
      ...Object.entries(categoryWiseIncome).map(([category, amount]) => [
        category,
        getTranslation("reports.donations", language),
        `₹${amount.toLocaleString()}`,
      ]),
      ...Object.entries(categoryWiseExpenses).map(([category, amount]) => [
        category,
        getTranslation("reports.expenses", language),
        `₹${amount.toLocaleString()}`,
      ]),
    ];

    drawTable(doc, startY, headers, categoryData, {
      columnWidths: [80, 50, 40],
      tableWidth: 170,
      fontSize: 11,
      cellPadding: 4,
    });
  };

  const generateMonthlyPDF = (
    doc: jsPDF,
    startY: number,
    language: "en" | "mr"
  ) => {
    const filtered = getFilteredTransactions();
    const monthlyData = filtered.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[month]) {
        acc[month] = { donations: 0, expenses: 0, rentIncome: 0 };
      }
      if (t.type === "Donation") {
        acc[month].donations += t.amount;
      } else if (t.type === "RentIncome") {
        acc[month].rentIncome += t.amount;
      } else {
        acc[month].expenses += t.amount;
      }
      return acc;
    }, {} as Record<string, { donations: number; expenses: number; rentIncome: number }>);

    const headers = [
      getTranslation("reports.month", language),
      getTranslation("reports.donations", language),
      language === "mr" ? "भाडे उत्पन्न" : "Rent Income",
      getTranslation("reports.expenses", language),
      "Net",
    ];

    const monthlyTableData = Object.entries(monthlyData).map(
      ([month, data]) => [
        month.length > 15 ? month.substring(0, 15) + "..." : month,
        `₹${data.donations.toLocaleString()}`,
        `₹${data.rentIncome.toLocaleString()}`,
        `₹${data.expenses.toLocaleString()}`,
        `₹${(
          data.donations +
          data.rentIncome -
          data.expenses
        ).toLocaleString()}`,
      ]
    );

    drawTable(doc, startY, headers, monthlyTableData, {
      columnWidths: [50, 30, 30, 30, 30],
      tableWidth: 170,
      fontSize: 10,
      cellPadding: 3,
    });
  };

  // Handle export
  const handleExport = async () => {
    setExporting(true);

    try {
      const filtered = getFilteredTransactions();
      const timestamp = new Date().toISOString().split("T")[0];

      if (exportFilters.exportFormat === "pdf") {
        const doc = generatePDF(
          exportFilters.exportType,
          exportFilters.pdfLanguage as "en" | "mr"
        );
        const filename = `${exportFilters.exportType}_${
          exportFilters.pdfLanguage === "mr" ? "marathi" : "english"
        }_${timestamp}.pdf`;
        doc.save(filename);
        toast.success(t("reports.exportSuccess"));
      } else {
        // CSV export with enhanced filtering
        let csvContent = "";
        let filename = "";

        switch (exportFilters.exportType) {
          case "transactions": {
            const headers = [
              "Date",
              "Type",
              "Category",
              "SubCategory",
              "Description",
              "Amount",
            ];
            const data = filtered.map((t) => ({
              Date: t.date,
              Type: t.type,
              Category: t.category,
              SubCategory: t.subCategory || "",
              Description: t.description,
              Amount: t.amount,
            }));
            csvContent = convertToCSV(data, headers);
            filename = `transactions_filtered_${timestamp}.csv`;
            break;
          }

          case "summary": {
            const donations = filtered.filter((t) => t.type === "Donation");
            const expenses = filtered.filter(
              (t) =>
                t.type === "Expense" ||
                t.type === "Utilities" ||
                t.type === "Salary"
            );
            const rentIncomes = filtered.filter((t) => t.type === "RentIncome");

            const totalDonations = donations.reduce(
              (sum, d) => sum + d.amount,
              0
            );
            const totalExpenses = expenses.reduce(
              (sum, e) => sum + e.amount,
              0
            );
            const totalRentIncome = rentIncomes.reduce(
              (sum, r) => sum + r.amount,
              0
            );
            const netBalance = totalDonations + totalRentIncome - totalExpenses;

            const headers = ["Metric", "Amount"];
            const data = [
              { Metric: t("dashboard.totalDonations"), Amount: totalDonations },
              {
                Metric: t("dashboard.totalRentIncome"),
                Amount: totalRentIncome,
              },
              { Metric: t("dashboard.totalExpenses"), Amount: totalExpenses },
              { Metric: t("dashboard.netBalance"), Amount: netBalance },
            ];
            csvContent = convertToCSV(data, headers);
            filename = `financial_summary_filtered_${timestamp}.csv`;
            break;
          }

          case "categoryBreakdown": {
            const donations = filtered.filter((t) => t.type === "Donation");
            const expenses = filtered.filter(
              (t) =>
                t.type === "Expense" ||
                t.type === "Utilities" ||
                t.type === "Salary"
            );

            const categoryWiseIncome = donations.reduce((acc, d) => {
              acc[d.category] = (acc[d.category] || 0) + d.amount;
              return acc;
            }, {} as Record<string, number>);

            const categoryWiseExpenses = expenses.reduce((acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + e.amount;
              return acc;
            }, {} as Record<string, number>);

            const headers = ["Category", "Type", "Amount"];
            const data = [
              ...Object.entries(categoryWiseIncome).map(
                ([category, amount]) => ({
                  Category: category,
                  Type: t("reports.donations"),
                  Amount: amount,
                })
              ),
              ...Object.entries(categoryWiseExpenses).map(
                ([category, amount]) => ({
                  Category: category,
                  Type: t("reports.expenses"),
                  Amount: amount,
                })
              ),
            ];
            csvContent = convertToCSV(data, headers);
            filename = `category_breakdown_filtered_${timestamp}.csv`;
            break;
          }

          case "monthly": {
            const monthlyData = filtered.reduce((acc, t) => {
              const month = new Date(t.date).toLocaleString("default", {
                month: "long",
                year: "numeric",
              });
              if (!acc[month]) {
                acc[month] = { donations: 0, expenses: 0, rentIncome: 0 };
              }
              if (t.type === "Donation") {
                acc[month].donations += t.amount;
              } else if (t.type === "RentIncome") {
                acc[month].rentIncome += t.amount;
              } else {
                acc[month].expenses += t.amount;
              }
              return acc;
            }, {} as Record<string, { donations: number; expenses: number; rentIncome: number }>);

            const headers = [
              "Month",
              "Donations",
              "RentIncome",
              "Expenses",
              "Net",
            ];
            const data = Object.entries(monthlyData).map(([month, data]) => ({
              Month: month,
              Donations: data.donations,
              RentIncome: data.rentIncome,
              Expenses: data.expenses,
              Net: data.donations + data.rentIncome - data.expenses,
            }));
            csvContent = convertToCSV(data, headers);
            filename = `monthly_analysis_filtered_${timestamp}.csv`;
            break;
          }
        }

        downloadCSV(csvContent, filename);
        toast.success(t("reports.exportSuccess"));
      }

      setExportDialog(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("reports.exportError"));
    } finally {
      setExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else {
      toast.error(t("reports.invalidFormat"));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Parse CSV content
  const parseCSV = (csvContent: string): Transaction[] => {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("Invalid CSV format");
    }

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim());
    const requiredHeaders = [
      "date",
      "type",
      "category",
      "description",
      "amount",
    ];

    // Check if all required headers are present
    const hasAllHeaders = requiredHeaders.every((required) =>
      headers.some((header) => header.includes(required))
    );

    if (!hasAllHeaders) {
      throw new Error("Missing required columns");
    }

    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"(.*)"$/, "$1"));

      if (values.length < 5) continue; // Skip incomplete rows

      const dateIndex = headers.findIndex((h) => h.includes("date"));
      const typeIndex = headers.findIndex((h) => h.includes("type"));
      const categoryIndex = headers.findIndex((h) => h.includes("category"));
      const descriptionIndex = headers.findIndex((h) =>
        h.includes("description")
      );
      const amountIndex = headers.findIndex((h) => h.includes("amount"));

      const date = values[dateIndex];
      const type = values[typeIndex] as Transaction["type"];
      const category = values[categoryIndex];
      const description = values[descriptionIndex];
      const amount = parseFloat(values[amountIndex]);

      // Validate data
      if (!date || !type || !category || !description || isNaN(amount)) {
        continue; // Skip invalid rows
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        continue; // Skip invalid date format
      }

      // Validate transaction type
      const validTypes = [
        "Donation",
        "Expense",
        "Utilities",
        "Salary",
        "RentIncome",
      ];
      if (!validTypes.includes(type)) {
        continue; // Skip invalid transaction type
      }

      transactions.push({
        id: `import_${Date.now()}_${i}`,
        date,
        type,
        category,
        description,
        amount,
      });
    }

    return transactions;
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile || !onImportTransactions) return;

    setImporting(true);

    try {
      const fileContent = await selectedFile.text();
      const importedTransactions = parseCSV(fileContent);

      if (importedTransactions.length === 0) {
        throw new Error("No valid transactions found");
      }

      onImportTransactions(importedTransactions);
      toast.success(
        `${t("reports.importSuccess")} (${importedTransactions.length} ${t(
          "reports.totalTransactions"
        ).toLowerCase()})`
      );
      setImportDialog(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(t("reports.importError"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white">{t("reports.title")}</h1>
        <div className="flex gap-2">
          {/* Enhanced Export Dialog */}
          <Dialog open={exportDialog} onOpenChange={setExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white">
                <Download className="h-4 w-4 mr-2" />
                {t("reports.export")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("reports.exportData")}</DialogTitle>
                <DialogDescription>
                  Choose what data to export and apply advanced filters.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Export Format and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Export Format</Label>
                    <Select
                      value={exportFilters.exportFormat}
                      onValueChange={(value) =>
                        handleExportFilterChange("exportFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t("reports.exportTransactions")}</Label>
                    <Select
                      value={exportFilters.exportType}
                      onValueChange={(value) =>
                        handleExportFilterChange("exportType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactions">
                          {t("reports.exportTransactions")}
                        </SelectItem>
                        <SelectItem value="summary">
                          {t("reports.exportSummary")}
                        </SelectItem>
                        <SelectItem value="categoryBreakdown">
                          {t("reports.exportCategorySummary")}
                        </SelectItem>
                        <SelectItem value="monthly">
                          {t("reports.monthlyTrend")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {exportFilters.exportFormat === "pdf" && (
                  <div>
                    <Label>{t("reports.pdfLanguage")}</Label>
                    <Select
                      value={exportFilters.pdfLanguage}
                      onValueChange={(value) =>
                        handleExportFilterChange("pdfLanguage", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">
                          {t("reports.englishPDF")}
                        </SelectItem>
                        <SelectItem value="mr">
                          {t("reports.marathiPDF")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Advanced Filters Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm">
                      {t("reports.filters")}
                    </h4>
                    {hasActiveExportFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearExportFilters}
                        className="text-red-600 hover:text-red-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        {t("reports.clearFilters")}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Transaction Type Filter */}
                    <div>
                      <Label>{t("reports.filterByType")}</Label>
                      <Select
                        value={exportFilters.transactionType}
                        onValueChange={(value) =>
                          handleExportFilterChange("transactionType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("reports.allTypes")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("reports.allTypes")}
                          </SelectItem>
                          <SelectItem value="donations">
                            {t("reports.donations")}
                          </SelectItem>
                          <SelectItem value="expenses">
                            {t("reports.expenses")}
                          </SelectItem>
                          <SelectItem value="rentIncome">
                            Rent Income
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <Label>{t("reports.filterByCategory")}</Label>
                      <Select
                        value={exportFilters.category}
                        onValueChange={(value) =>
                          handleExportFilterChange("category", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("reports.allCategories")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("reports.allCategories")}
                          </SelectItem>
                          {getExportUniqueCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sub-Category Filter */}
                    <div>
                      <Label>{t("reports.filterBySubCategory")}</Label>
                      <Select
                        value={exportFilters.subCategory}
                        onValueChange={(value) =>
                          handleExportFilterChange("subCategory", value)
                        }
                        disabled={exportFilters.category === "all"}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("reports.allSubCategories")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("reports.allSubCategories")}
                          </SelectItem>
                          {getExportUniqueSubCategories.map((subCategory) => (
                            <SelectItem key={subCategory} value={subCategory}>
                              {subCategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Filter Type */}
                    <div>
                      <Label>Date Filter</Label>
                      <Select
                        value={exportFilters.dateFilterType}
                        onValueChange={(value) =>
                          handleExportFilterChange("dateFilterType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="month">
                            {t("reports.filterByMonth")}
                          </SelectItem>
                          <SelectItem value="range">
                            {t("reports.filterByDateRange")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Month Filter */}
                  {exportFilters.dateFilterType === "month" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>{t("reports.selectMonth")}</Label>
                        <Select
                          value={exportFilters.month}
                          onValueChange={(value) =>
                            handleExportFilterChange("month", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("reports.selectMonth")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => {
                              const month = i + 1;
                              const monthName = new Date(
                                2024,
                                i,
                                1
                              ).toLocaleString("default", { month: "long" });
                              return (
                                <SelectItem
                                  key={month}
                                  value={month.toString()}
                                >
                                  {monthName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("reports.selectYear")}</Label>
                        <Select
                          value={exportFilters.year}
                          onValueChange={(value) =>
                            handleExportFilterChange("year", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("reports.selectYear")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {getUniqueYears.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Date Range Filter */}
                  {exportFilters.dateFilterType === "range" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>{t("reports.fromDate")}</Label>
                        <Input
                          type="date"
                          value={exportFilters.fromDate}
                          onChange={(e) =>
                            handleExportFilterChange("fromDate", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>{t("reports.toDate")}</Label>
                        <Input
                          type="date"
                          value={exportFilters.toDate}
                          onChange={(e) =>
                            handleExportFilterChange("toDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Active Export Filters Display */}
                  {hasActiveExportFilters && (
                    <div className="pt-2 border-t mt-4">
                      <div className="flex flex-wrap gap-2">
                        {exportFilters.transactionType !== "all" && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            Type: {exportFilters.transactionType}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() =>
                                handleExportFilterChange(
                                  "transactionType",
                                  "all"
                                )
                              }
                            />
                          </Badge>
                        )}
                        {exportFilters.category !== "all" && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            Category: {exportFilters.category}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() =>
                                handleExportFilterChange("category", "all")
                              }
                            />
                          </Badge>
                        )}
                        {exportFilters.subCategory !== "all" && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            Sub-Category: {exportFilters.subCategory}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() =>
                                handleExportFilterChange("subCategory", "all")
                              }
                            />
                          </Badge>
                        )}
                        {exportFilters.dateFilterType === "month" &&
                          exportFilters.month &&
                          exportFilters.year && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              Month:{" "}
                              {new Date(
                                parseInt(exportFilters.year),
                                parseInt(exportFilters.month) - 1,
                                1
                              ).toLocaleString("default", {
                                month: "long",
                                year: "numeric",
                              })}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  handleExportFilterChange("month", "");
                                  handleExportFilterChange("year", "");
                                }}
                              />
                            </Badge>
                          )}
                        {exportFilters.dateFilterType === "range" &&
                          (exportFilters.fromDate || exportFilters.toDate) && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              Date Range: {exportFilters.fromDate || "Start"} to{" "}
                              {exportFilters.toDate || "End"}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  handleExportFilterChange("fromDate", "");
                                  handleExportFilterChange("toDate", "");
                                }}
                              />
                            </Badge>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Summary */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-600">
                    Records to export: {getFilteredTransactions().length}
                  </div>
                  {hasActiveExportFilters && (
                    <div className="text-xs text-blue-600 mt-1">
                      Filters applied - results will be limited to matching
                      records
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full"
                >
                  {exporting ? t("reports.generating") : t("reports.export")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Import Dialog */}
          {onImportTransactions && (
            <Dialog open={importDialog} onOpenChange={setImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("reports.import")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("reports.importData")}</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with transaction data.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>{t("reports.selectFile")}</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {selectedFile && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t("reports.fileSelected")}: {selectedFile.name}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div>{t("reports.fileFormat")}:</div>
                        <div className="text-xs">{t("reports.csvFormat")}</div>
                        <div className="text-xs">
                          {t("reports.sampleFormat")}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || importing}
                    className="w-full"
                  >
                    {importing
                      ? t("reports.processingImport")
                      : t("reports.import")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("reports.filters")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {t("reports.clearFilters")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Transaction Type Filter */}
              <div>
                <Label>{t("reports.filterByType")}</Label>
                <Select
                  value={filters.transactionType}
                  onValueChange={(value) =>
                    handleFilterChange("transactionType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reports.allTypes")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("reports.allTypes")}</SelectItem>
                    <SelectItem value="donations">
                      {t("reports.donations")}
                    </SelectItem>
                    <SelectItem value="expenses">
                      {t("reports.expenses")}
                    </SelectItem>
                    <SelectItem value="rentIncome">Rent Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Label>{t("reports.filterByCategory")}</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    handleFilterChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reports.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("reports.allCategories")}
                    </SelectItem>
                    {getUniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub-Category Filter */}
              <div>
                <Label>{t("reports.filterBySubCategory")}</Label>
                <Select
                  value={filters.subCategory}
                  onValueChange={(value) =>
                    handleFilterChange("subCategory", value)
                  }
                  disabled={filters.category === "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reports.allSubCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("reports.allSubCategories")}
                    </SelectItem>
                    {getUniqueSubCategories.map((subCategory) => (
                      <SelectItem key={subCategory} value={subCategory}>
                        {subCategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter Type */}
              <div>
                <Label>Date Filter</Label>
                <Select
                  value={filters.dateFilterType}
                  onValueChange={(value) =>
                    handleFilterChange("dateFilterType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="month">
                      {t("reports.filterByMonth")}
                    </SelectItem>
                    <SelectItem value="range">
                      {t("reports.filterByDateRange")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Month Filter */}
            {filters.dateFilterType === "month" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("reports.selectMonth")}</Label>
                  <Select
                    value={filters.month}
                    onValueChange={(value) =>
                      handleFilterChange("month", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("reports.selectMonth")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        const monthName = new Date(2024, i, 1).toLocaleString(
                          "default",
                          { month: "long" }
                        );
                        return (
                          <SelectItem key={month} value={month.toString()}>
                            {monthName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("reports.selectYear")}</Label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => handleFilterChange("year", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("reports.selectYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Date Range Filter */}
            {filters.dateFilterType === "range" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("reports.fromDate")}</Label>
                  <Input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) =>
                      handleFilterChange("fromDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>{t("reports.toDate")}</Label>
                  <Input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) =>
                      handleFilterChange("toDate", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                <div className="flex flex-wrap gap-2">
                  {filters.transactionType !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Type: {filters.transactionType}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          handleFilterChange("transactionType", "all")
                        }
                      />
                    </Badge>
                  )}
                  {filters.category !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Category: {filters.category}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange("category", "all")}
                      />
                    </Badge>
                  )}
                  {filters.subCategory !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Sub-Category: {filters.subCategory}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange("subCategory", "all")}
                      />
                    </Badge>
                  )}
                  {filters.dateFilterType === "month" &&
                    filters.month &&
                    filters.year && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        Month:{" "}
                        {new Date(
                          parseInt(filters.year),
                          parseInt(filters.month) - 1,
                          1
                        ).toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            handleFilterChange("month", "");
                            handleFilterChange("year", "");
                          }}
                        />
                      </Badge>
                    )}
                  {filters.dateFilterType === "range" &&
                    (filters.fromDate || filters.toDate) && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        Date Range: {filters.fromDate || "Start"} to{" "}
                        {filters.toDate || "End"}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            handleFilterChange("fromDate", "");
                            handleFilterChange("toDate", "");
                          }}
                        />
                      </Badge>
                    )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="filtered" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("reports.filteredResults")}
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t("reports.overview")}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Label className="text-sm">{t("reports.viewMode")}:</Label>
            <Select
              value={viewMode}
              onValueChange={(value: "table" | "summary") => setViewMode(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">{t("reports.tableView")}</SelectItem>
                <SelectItem value="summary">
                  {t("reports.summaryView")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="filtered" className="space-y-4">
          {/* Results Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {hasActiveFilters
                    ? t("reports.showingResults", {
                        count: filteredTransactions.length,
                        total: transactions.length,
                      })
                        .replace(
                          "{count}",
                          filteredTransactions.length.toString()
                        )
                        .replace("{total}", transactions.length.toString())
                    : `Showing all ${transactions.length} transactions`}
                </div>
                <div className="text-sm font-medium">
                  Total:{" "}
                  {formatCurrency(
                    filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {viewMode === "table" ? (
            /* Transaction Table */
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("reports.noTransactionsFound")}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("common.date")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("common.type")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("donations.category")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("common.description")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("common.amount")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={
                                  transaction.type === "Donation"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.type === "RentIncome"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.category}
                              {transaction.subCategory && (
                                <div className="text-xs text-gray-500">
                                  {transaction.subCategory}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div
                                className="max-w-xs truncate"
                                title={transaction.description}
                              >
                                {transaction.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Summary View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summaryStats.totalDonations)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {
                      filteredTransactions.filter((t) => t.type === "Donation")
                        .length
                    }{" "}
                    transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summaryStats.totalExpenses)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {
                      filteredTransactions.filter((t) =>
                        ["Expense", "Utilities", "Salary"].includes(t.type)
                      ).length
                    }{" "}
                    transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rent Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summaryStats.totalRentIncome)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {
                      filteredTransactions.filter(
                        (t) => t.type === "RentIncome"
                      ).length
                    }{" "}
                    transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      summaryStats.netBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summaryStats.netBalance)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {summaryStats.transactionCount} total transactions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(summaryStats.categoryWiseIncome).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No income data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(summaryStats.categoryWiseIncome)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div
                          key={category}
                          className="flex justify-between items-center p-2 bg-green-50 rounded"
                        >
                          <span className="text-sm font-medium">
                            {category}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(summaryStats.categoryWiseExpenses).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No expense data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(summaryStats.categoryWiseExpenses)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div
                          key={category}
                          className="flex justify-between items-center p-2 bg-red-50 rounded"
                        >
                          <span className="text-sm font-medium">
                            {category}
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(summaryStats.monthlyData).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No monthly data available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Donations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rent Income
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expenses
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(summaryStats.monthlyData)
                        .sort(
                          ([a], [b]) =>
                            new Date(a).getTime() - new Date(b).getTime()
                        )
                        .map(([month, data]) => {
                          const net =
                            data.donations + data.rentIncome - data.expenses;
                          return (
                            <tr key={month} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {month}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {formatCurrency(data.donations)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                {formatCurrency(data.rentIncome)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {formatCurrency(data.expenses)}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                  net >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {formatCurrency(net)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
