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
  ReceiptCounters 
} from "./src/types";

interface User {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Treasurer" | "Viewer";
  status: "Active" | "Inactive";
  createdAt: string;
  lastLogin?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  base64: string;
  uploadedAt: string;
  compressedSize?: number;
}

interface Shop {
  id: string;
  shopNumber: string;
  size: number;
  monthlyRent: number;
  deposit: number;
  status: "Vacant" | "Occupied" | "Maintenance";
  tenantId?: string;
  agreementId?: string;
  createdAt: string;
  description?: string;
}

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  createdAt: string;
  status: "Active" | "Inactive";
  idProof?: string;
}

interface Agreement {
  id: string;
  shopId: string;
  tenantId: string;
  agreementDate: string;
  duration: number;
  monthlyRent: number;
  securityDeposit: number;
  advanceRent: number;
  agreementType: "Residential" | "Commercial";
  status: "Active" | "Expired" | "Terminated";
  nextDueDate: string;
  lastPaymentDate?: string;
  hasActiveLoan?: boolean;
  activeLoanId?: string;
  pendingPenalties?: string[];
  agreementDocument?: UploadedFile[];
  createdAt: string;
}

interface Loan {
  id: string;
  tenantId: string;
  tenantName: string;
  agreementId: string;
  loanAmount: number;
  interestRate: number;
  disbursedDate: string;
  loanDuration: number;
  monthlyEmi: number;
  outstandingBalance: number;
  totalRepaid: number;
  status: "Active" | "Completed" | "Defaulted";
  nextEmiDate: string;
  lastPaymentDate?: string;
  createdAt: string;
  loanDocuments?: UploadedFile[];
}

interface RentPenalty {
  id: string;
  agreementId: string;
  tenantName: string;
  rentAmount: number;
  dueDate: string;
  paidDate?: string;
  penaltyRate: number;
  penaltyAmount: number;
  penaltyPaid: boolean;
  penaltyPaidDate?: string;
  status: "Pending" | "Paid";
  createdAt: string;
}

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
  receiptImages?: UploadedFile[];
  supportingDocuments?: UploadedFile[];
}

interface ReceiptCounters {
  donations: number;
  rentIncome: number;
}

// Demo users
const initialUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@mandir.org",
    role: "Admin",
    status: "Active",
    createdAt: "2024-01-01",
    lastLogin: "2024-04-10",
  },
  {
    id: "2",
    username: "treasurer",
    email: "treasurer@mandir.org",
    role: "Treasurer",
    status: "Active",
    createdAt: "2024-01-15",
    lastLogin: "2024-04-09",
  },
  {
    id: "3",
    username: "viewer",
    email: "viewer@mandir.org",
    role: "Viewer",
    status: "Active",
    createdAt: "2024-02-01",
    lastLogin: "2024-04-08",
  },
];

// Demo credentials
const demoCredentials = {
  admin: "admin123",
  treasurer: "treasurer123",
  viewer: "viewer123",
};

// Initial sample shops
const initialShops: Shop[] = [
  {
    id: "1",
    shopNumber: "A-001",
    size: 200,
    monthlyRent: 5000,
    deposit: 15000,
    status: "Occupied",
    tenantId: "1",
    agreementId: "1",
    createdAt: "2024-01-01",
    description: "Corner shop with good visibility",
  },
  {
    id: "2",
    shopNumber: "A-002",
    size: 150,
    monthlyRent: 4000,
    deposit: 12000,
    status: "Vacant",
    createdAt: "2024-01-01",
    description: "Small shop suitable for retail",
  },
  {
    id: "3",
    shopNumber: "A-003",
    size: 300,
    monthlyRent: 7000,
    deposit: 21000,
    status: "Occupied",
    tenantId: "2",
    agreementId: "2",
    createdAt: "2024-01-01",
    description: "Large shop with storage space",
  },
];

// Initial sample tenants
const initialTenants: Tenant[] = [
  {
    id: "1",
    name: "राजेश शर्मा",
    phone: "9876543210",
    email: "rajesh.sharma@email.com",
    address: "123 Main Street, Kusalamb",
    businessType: "General Store",
    createdAt: "2024-01-15",
    status: "Active",
    idProof: "Aadhaar: 1234 5678 9012",
  },
  {
    id: "2",
    name: "प्रिया पाटेल",
    phone: "9876543211",
    email: "priya.patel@email.com",
    address: "456 Market Road, Kusalamb",
    businessType: "Clothing Store",
    createdAt: "2024-02-10",
    status: "Active",
    idProof: "PAN: ABCDE1234F",
  },
];

// Initial sample agreements
const initialAgreements: Agreement[] = [
  {
    id: "1",
    shopId: "1",
    tenantId: "1",
    agreementDate: "2024-01-15",
    duration: 12,
    monthlyRent: 5000,
    securityDeposit: 10000,
    advanceRent: 5000,
    agreementType: "Commercial",
    status: "Active",
    nextDueDate: "2024-05-15",
    lastPaymentDate: "2024-04-15",
    hasActiveLoan: true,
    activeLoanId: "1",
    pendingPenalties: ["1"],
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    shopId: "3",
    tenantId: "2",
    agreementDate: "2024-02-10",
    duration: 24,
    monthlyRent: 7000,
    securityDeposit: 14000,
    advanceRent: 7000,
    agreementType: "Commercial",
    status: "Active",
    nextDueDate: "2024-05-10",
    lastPaymentDate: "2024-04-10",
    createdAt: "2024-02-10",
  },
];

// Initial sample transactions with separate receipt numbering
const initialTransactions: Transaction[] = [
  {
    id: "1",
    date: "2024-04-05",
    type: "Donation",
    category: "Dengi",
    subCategory: "Itar",
    description: "General donation",
    amount: 15000,
    receiptNumber: "DON001",
    donorName: "राम शर्मा",
  },
  {
    id: "2",
    date: "2024-04-04",
    type: "Expense",
    category: "Mandir Dekhbhal",
    subCategory: "pooja",
    description: "Daily pooja expenses",
    amount: 10000,
    payeeName: "पंडित राम शास्त्री",
    payeeContact: "9876543212",
  },
  {
    id: "3",
    date: "2024-04-03",
    type: "Utilities",
    category: "Utilities",
    description: "Electricity bill",
    amount: 3500,
  },
  {
    id: "4",
    date: "2024-04-02",
    type: "Salary",
    category: "Salary",
    description: "Staff salary",
    amount: 9000,
  },
  {
    id: "5",
    date: "2024-04-01",
    type: "Donation",
    category: "Shaskiy Nidhi",
    subCategory: "Rajya Shashan",
    description: "State government grant",
    amount: 200000,
    receiptNumber: "DON002",
    donorName: "महाराष्ट्र सरकार",
  },
  {
    id: "6",
    date: "2024-04-01",
    type: "Donation",
    category: "Vargani",
    subCategory: "Ganesh Utsav",
    description: "Festival collection for Ganesh Utsav",
    amount: 15000,
    receiptNumber: "DON003",
    donorName: "मोहन पाटील",
    familyMembers: 5,
    amountPerPerson: 3000,
  },
  {
    id: "7",
    date: "2024-04-01",
    type: "Donation",
    category: "Vargani",
    subCategory: "Diwali",
    description: "Diwali festival collection",
    amount: 12000,
    receiptNumber: "DON004",
    donorName: "सुनीता देशमुख",
    familyMembers: 4,
    amountPerPerson: 3000,
  },
  {
    id: "8",
    date: "2024-04-01",
    type: "RentIncome",
    category: "Bhade Jama",
    subCategory: "bhade1Jama",
    description: "Monthly rent - Shop A-001",
    amount: 5000,
    receiptNumber: "RENT001",
    tenantName: "राजेश शर्मा",
    tenantContact: "9876543210",
    agreementId: "1",
    shopNumber: "A-001",
  },
  {
    id: "10",
    date: "2024-03-25",
    type: "Donation",
    category: "Dengi",
    subCategory: "Bandkam",
    description: "Construction donation",
    amount: 25000,
    receiptNumber: "DON005",
    donorName: "विकास जोशी",
  },
  {
    id: "11",
    date: "2024-03-20",
    type: "Expense",
    category: "Utsav",
    subCategory: "ganeshUtsav",
    description: "Ganesh festival celebration expenses",
    amount: 15000,
    payeeName: "गणेश उत्सव मंडळ",
    payeeContact: "9876543213",
  },
  {
    id: "12",
    date: "2024-03-15",
    type: "Expense",
    category: "Mandir Dekhbhal",
    subCategory: "bijliBill",
    description: "Monthly electricity bill",
    amount: 8500,
    payeeName: "महावितरण कंपनी",
    payeeContact: "1912",
  },
  {
    id: "13",
    date: "2024-03-10",
    type: "Expense",
    category: "Gala Kharch",
    subCategory: "safayi",
    description: "Shop cleaning expenses",
    amount: 2500,
    payeeName: "स्वच्छता सेवा",
    payeeContact: "9876543214",
  },
  {
    id: "14",
    date: "2024-03-05",
    type: "Expense",
    category: "Mandir Dekhbhal",
    subCategory: "soundLightMaintenance",
    description: "Sound system maintenance",
    amount: 5500,
    payeeName: "ऑडिओ टेक सर्व्हिसेस",
    payeeContact: "9876543215",
  },
];

// Initial sample loans
const initialLoans: Loan[] = [
  {
    id: "1",
    tenantId: "1",
    tenantName: "राजेश शर्मा",
    agreementId: "1",
    loanAmount: 50000,
    interestRate: 1,
    disbursedDate: "2024-01-15",
    loanDuration: 12,
    monthlyEmi: 4585,
    outstandingBalance: 41415,
    totalRepaid: 8585,
    status: "Active",
    nextEmiDate: "2024-04-15",
    lastPaymentDate: "2024-03-15",
    createdAt: "2024-01-15",
  },
];

// Initial sample penalties
const initialPenalties: RentPenalty[] = [
  {
    id: "1",
    agreementId: "1",
    tenantName: "राजेश शर्मा",
    rentAmount: 5000,
    dueDate: "2024-03-01",
    paidDate: "2024-03-05",
    penaltyRate: 1,
    penaltyAmount: 50,
    penaltyPaid: false,
    status: "Pending",
    createdAt: "2024-03-02",
  },
];

// Document storage utility functions
const saveDocuments = (key: string, documents: UploadedFile[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(documents));
  } catch (error) {
    console.error("Error saving documents:", error);
    toast.error("Failed to save documents. Storage may be full.");
  }
};

const loadDocuments = (key: string): UploadedFile[] => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading documents:", error);
    return [];
  }
};

function AppContent() {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [users, setUsers] = useState(initialUsers);
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [penalties, setPenalties] = useState<RentPenalty[]>(initialPenalties);
  const [loginError, setLoginError] = useState("");

  // Separate receipt counters for different transaction types
  const [receiptCounters, setReceiptCounters] = useState<ReceiptCounters>(
    () => {
      const getHighestReceiptNumber = (prefix: string) => {
        const relevantTransactions = initialTransactions.filter(
          (t) => t.receiptNumber && t.receiptNumber.startsWith(prefix)
        );

        if (relevantTransactions.length === 0) return 0;

        const numbers = relevantTransactions
          .map((t) => t.receiptNumber!)
          .map((receipt) => {
            const match = receipt.match(new RegExp(`${prefix}(\\d+)`));
            return match ? parseInt(match[1]) : 0;
          })
          .sort((a, b) => b - a);

        return numbers[0] || 0;
      };

      return {
        donations: getHighestReceiptNumber("DON"),
        rentIncome: getHighestReceiptNumber("RENT"),
      };
    }
  );

  // Check for saved session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedCounters = localStorage.getItem("receiptCounters");
    const savedShops = localStorage.getItem("shops");
    const savedTenants = localStorage.getItem("tenants");
    const savedAgreements = localStorage.getItem("agreements");
    const savedLoans = localStorage.getItem("loans");
    const savedPenalties = localStorage.getItem("penalties");

    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }

    if (savedCounters) {
      setReceiptCounters(JSON.parse(savedCounters));
    }

    if (savedShops) {
      setShops(JSON.parse(savedShops));
    }

    if (savedTenants) {
      setTenants(JSON.parse(savedTenants));
    }

    if (savedAgreements) {
      setAgreements(JSON.parse(savedAgreements));
    }

    if (savedLoans) {
      setLoans(JSON.parse(savedLoans));
    }

    if (savedPenalties) {
      setPenalties(JSON.parse(savedPenalties));
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("receiptCounters", JSON.stringify(receiptCounters));
  }, [receiptCounters]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("shops", JSON.stringify(shops));
  }, [shops]);

  useEffect(() => {
    localStorage.setItem("tenants", JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem("agreements", JSON.stringify(agreements));
  }, [agreements]);

  useEffect(() => {
    localStorage.setItem("loans", JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem("penalties", JSON.stringify(penalties));
  }, [penalties]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem("transactions");
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions);
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error("Error loading transactions:", error);
      }
    }
  }, []);

  // Generate next receipt number functions
  const generateDonationReceiptNumber = (): string => {
    const nextNumber = receiptCounters.donations + 1;
    return `DON${nextNumber.toString().padStart(3, "0")}`;
  };

  const generateRentReceiptNumber = (): string => {
    const nextNumber = receiptCounters.rentIncome + 1;
    return `RENT${nextNumber.toString().padStart(3, "0")}`;
  };

  // Update receipt counters
  const incrementDonationCounter = () => {
    setReceiptCounters((prev) => ({
      ...prev,
      donations: prev.donations + 1,
    }));
  };

  const incrementRentCounter = () => {
    setReceiptCounters((prev) => ({
      ...prev,
      rentIncome: prev.rentIncome + 1,
    }));
  };

  // Shop management functions
  const handleAddShop = (shopData: Omit<Shop, "id" | "createdAt">) => {
    if (currentUser?.role === "Viewer") return;

    const newShop: Shop = {
      ...shopData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: "Vacant",
    };

    setShops((prev) => [...prev, newShop]);
    toast.success(t("rent.shopAdded") || "Shop added successfully");
  };

  const handleUpdateShop = (shopId: string, updates: Partial<Shop>) => {
    if (currentUser?.role === "Viewer") return;

    setShops((prev) =>
      prev.map((shop) => (shop.id === shopId ? { ...shop, ...updates } : shop))
    );
    toast.success(t("rent.shopUpdated") || "Shop updated successfully");
  };

  const handleDeleteShop = (shopId: string) => {
    if (currentUser?.role === "Viewer") return;

    // Check if shop is occupied
    const shop = shops.find((s) => s.id === shopId);
    if (shop && shop.status === "Occupied") {
      toast.error(
        t("rent.cannotDeleteOccupiedShop") || "Cannot delete occupied shop"
      );
      return;
    }

    setShops((prev) => prev.filter((shop) => shop.id !== shopId));
    toast.success(t("rent.shopDeleted") || "Shop deleted successfully");
  };

  // Tenant management functions
  const handleAddTenant = (tenantData: Omit<Tenant, "id" | "createdAt">) => {
    if (currentUser?.role === "Viewer") return;

    const newTenant: Tenant = {
      ...tenantData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: "Active",
    };

    setTenants((prev) => [...prev, newTenant]);
    toast.success(t("rent.tenantAdded") || "Tenant added successfully");
  };

  const handleUpdateTenant = (tenantId: string, updates: Partial<Tenant>) => {
    if (currentUser?.role === "Viewer") return;

    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, ...updates } : tenant
      )
    );
    toast.success(t("rent.tenantUpdated") || "Tenant updated successfully");
  };

  const handleDeleteTenant = (tenantId: string) => {
    if (currentUser?.role === "Viewer") return;

    // Check if tenant has active agreements
    const activeAgreements = agreements.filter(
      (a) => a.tenantId === tenantId && a.status === "Active"
    );
    if (activeAgreements.length > 0) {
      toast.error(
        t("rent.cannotDeleteTenantWithActiveAgreements") ||
          "Cannot delete tenant with active agreements"
      );
      return;
    }

    setTenants((prev) => prev.filter((tenant) => tenant.id !== tenantId));
    toast.success(t("rent.tenantDeleted") || "Tenant deleted successfully");
  };

  // Agreement management functions
  const handleCreateAgreement = (
    agreementData: Omit<Agreement, "id" | "createdAt" | "nextDueDate">
  ) => {
    if (currentUser?.role === "Viewer") return;

    // Calculate next due date (1 month from agreement date)
    const nextDueDate = new Date(agreementData.agreementDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const newAgreement: Agreement = {
      ...agreementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      nextDueDate: nextDueDate.toISOString().split("T")[0],
      status: "Active",
    };

    setAgreements((prev) => [...prev, newAgreement]);

    // Update shop status to occupied
    setShops((prev) =>
      prev.map((shop) =>
        shop.id === agreementData.shopId
          ? {
              ...shop,
              status: "Occupied",
              tenantId: agreementData.tenantId,
              agreementId: newAgreement.id,
            }
          : shop
      )
    );

    // Add deposit as income transaction if there are deposits
    const totalDeposit =
      agreementData.securityDeposit + agreementData.advanceRent;
    if (totalDeposit > 0) {
      const shop = shops.find((s) => s.id === agreementData.shopId);
      const tenant = tenants.find((t) => t.id === agreementData.tenantId);

      const depositTransaction: Transaction = {
        id: `deposit_${Date.now()}`,
        date: agreementData.agreementDate,
        type: "RentIncome",
        category: "Security Deposit",
        subCategory: "newAgreement",
        description: `Security deposit and advance rent for Shop ${shop?.shopNumber}`,
        amount: totalDeposit,
        receiptNumber: generateRentReceiptNumber(),
        tenantName: tenant?.name || "",
        tenantContact: tenant?.phone || "",
        agreementId: newAgreement.id,
        shopNumber: shop?.shopNumber || "",
      };

      setTransactions((prev) => [...prev, depositTransaction]);
      incrementRentCounter();
    }

    toast.success(
      t("rent.agreementCreated") || "Agreement created successfully"
    );
  };

  const handleUpdateAgreement = (
    agreementId: string,
    updates: Partial<Agreement>
  ) => {
    if (currentUser?.role === "Viewer") return;

    setAgreements((prev) =>
      prev.map((agreement) =>
        agreement.id === agreementId ? { ...agreement, ...updates } : agreement
      )
    );

    // If agreement is terminated, update shop status
    if (updates.status === "Terminated" || updates.status === "Expired") {
      const agreement = agreements.find((a) => a.id === agreementId);
      if (agreement) {
        setShops((prev) =>
          prev.map((shop) =>
            shop.id === agreement.shopId
              ? {
                  ...shop,
                  status: "Vacant",
                  tenantId: undefined,
                  agreementId: undefined,
                }
              : shop
          )
        );
      }
    }

    toast.success(
      t("rent.agreementUpdated") || "Agreement updated successfully"
    );
  };

  // Loan management functions
  const handleAddLoan = (loanData: Omit<Loan, "id" | "createdAt">) => {
    if (currentUser?.role === "Viewer") return;

    const newLoan: Loan = {
      ...loanData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setLoans((prev) => [...prev, newLoan]);

    // Update agreement to mark it has active loan
    setAgreements((prev) =>
      prev.map((agreement) =>
        agreement.id === loanData.agreementId
          ? { ...agreement, hasActiveLoan: true, activeLoanId: newLoan.id }
          : agreement
      )
    );

    // Save loan documents if any
    if (loanData.loanDocuments?.length) {
      saveDocuments(`loan_${newLoan.id}_documents`, loanData.loanDocuments);
    }

    toast.success(t("loans.successMessage") || "Loan added successfully");
  };

  const handleUpdateLoan = (loanId: string, updates: Partial<Loan>) => {
    if (currentUser?.role === "Viewer") return;

    setLoans((prev) =>
      prev.map((loan) => (loan.id === loanId ? { ...loan, ...updates } : loan))
    );

    // If loan is completed, update agreement
    if (updates.status === "Completed") {
      const loan = loans.find((l) => l.id === loanId);
      if (loan) {
        setAgreements((prev) =>
          prev.map((agreement) =>
            agreement.id === loan.agreementId
              ? { ...agreement, hasActiveLoan: false, activeLoanId: undefined }
              : agreement
          )
        );
      }
    }
  };

  // Penalty management functions
  const handleAddPenalty = (
    penaltyData: Omit<RentPenalty, "id" | "createdAt">
  ) => {
    if (currentUser?.role === "Viewer") return;

    const newPenalty: RentPenalty = {
      ...penaltyData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setPenalties((prev) => [...prev, newPenalty]);

    // Add penalty to agreement's pending penalties
    setAgreements((prev) =>
      prev.map((agreement) =>
        agreement.id === penaltyData.agreementId
          ? {
              ...agreement,
              pendingPenalties: [
                ...(agreement.pendingPenalties || []),
                newPenalty.id,
              ],
            }
          : agreement
      )
    );
  };

  const handleUpdatePenalty = (
    penaltyId: string,
    updates: Partial<RentPenalty>
  ) => {
    if (currentUser?.role === "Viewer") return;

    setPenalties((prev) =>
      prev.map((penalty) =>
        penalty.id === penaltyId ? { ...penalty, ...updates } : penalty
      )
    );

    // If penalty is paid, remove from agreement's pending penalties
    if (updates.status === "Paid") {
      const penalty = penalties.find((p) => p.id === penaltyId);
      if (penalty) {
        setAgreements((prev) =>
          prev.map((agreement) =>
            agreement.id === penalty.agreementId
              ? {
                  ...agreement,
                  pendingPenalties: (agreement.pendingPenalties || []).filter(
                    (id) => id !== penaltyId
                  ),
                }
              : agreement
          )
        );
      }
    }
  };

  // Enhanced rent collection function
  const handleRentCollection = (collectionData: {
    rentAmount?: number;
    emiAmount?: number;
    penaltyAmount?: number;
    loanId?: string;
    penaltyId?: string;
    agreementId: string;
    tenantName: string;
    tenantContact?: string;
    shopNumber?: string;
  }) => {
    if (currentUser?.role === "Viewer") return;

    const rentReceiptNumber = generateRentReceiptNumber();
    incrementRentCounter();

    // Create rent income transaction
    if (collectionData.rentAmount && collectionData.rentAmount > 0) {
      const rentTransaction: Transaction = {
        id: `rent_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: "RentIncome",
        category: "Bhade Jama",
        subCategory: "bhade1Jama",
        description: `Monthly rent - Shop ${collectionData.shopNumber}`,
        amount: collectionData.rentAmount,
        receiptNumber: rentReceiptNumber,
        tenantName: collectionData.tenantName,
        tenantContact: collectionData.tenantContact,
        agreementId: collectionData.agreementId,
        shopNumber: collectionData.shopNumber,
      };

      setTransactions((prev) => [...prev, rentTransaction]);

      // Update agreement's last payment date and next due date
      setAgreements((prev) =>
        prev.map((agreement) => {
          if (agreement.id === collectionData.agreementId) {
            const nextDueDate = new Date();
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            return {
              ...agreement,
              lastPaymentDate: new Date().toISOString().split("T")[0],
              nextDueDate: nextDueDate.toISOString().split("T")[0],
            };
          }
          return agreement;
        })
      );
    }

    // Create EMI payment transaction and update loan
    if (
      collectionData.emiAmount &&
      collectionData.emiAmount > 0 &&
      collectionData.loanId
    ) {
      const emiTransaction: Transaction = {
        id: `emi_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: "RentIncome",
        category: "Loan EMI",
        subCategory: "loanRepayment",
        description: `Loan EMI payment - ${collectionData.tenantName}`,
        amount: collectionData.emiAmount,
        receiptNumber: `${rentReceiptNumber}_EMI`,
        tenantName: collectionData.tenantName,
        loanId: collectionData.loanId,
        emiAmount: collectionData.emiAmount,
      };

      setTransactions((prev) => [...prev, emiTransaction]);

      // Update loan balance
      setLoans((prev) =>
        prev.map((loan) => {
          if (loan.id === collectionData.loanId) {
            const newOutstandingBalance =
              loan.outstandingBalance - collectionData.emiAmount!;
            const newTotalRepaid = loan.totalRepaid + collectionData.emiAmount!;
            const nextEmiDate = new Date();
            nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);

            return {
              ...loan,
              outstandingBalance: Math.max(0, newOutstandingBalance),
              totalRepaid: newTotalRepaid,
              lastPaymentDate: new Date().toISOString().split("T")[0],
              nextEmiDate: nextEmiDate.toISOString().split("T")[0],
              status: newOutstandingBalance <= 0 ? "Completed" : "Active",
            };
          }
          return loan;
        })
      );
    }

    // Create penalty payment transaction and update penalty
    if (
      collectionData.penaltyAmount &&
      collectionData.penaltyAmount > 0 &&
      collectionData.penaltyId
    ) {
      const penaltyTransaction: Transaction = {
        id: `penalty_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: "RentIncome",
        category: "Rent Penalty",
        subCategory: "penaltyPayment",
        description: `Rent penalty payment - ${collectionData.tenantName}`,
        amount: collectionData.penaltyAmount,
        receiptNumber: `${rentReceiptNumber}_PENALTY`,
        tenantName: collectionData.tenantName,
        penaltyId: collectionData.penaltyId,
        penaltyAmount: collectionData.penaltyAmount,
      };

      setTransactions((prev) => [...prev, penaltyTransaction]);

      // Update penalty status
      handleUpdatePenalty(collectionData.penaltyId, {
        penaltyPaid: true,
        penaltyPaidDate: new Date().toISOString().split("T")[0],
        status: "Paid",
      });
    }
  };

  // Authentication functions
  const handleLogin = (username: string, password: string) => {
    const user = users.find(
      (u) => u.username === username && u.status === "Active"
    );
    const expectedPassword =
      demoCredentials[username as keyof typeof demoCredentials];

    if (user && password === expectedPassword) {
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString().split("T")[0],
      };
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      setLoginError("");

      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    } else {
      setLoginError(t("login.invalidCredentials"));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab("Dashboard");
    localStorage.removeItem("currentUser");
  };

  // Transaction functions
  const handleAddDonation = (donation: any) => {
    if (currentUser?.role === "Viewer") return;

    const donationWithReceipt = {
      ...donation,
      receiptNumber: donation.receiptNumber || generateDonationReceiptNumber(),
    };

    setTransactions((prev) => [...prev, donationWithReceipt]);

    if (!donation.receiptNumber) {
      incrementDonationCounter();
    }

    if (donation.supportingDocuments?.length > 0) {
      saveDocuments(
        `transaction_${donationWithReceipt.id}_documents`,
        donation.supportingDocuments
      );
    }
  };

  const handleAddExpense = (expense: any) => {
    if (currentUser?.role === "Viewer") return;

    setTransactions((prev) => [...prev, expense]);

    if (expense.receiptImages?.length > 0) {
      saveDocuments(
        `transaction_${expense.id}_receipts`,
        expense.receiptImages
      );
    }
  };

  const handleAddRentIncome = (rentIncome: any) => {
    if (currentUser?.role === "Viewer") return;

    const rentIncomeWithReceipt = {
      ...rentIncome,
      receiptNumber: rentIncome.receiptNumber || generateRentReceiptNumber(),
    };

    setTransactions((prev) => [...prev, rentIncomeWithReceipt]);

    if (!rentIncome.receiptNumber) {
      incrementRentCounter();
    }

    if (rentIncome.supportingDocuments?.length > 0) {
      saveDocuments(
        `transaction_${rentIncomeWithReceipt.id}_documents`,
        rentIncome.supportingDocuments
      );
    }
  };

  const handleImportTransactions = (importedTransactions: Transaction[]) => {
    if (currentUser?.role === "Viewer") return;

    const existingTransactionKeys = new Set(
      transactions.map(
        (t) => `${t.date}-${t.type}-${t.category}-${t.description}-${t.amount}`
      )
    );

    const newTransactions = importedTransactions.filter(
      (t) =>
        !existingTransactionKeys.has(
          `${t.date}-${t.type}-${t.category}-${t.description}-${t.amount}`
        )
    );

    if (newTransactions.length > 0) {
      const processedTransactions = newTransactions.map((transaction) => {
        if (transaction.type === "Donation" && !transaction.receiptNumber) {
          const receiptNumber = generateDonationReceiptNumber();
          incrementDonationCounter();
          return { ...transaction, receiptNumber };
        } else if (
          transaction.type === "RentIncome" &&
          !transaction.receiptNumber
        ) {
          const receiptNumber = generateRentReceiptNumber();
          incrementRentCounter();
          return { ...transaction, receiptNumber };
        }
        return transaction;
      });

      setTransactions((prev) => [...prev, ...processedTransactions]);
      toast.success(
        `${newTransactions.length} new transactions imported successfully`
      );
    } else {
      toast.info("No new transactions found to import");
    }
  };

  // User management functions
  const handleAddUser = (userData: Omit<User, "id" | "createdAt">) => {
    if (currentUser?.role !== "Admin") return;

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers([...users, newUser]);
  };

  const handleEditUser = (id: string, userData: Partial<User>) => {
    if (currentUser?.role !== "Admin") return;

    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...userData } : user))
    );
  };

  const handleDeleteUser = (id: string) => {
    if (currentUser?.role !== "Admin" || id === currentUser.id) return;

    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const handleToggleUserStatus = (id: string) => {
    if (currentUser?.role !== "Admin" || id === currentUser.id) return;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === "Active" ? "Inactive" : "Active",
            }
          : user
      )
    );
  };

  // Calculate totals
  const donations = transactions.filter((t) => t.type === "Donation");
  const expenses = transactions.filter(
    (t) => t.type === "Expense" || t.type === "Utilities" || t.type === "Salary"
  );
  const rentIncomes = transactions.filter((t) => t.type === "RentIncome");

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRentIncome = rentIncomes.reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalDonations + totalRentIncome - totalExpenses;

  const renderContent = () => {
    if (!currentUser) return null;

    const canAccessTab = (tab: string) => {
      switch (tab) {
        case "Users":
          return currentUser.role === "Admin";
        case "Donations":
        case "Expenses":
        case "RentManagement":
          return (
            currentUser.role === "Admin" || currentUser.role === "Treasurer"
          );
        case "Dashboard":
        case "Reports":
          return true;
        default:
          return false;
      }
    };

    if (!canAccessTab(activeTab)) {
      return (
        <Alert className="max-w-md mx-auto mt-8">
          <AlertDescription>{t("common.noPermission")}</AlertDescription>
        </Alert>
      );
    }

    switch (activeTab) {
      case "Dashboard":
        return (
          <Dashboard
            totalDonations={totalDonations}
            totalExpenses={totalExpenses}
            netBalance={netBalance}
            transactions={transactions}
            totalRentIncome={totalRentIncome}
          />
        );
      case "Donations":
        return (
          <Donations
            donations={donations}
            onAddDonation={handleAddDonation}
            nextReceiptNumber={generateDonationReceiptNumber()}
          />
        );
      case "Expenses":
        return <Expenses expenses={expenses} onAddExpense={handleAddExpense} />;
      case "RentManagement":
        return (
          <RentManagement
            onAddRentIncome={handleAddRentIncome}
            nextReceiptNumber={generateRentReceiptNumber()}
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
            onCreateAgreement={handleCreateAgreement}
            onUpdateAgreement={handleUpdateAgreement}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onAddPenalty={handleAddPenalty}
            onUpdatePenalty={handleUpdatePenalty}
            onRentCollection={handleRentCollection}
          />
        );
      case "Reports":
        return (
          <Reports
            transactions={transactions}
            onImportTransactions={
              currentUser.role !== "Viewer"
                ? handleImportTransactions
                : undefined
            }
          />
        );
      case "Users":
        return (
          <UserManagement
            users={users}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
          />
        );
      default:
        return null;
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <div
        className="min-h-screen relative"
        style={{
          backgroundImage: `url(${templeImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-white/40"></div>
        <div className="relative z-10">
          <Login onLogin={handleLogin} error={loginError} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${templeImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-white/40"></div>

      <div className="relative z-10">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <main className="container mx-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
