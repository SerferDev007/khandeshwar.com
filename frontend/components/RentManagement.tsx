import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { DatePicker } from "./ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { FileUpload } from "./ui/file-upload";
import {
  Building,
  Users,
  FileText,
  IndianRupee,
  Plus,
  Edit,
  Eye,
  Printer,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Heart,
  Check,
  CreditCard,
  DollarSign,
  Calculator,
  AlertTriangle,
  FileCheck,
  Banknote,
  Trash2,
  UserPlus,
  FileSignature,
  Home,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { toast } from "sonner";
import apiClient from "../src/utils/api";

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

// If these types exist elsewhere, import them instead of using any
type RentManagementProps = {
  onAddRentIncome: (payment: any) => void;
  nextReceiptNumber: string;
  shops?: unknown;
  tenants?: unknown;
  agreements?: unknown;
  loans?: unknown;
  penalties?: unknown;
  onAddShop: (shopData: Omit<Shop, "id" | "createdAt">) => void;
  onUpdateShop: (shopId: string, updates: Partial<Shop>) => void;
  onDeleteShop: (shopId: string) => void;
  onAddTenant: (tenantData: Omit<Tenant, "id" | "createdAt">) => void;
  onUpdateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  onDeleteTenant: (tenantId: string) => void;
  onCreateAgreement: (
    agreementData: Omit<Agreement, "id" | "createdAt" | "nextDueDate">
  ) => void;
  onUpdateAgreement: (agreementId: string, updates: Partial<Agreement>) => void;
  onAddLoan: (loanData: Omit<Loan, "id" | "createdAt">) => void;
  onUpdateLoan: (loanId: string, updates: Partial<Loan>) => void;
  onAddPenalty: (penaltyData: Omit<RentPenalty, "id" | "createdAt">) => void;
  onUpdatePenalty: (penaltyId: string, updates: Partial<RentPenalty>) => void;
  onRentCollection: (collectionData: {
    rentAmount?: number;
    emiAmount?: number;
    penaltyAmount?: number;
    loanId?: string;
    penaltyId?: string;
    agreementId: string;
    tenantName: string;
    tenantContact?: string;
    shopNumber?: string;
  }) => void;
};

export default function RentManagement({
  onAddRentIncome,
  nextReceiptNumber,
  shops,
  tenants,
  agreements,
  loans,
  penalties,
  onAddShop,
  onUpdateShop,
  onDeleteShop,
  onAddTenant,
  onUpdateTenant,
  onDeleteTenant,
  onCreateAgreement,
  onUpdateAgreement,
  onAddLoan,
  onUpdateLoan,
  onAddPenalty,
  onUpdatePenalty,
  onRentCollection,
}: RentManagementProps) {
  // Minimal, defensive helper to ensure arrays
  const toArray = <T,>(val: unknown): T[] => {
    if (Array.isArray(val)) return val as T[];
    if (val != null && typeof val === 'object') return [val as T];
    return [];
  };

  // Guard props with toArray and use the normalized lists throughout
  const normalizedShops = useMemo(() => toArray<Shop>(shops), [shops]);
  const normalizedTenants = useMemo(() => toArray<Tenant>(tenants), [tenants]);
  const normalizedAgreements = useMemo(() => toArray<Agreement>(agreements), [agreements]);
  const normalizedLoans = useMemo(() => toArray<Loan>(loans), [loans]);
  const normalizedPenalties = useMemo(() => toArray<RentPenalty>(penalties), [penalties]);

  const { t } = useLanguage();

  console.log('[RentManagement] Component rendered with props:', {
    nextReceiptNumber,
    shopsCount: normalizedShops.length,
    tenantsCount: normalizedTenants.length,
    agreementsCount: normalizedAgreements.length,
    loansCount: normalizedLoans.length,
    penaltiesCount: normalizedPenalties.length,
    hasCallbacks: {
      onAddRentIncome: !!onAddRentIncome,
      onAddShop: !!onAddShop,
      onAddTenant: !!onAddTenant,
      onCreateAgreement: !!onCreateAgreement
    }
  });

  const [selectedTab, setSelectedTab] = useState("shops");

  // Log tab changes
  useEffect(() => {
    console.log('[RentManagement] Tab changed to:', selectedTab);
  }, [selectedTab]);

  // Log data changes
  useEffect(() => {
    console.log('[RentManagement] Data updated:', {
      shops: normalizedShops.length,
      tenants: normalizedTenants.length,
      agreements: normalizedAgreements.length
    });
  }, [normalizedShops, normalizedTenants, normalizedAgreements]);

  // Shop Form State
  const [shopFormData, setShopFormData] = useState({
    shopNumber: "",
    size: "",
    monthlyRent: "",
    deposit: "",
    description: "",
  });

  const [shopErrors, setShopErrors] = useState<any>({});
  const [showShopSuccessDialog, setShowShopSuccessDialog] = useState(false);
  const [lastAddedShop, setLastAddedShop] = useState<any>(null);
  const [isSubmittingShop, setIsSubmittingShop] = useState(false);

  // Tenant Form State
  const [tenantFormData, setTenantFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    businessType: "",
    idProof: "",
  });

  const [tenantErrors, setTenantErrors] = useState<any>({});
  const [showTenantSuccessDialog, setShowTenantSuccessDialog] = useState(false);
  const [lastAddedTenant, setLastAddedTenant] = useState<any>(null);

  // Agreement Form State
  const [agreementFormData, setAgreementFormData] = useState({
    shopId: "",
    tenantId: "",
    agreementDate: null as Date | null,
    duration: "12",
    agreementType: "Commercial",
    securityDeposit: "",
    advanceRent: "",
    agreementDocument: [] as UploadedFile[],
  });

  const [agreementErrors, setAgreementErrors] = useState<any>({});
  const [showAgreementSuccessDialog, setShowAgreementSuccessDialog] =
    useState(false);
  const [lastCreatedAgreement, setLastCreatedAgreement] = useState<any>(null);

  // Loan Form State
  const [loanFormData, setLoanFormData] = useState({
    tenantId: "",
    agreementId: "",
    loanAmount: "",
    interestRate: "1",
    loanDuration: "12",
    disbursedDate: null as Date | null,
    loanDocuments: [] as UploadedFile[],
  });

  const [loanErrors, setLoanErrors] = useState<any>({});
  const [showLoanSuccessDialog, setShowLoanSuccessDialog] = useState(false);
  const [lastAddedLoan, setLastAddedLoan] = useState<any>(null);

  // Rent Collection Form State
  const [collectionFormData, setCollectionFormData] = useState({
    agreementId: "",
    rentAmount: "",
    emiAmount: "",
    penaltyAmount: "",
    selectedLoanId: "",
    selectedPenaltyId: "",
    collectRent: true,
    collectEmi: false,
    collectPenalty: false,
  });

  const [showCollectionSuccessDialog, setShowCollectionSuccessDialog] =
    useState(false);

  // Original rent income form state
  const [rentIncomeFormData, setRentIncomeFormData] = useState({
    date: null as Date | null,
    category: "",
    subCategory: "",
    agreementId: "",
    tenantName: "",
    tenantContact: "",
    rentAmount: "",
    details: "",
    receiptNumber: nextReceiptNumber,
  });

  const [rentIncomeErrors, setRentIncomeErrors] = useState<any>({});
  const [showRentSuccessDialog, setShowRentSuccessDialog] = useState(false);
  const [lastAddedRentIncome, setLastAddedRentIncome] = useState<any>(null);

  const rentCategorySubCategories = {
    "Bhade Jama": ["bhade1Jama", "bhade2Jama"],
  };

  // Update receipt number when prop changes
  useEffect(() => {
    setRentIncomeFormData((prev) => ({
      ...prev,
      receiptNumber: nextReceiptNumber,
    }));
  }, [nextReceiptNumber]);

  const formatCurrency = (amount: number) => {
    return `${t("common.currency")}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getShopById = (id: string) => normalizedShops.find((s) => s.id === id);
  const getTenantById = (id: string) =>
    normalizedTenants.find((t) => t.id === id);
  const getAgreementById = (id: string) =>
    normalizedAgreements.find((a) => a.id === id);

  // Calculate EMI using formula: EMI = [P × R × (1+R)^N] / [(1+R)^N-1]
  const calculateEMI = (
    principal: number,
    rate: number,
    duration: number
  ): number => {
    const monthlyRate = rate / 100;
    const numerator =
      principal * monthlyRate * Math.pow(1 + monthlyRate, duration);
    const denominator = Math.pow(1 + monthlyRate, duration) - 1;
    return Math.round(numerator / denominator);
  };

  // Shop Form Validation
  const validateShopForm = (): boolean => {
    const newErrors: any = {};

    if (!shopFormData.shopNumber.trim()) {
      newErrors.shopNumber = t("shop.shopNumberRequired");
    }

    if (!shopFormData.size.trim()) {
      newErrors.size = t("shop.shopSizeRequired");
    } else {
      const size = parseFloat(shopFormData.size);
      if (isNaN(size) || size <= 0) {
        newErrors.size = t("shop.shopSizeInvalid");
      }
    }

    if (!shopFormData.monthlyRent.trim()) {
      newErrors.monthlyRent = t("shop.monthlyRentRequired");
    } else {
      const rent = parseFloat(shopFormData.monthlyRent);
      if (isNaN(rent) || rent <= 0) {
        newErrors.monthlyRent = t("shop.monthlyRentInvalid");
      }
    }

    if (!shopFormData.deposit.trim()) {
      newErrors.deposit = t("shop.securityDepositRequired");
    } else {
      const deposit = parseFloat(shopFormData.deposit);
      if (isNaN(deposit) || deposit < 0) {
        newErrors.deposit = t("shop.securityDepositInvalid");
      }
    }

    setShopErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle shop form submission
  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmittingShop) {
      return;
    }

    if (!validateShopForm()) {
      toast.error(t("shop.validationError"));
      return;
    }

    const newShopData: Omit<Shop, "id" | "createdAt"> = {
      shopNumber: shopFormData.shopNumber.trim(),
      size: parseFloat(shopFormData.size),
      monthlyRent: parseFloat(shopFormData.monthlyRent),
      deposit: parseFloat(shopFormData.deposit),
      status: "Vacant",
      description: shopFormData.description.trim(),
    };

    try {
      setIsSubmittingShop(true);
      await onAddShop(newShopData);
      
      setLastAddedShop({ ...newShopData, id: Date.now().toString() });
      setShowShopSuccessDialog(true);

      // Reset form
      setShopFormData({
        shopNumber: "",
        size: "",
        monthlyRent: "",
        deposit: "",
        description: "",
      });
      setShopErrors({});
    } catch (error: any) {
      // Error handling is done in the parent component
      console.error('Shop submission error:', error);
    } finally {
      setIsSubmittingShop(false);
    }
  };

  // Tenant Form Validation
  const validateTenantForm = (): boolean => {
    const newErrors: any = {};

    if (!tenantFormData.name.trim()) {
      newErrors.name = t("tenant.tenantNameRequired");
    } else if (tenantFormData.name.trim().length < 2) {
      newErrors.name = t("tenant.tenantNameInvalid");
    }

    if (!tenantFormData.phone.trim()) {
      newErrors.phone = t("tenant.tenantPhoneRequired");
    } else if (!/^\d{10}$/.test(tenantFormData.phone.trim())) {
      newErrors.phone = t("tenant.tenantPhoneInvalid");
    }

    if (
      tenantFormData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantFormData.email.trim())
    ) {
      newErrors.email = t("tenant.tenantEmailInvalid");
    }

    if (!tenantFormData.address.trim()) {
      newErrors.address = t("tenant.tenantAddressRequired");
    }

    if (!tenantFormData.businessType.trim()) {
      newErrors.businessType = t("tenant.businessTypeRequired");
    }

    setTenantErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle tenant form submission
  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTenantForm()) {
      toast.error(t("tenant.validationError"));
      return;
    }

    const newTenantData: Omit<Tenant, "id" | "createdAt"> = {
      name: tenantFormData.name.trim(),
      phone: tenantFormData.phone.trim(),
      email: tenantFormData.email.trim(),
      address: tenantFormData.address.trim(),
      businessType: tenantFormData.businessType.trim(),
      status: "Active",
      idProof: tenantFormData.idProof.trim(),
    };

    onAddTenant(newTenantData);
    setLastAddedTenant({ ...newTenantData, id: Date.now().toString() });
    setShowTenantSuccessDialog(true);

    // Reset form
    setTenantFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      businessType: "",
      idProof: "",
    });
    setTenantErrors({});
  };

  // Agreement Form Validation
  const validateAgreementForm = (): boolean => {
    const newErrors: any = {};

    if (!agreementFormData.shopId) {
      newErrors.shopId = t("agreement.shopRequired");
    }

    if (!agreementFormData.tenantId) {
      newErrors.tenantId = t("agreement.tenantRequired");
    }

    if (!agreementFormData.agreementDate) {
      newErrors.agreementDate = t("agreement.agreementDateRequired");
    }

    if (!agreementFormData.duration.trim()) {
      newErrors.duration = t("agreement.durationRequired");
    } else {
      const duration = parseInt(agreementFormData.duration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.duration = t("agreement.durationInvalid");
      }
    }

    if (!agreementFormData.securityDeposit.trim()) {
      newErrors.securityDeposit = t("agreement.securityDepositRequired");
    } else {
      const deposit = parseFloat(agreementFormData.securityDeposit);
      if (isNaN(deposit) || deposit < 0) {
        newErrors.securityDeposit = t("agreement.securityDepositInvalid");
      }
    }

    if (!agreementFormData.advanceRent.trim()) {
      newErrors.advanceRent = t("agreement.advanceRentRequired");
    } else {
      const advance = parseFloat(agreementFormData.advanceRent);
      if (isNaN(advance) || advance < 0) {
        newErrors.advanceRent = t("agreement.advanceRentInvalid");
      }
    }

    setAgreementErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle agreement form submission
  const handleCreateAgreement = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAgreementForm()) {
      toast.error(t("agreement.validationError"));
      return;
    }

    const selectedShop = getShopById(agreementFormData.shopId);

    const newAgreementData: Omit<
      Agreement,
      "id" | "createdAt" | "nextDueDate"
    > = {
      shopId: agreementFormData.shopId,
      tenantId: agreementFormData.tenantId,
      agreementDate: agreementFormData
        .agreementDate!.toISOString()
        .split("T")[0],
      duration: parseInt(agreementFormData.duration),
      monthlyRent: selectedShop?.monthlyRent || 0,
      securityDeposit: parseFloat(agreementFormData.securityDeposit),
      advanceRent: parseFloat(agreementFormData.advanceRent),
      agreementType: agreementFormData.agreementType as
        | "Residential"
        | "Commercial",
      status: "Active",
      agreementDocument: agreementFormData.agreementDocument,
    };

    onCreateAgreement(newAgreementData);
    setLastCreatedAgreement({ ...newAgreementData, id: Date.now().toString() });
    setShowAgreementSuccessDialog(true);

    // Reset form
    setAgreementFormData({
      shopId: "",
      tenantId: "",
      agreementDate: null,
      duration: "12",
      agreementType: "Commercial",
      securityDeposit: "",
      advanceRent: "",
      agreementDocument: [],
    });
    setAgreementErrors({});
  };

  // Loan Form Validation
  const validateLoanForm = (): boolean => {
    const newErrors: any = {};

    if (!loanFormData.tenantId) {
      newErrors.tenantId = t("loans.tenantRequired");
    }

    if (!loanFormData.agreementId) {
      newErrors.agreementId = t("loans.agreementRequired");
    }

    if (!loanFormData.loanAmount.trim()) {
      newErrors.loanAmount = t("loans.loanAmountRequired");
    } else {
      const amount = parseFloat(loanFormData.loanAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.loanAmount = t("loans.loanAmountInvalid");
      }
    }

    if (!loanFormData.interestRate.trim()) {
      newErrors.interestRate = t("loans.interestRateRequired");
    } else {
      const rate = parseFloat(loanFormData.interestRate);
      if (isNaN(rate) || rate <= 0) {
        newErrors.interestRate = t("loans.interestRateInvalid");
      }
    }

    if (!loanFormData.loanDuration.trim()) {
      newErrors.loanDuration = t("loans.loanDurationRequired");
    } else {
      const duration = parseInt(loanFormData.loanDuration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.loanDuration = t("loans.loanDurationInvalid");
      }
    }

    if (!loanFormData.disbursedDate) {
      newErrors.disbursedDate = t("loans.disbursedDateRequired");
    }

    setLoanErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle loan form submission
  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoanForm()) {
      toast.error(t("loans.validationError"));
      return;
    }

    const selectedTenant = getTenantById(loanFormData.tenantId);
    const loanAmount = parseFloat(loanFormData.loanAmount);
    const interestRate = parseFloat(loanFormData.interestRate);
    const loanDuration = parseInt(loanFormData.loanDuration);

    const monthlyEmi = calculateEMI(loanAmount, interestRate, loanDuration);

    // Calculate next EMI date (1 month from disbursed date)
    const nextEmiDate = new Date(loanFormData.disbursedDate!);
    nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);

    const newLoan: Omit<Loan, "id" | "createdAt"> = {
      tenantId: loanFormData.tenantId,
      tenantName: selectedTenant?.name || "",
      agreementId: loanFormData.agreementId,
      loanAmount,
      interestRate,
      disbursedDate: loanFormData.disbursedDate!.toISOString().split("T")[0],
      loanDuration,
      monthlyEmi,
      outstandingBalance: loanAmount,
      totalRepaid: 0,
      status: "Active",
      nextEmiDate: nextEmiDate.toISOString().split("T")[0],
      loanDocuments: loanFormData.loanDocuments,
    };

    onAddLoan(newLoan);
    setLastAddedLoan({ ...newLoan, id: Date.now().toString() });
    setShowLoanSuccessDialog(true);

    // Reset form
    setLoanFormData({
      tenantId: "",
      agreementId: "",
      loanAmount: "",
      interestRate: "1",
      loanDuration: "12",
      disbursedDate: null,
      loanDocuments: [],
    });
    setLoanErrors({});
  };

  // Get active loans for a specific agreement
  const getActiveLoansForAgreement = (agreementId: string) => {
    return normalizedLoans.filter(
      (loan) => loan.agreementId === agreementId && loan.status === "Active"
    );
  };

  // Get pending penalties for a specific agreement
  const getPendingPenaltiesForAgreement = (agreementId: string) => {
    return normalizedPenalties.filter(
      (penalty) =>
        penalty.agreementId === agreementId && penalty.status === "Pending"
    );
  };

  // Handle agreement selection for collection
  const handleCollectionAgreementChange = (agreementId: string) => {
    const agreement = getAgreementById(agreementId);
    if (agreement) {
      const activeLoans = getActiveLoansForAgreement(agreementId);
      const pendingPenalties = getPendingPenaltiesForAgreement(agreementId);

      setCollectionFormData({
        ...collectionFormData,
        agreementId,
        rentAmount: agreement.monthlyRent.toString(),
        emiAmount:
          activeLoans.length > 0 ? activeLoans[0].monthlyEmi.toString() : "",
        penaltyAmount:
          pendingPenalties.length > 0
            ? pendingPenalties[0].penaltyAmount.toString()
            : "",
        selectedLoanId: activeLoans.length > 0 ? activeLoans[0].id : "",
        selectedPenaltyId:
          pendingPenalties.length > 0 ? pendingPenalties[0].id : "",
        collectEmi: activeLoans.length > 0,
        collectPenalty: pendingPenalties.length > 0,
      });
    }
  };

  // Handle comprehensive rent collection
  const handleRentCollection = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAgreement = getAgreementById(collectionFormData.agreementId);
    if (!selectedAgreement) return;

    const selectedTenant = getTenantById(selectedAgreement.tenantId);
    const selectedShop = getShopById(selectedAgreement.shopId);

    const collectionData = {
      rentAmount: collectionFormData.collectRent
        ? parseFloat(collectionFormData.rentAmount) || 0
        : 0,
      emiAmount: collectionFormData.collectEmi
        ? parseFloat(collectionFormData.emiAmount) || 0
        : 0,
      penaltyAmount: collectionFormData.collectPenalty
        ? parseFloat(collectionFormData.penaltyAmount) || 0
        : 0,
      loanId: collectionFormData.selectedLoanId,
      penaltyId: collectionFormData.selectedPenaltyId,
      agreementId: collectionFormData.agreementId,
      tenantName: selectedTenant?.name || "",
      tenantContact: selectedTenant?.phone || "",
      shopNumber: selectedShop?.shopNumber || "",
    };

    onRentCollection(collectionData);
    setShowCollectionSuccessDialog(true);

    // Reset collection form
    setCollectionFormData({
      agreementId: "",
      rentAmount: "",
      emiAmount: "",
      penaltyAmount: "",
      selectedLoanId: "",
      selectedPenaltyId: "",
      collectRent: true,
      collectEmi: false,
      collectPenalty: false,
    });

    toast.success(t("rent.rentCollectionSuccess"));
  };

  // Original rent income form handlers (keeping existing functionality)
  const handleRentCategoryChange = (value: string) => {
    setRentIncomeFormData({
      ...rentIncomeFormData,
      category: value,
      subCategory: "",
      agreementId: "",
      tenantName: "",
      tenantContact: "",
      rentAmount: "",
    });
    if (rentIncomeErrors.category) {
      setRentIncomeErrors({
        ...rentIncomeErrors,
        category: undefined,
        subCategory: undefined,
      });
    }
  };

  const handleAgreementChange = (agreementId: string) => {
    const selectedAgreement = getAgreementById(agreementId);
    if (selectedAgreement) {
      const tenant = getTenantById(selectedAgreement.tenantId);

      setRentIncomeFormData({
        ...rentIncomeFormData,
        agreementId: agreementId,
        tenantName: tenant?.name || "",
        tenantContact: tenant?.phone || "",
        rentAmount:
          rentIncomeFormData.subCategory === "bhade2Jama"
            ? ""
            : selectedAgreement.monthlyRent.toString(),
      });
    } else {
      setRentIncomeFormData({
        ...rentIncomeFormData,
        agreementId: "",
        tenantName: "",
        tenantContact: "",
        rentAmount: "",
      });
    }

    if (rentIncomeErrors.agreementId) {
      setRentIncomeErrors({ ...rentIncomeErrors, agreementId: undefined });
    }
  };

  const handleSubCategoryChange = (value: string) => {
    const updatedFormData = {
      ...rentIncomeFormData,
      subCategory: value,
    };

    if (rentIncomeFormData.agreementId && value !== "bhade2Jama") {
      const selectedAgreement = getAgreementById(
        rentIncomeFormData.agreementId
      );
      if (selectedAgreement) {
        updatedFormData.rentAmount = selectedAgreement.monthlyRent.toString();
      }
    } else if (value === "bhade2Jama") {
      updatedFormData.rentAmount = "";
    }

    setRentIncomeFormData(updatedFormData);

    if (rentIncomeErrors.subCategory) {
      setRentIncomeErrors({ ...rentIncomeErrors, subCategory: undefined });
    }
  };

  const validateRentIncomeForm = (): boolean => {
    const newErrors: any = {};

    if (!rentIncomeFormData.date) {
      newErrors.date = t("donations.dateRequired");
    }

    if (!rentIncomeFormData.category) {
      newErrors.category = t("donations.categoryRequired");
    }

    if (!rentIncomeFormData.subCategory) {
      newErrors.subCategory = t("donations.subCategoryRequired");
    }

    if (!rentIncomeFormData.agreementId) {
      newErrors.agreementId = t("rent.agreementRequired");
    }

    if (!rentIncomeFormData.tenantName.trim()) {
      newErrors.tenantName = t("rent.tenantNameRequired");
    }

    if (!rentIncomeFormData.rentAmount.trim()) {
      newErrors.rentAmount = t("rent.rentAmountRequired");
    } else {
      const amount = parseFloat(rentIncomeFormData.rentAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.rentAmount = t("rent.rentAmountInvalid");
      }
    }

    if (!rentIncomeFormData.details.trim()) {
      newErrors.details = t("rent.detailsRequired");
    }

    if (
      rentIncomeFormData.tenantContact.trim() &&
      !/^\d{10}$/.test(rentIncomeFormData.tenantContact.trim())
    ) {
      newErrors.tenantContact = t("donations.donorContactInvalid");
    }

    setRentIncomeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setRentIncomeFormData({ ...rentIncomeFormData, rentAmount: value });
      if (rentIncomeErrors.rentAmount) {
        setRentIncomeErrors({ ...rentIncomeErrors, rentAmount: undefined });
      }
    }
  };

  const handleTenantContactChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && value.length <= 10)) {
      setRentIncomeFormData({ ...rentIncomeFormData, tenantContact: value });
      if (rentIncomeErrors.tenantContact) {
        setRentIncomeErrors({ ...rentIncomeErrors, tenantContact: undefined });
      }
    }
  };

  const handleAddRentIncome = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRentIncomeForm()) {
      toast.error(t("rent.validationError"));
      return;
    }

    try {
      const selectedAgreement = getAgreementById(rentIncomeFormData.agreementId);
      
      // Prepare data according to backend rent payment schema
      const rentPaymentData = {
        agreementId: rentIncomeFormData.agreementId,
        date: rentIncomeFormData.date!.toISOString().split("T")[0],
        amount: parseFloat(rentIncomeFormData.rentAmount),
        paymentMethod: "Cash", // Default payment method
        description: rentIncomeFormData.details.trim() || undefined,
        receiptNumber: rentIncomeFormData.receiptNumber,
      };

      // Call backend API
      const response = await apiClient.createRentPayment(rentPaymentData);
      
      // Create display object for UI (including extra fields for display)
      const shop = selectedAgreement ? getShopById(selectedAgreement.shopId) : null;
      const newRentIncome = {
        id: response.data?.id || Date.now().toString(),
        date: rentPaymentData.date,
        type: "RentIncome",
        category: rentIncomeFormData.category,
        subCategory: rentIncomeFormData.subCategory,
        description: rentPaymentData.description,
        amount: rentPaymentData.amount,
        receiptNumber: rentPaymentData.receiptNumber,
        tenantName: rentIncomeFormData.tenantName.trim(),
        tenantContact: rentIncomeFormData.tenantContact.trim(),
        agreementId: rentPaymentData.agreementId,
        shopNumber: shop?.shopNumber || "",
      };

      // Call parent callback for UI updates
      onAddRentIncome(newRentIncome);
      setLastAddedRentIncome(newRentIncome);
      setShowRentSuccessDialog(true);

      // Reset form
      setRentIncomeFormData({
        date: null,
        category: "",
        subCategory: "",
        agreementId: "",
        tenantName: "",
        tenantContact: "",
        rentAmount: "",
        details: "",
        receiptNumber: nextReceiptNumber,
      });
      setRentIncomeErrors({});
      
      toast.success(t("rent.successMessage"));

    } catch (error: any) {
      console.error('Rent payment submission error:', error);
      
      // Handle validation errors from backend
      if (error.status === 422 && error.response?.details) {
        const backendErrors: any = {};
        error.response.details.forEach((detail: any) => {
          const field = detail.path?.[0];
          if (field) {
            // Map backend field names to frontend field names
            const fieldMapping: { [key: string]: string } = {
              'agreementId': 'agreementId',
              'date': 'date', 
              'amount': 'rentAmount',
              'description': 'details'
            };
            const frontendField = fieldMapping[field] || field;
            backendErrors[frontendField] = detail.message;
          }
        });
        setRentIncomeErrors(backendErrors);
        toast.error(t("rent.validationError"));
      } else if (error.status === 401) {
        toast.error("Please login to submit rent payments");
      } else {
        toast.error(error.message || "Failed to submit rent payment. Please try again.");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Vacant":
        return "bg-gray-100 text-gray-800";
      case "Occupied":
        return "bg-green-100 text-green-800";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Defaulted":
        return "bg-red-100 text-red-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      case "Terminated":
        return "bg-gray-100 text-gray-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Vacant":
        return t("shop.vacant");
      case "Occupied":
        return t("shop.occupied");
      case "Maintenance":
        return t("shop.maintenance");
      case "Active":
        return t("loans.activeLoan");
      case "Completed":
        return t("loans.completedLoan");
      case "Defaulted":
        return t("loans.defaultedLoan");
      case "Expired":
        return "Expired";
      case "Terminated":
        return "Terminated";
      case "Paid":
        return t("penalties.paidPenalty");
      case "Pending":
        return t("penalties.pendingPenalty");
      case "Overdue":
        return t("rent.overdue");
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white">{t("rent.title")}</h1>
      </div>

      {/* Enhanced Tabs Navigation */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="shops" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {t("shop.title")}
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("tenant.title")}
          </TabsTrigger>
          <TabsTrigger value="agreements" className="flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            {t("agreement.title")}
          </TabsTrigger>
          <TabsTrigger value="rent-income" className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            {t("rent.addRentIncome")}
          </TabsTrigger>
          <TabsTrigger
            value="loan-management"
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {t("rent.loanManagement")}
          </TabsTrigger>
          <TabsTrigger
            value="rent-collection"
            className="flex items-center gap-2"
          >
            <Banknote className="h-4 w-4" />
            {t("rent.rentAndEmiCollection")}
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Shop Management Tab */}
        <TabsContent value="shops" className="space-y-4">
          {/* Add New Shop Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t("shop.addShop")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddShop} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shop Number */}
                  <div>
                    <Label htmlFor="shopNumber">{t("shop.shopNumber")} *</Label>
                    <Input
                      id="shopNumber"
                      type="text"
                      placeholder={t("shop.enterShopNumber")}
                      value={shopFormData.shopNumber}
                      onChange={(e) => {
                        setShopFormData({
                          ...shopFormData,
                          shopNumber: e.target.value,
                        });
                        if (shopErrors.shopNumber) {
                          setShopErrors({
                            ...shopErrors,
                            shopNumber: undefined,
                          });
                        }
                      }}
                      className={shopErrors.shopNumber ? "border-red-500" : ""}
                    />
                    {shopErrors.shopNumber && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {shopErrors.shopNumber}
                      </p>
                    )}
                  </div>

                  {/* Shop Size */}
                  <div>
                    <Label htmlFor="shopSize">{t("shop.shopSize")} *</Label>
                    <Input
                      id="shopSize"
                      type="text"
                      placeholder={t("shop.enterShopSize")}
                      value={shopFormData.size}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setShopFormData({ ...shopFormData, size: value });
                          if (shopErrors.size) {
                            setShopErrors({ ...shopErrors, size: undefined });
                          }
                        }
                      }}
                      className={shopErrors.size ? "border-red-500" : ""}
                    />
                    {shopErrors.size && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {shopErrors.size}
                      </p>
                    )}
                  </div>

                  {/* Monthly Rent */}
                  <div>
                    <Label htmlFor="monthlyRent">
                      {t("shop.monthlyRent")} ({t("common.currency")}) *
                    </Label>
                    <Input
                      id="monthlyRent"
                      type="text"
                      placeholder={t("shop.enterMonthlyRent")}
                      value={shopFormData.monthlyRent}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setShopFormData({
                            ...shopFormData,
                            monthlyRent: value,
                          });
                          if (shopErrors.monthlyRent) {
                            setShopErrors({
                              ...shopErrors,
                              monthlyRent: undefined,
                            });
                          }
                        }
                      }}
                      className={shopErrors.monthlyRent ? "border-red-500" : ""}
                    />
                    {shopErrors.monthlyRent && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {shopErrors.monthlyRent}
                      </p>
                    )}
                  </div>

                  {/* Security Deposit */}
                  <div>
                    <Label htmlFor="deposit">
                      {t("shop.securityDeposit")} ({t("common.currency")}) *
                    </Label>
                    <Input
                      id="deposit"
                      type="text"
                      placeholder={t("shop.enterSecurityDeposit")}
                      value={shopFormData.deposit}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setShopFormData({ ...shopFormData, deposit: value });
                          if (shopErrors.deposit) {
                            setShopErrors({
                              ...shopErrors,
                              deposit: undefined,
                            });
                          }
                        }
                      }}
                      className={shopErrors.deposit ? "border-red-500" : ""}
                    />
                    {shopErrors.deposit && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {shopErrors.deposit}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">
                    {t("shop.shopDescription")}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t("shop.enterShopDescription")}
                    value={shopFormData.description}
                    onChange={(e) => {
                      setShopFormData({
                        ...shopFormData,
                        description: e.target.value,
                      });
                    }}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmittingShop}>
                  {isSubmittingShop ? t("common.submitting") || "Submitting..." : t("shop.addShop")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Shops Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t("shop.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {normalizedShops.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No shops found. Add a new shop to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("shop.shopNumber")}</TableHead>
                        <TableHead>{t("shop.shopSize")}</TableHead>
                        <TableHead>{t("shop.monthlyRent")}</TableHead>
                        <TableHead>{t("shop.securityDeposit")}</TableHead>
                        <TableHead>{t("shop.shopStatus")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalizedShops.map((shop) => (
                        <TableRow key={shop.id}>
                          <TableCell className="font-medium">
                            {shop.shopNumber}
                          </TableCell>
                          <TableCell>{shop.size} sq ft</TableCell>
                          <TableCell>
                            {formatCurrency(shop.monthlyRent)}
                          </TableCell>
                          <TableCell>{formatCurrency(shop.deposit)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(shop.status)}>
                              {getStatusLabel(shop.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Implement edit functionality
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDeleteShop(shop.id)}
                                disabled={shop.status === "Occupied"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Management Tab */}
        <TabsContent value="tenants" className="space-y-4">
          {/* Add New Tenant Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t("tenant.addTenant")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTenant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tenant Name */}
                  <div>
                    <Label htmlFor="tenantName">
                      {t("tenant.tenantName")} *
                    </Label>
                    <Input
                      id="tenantName"
                      type="text"
                      placeholder={t("tenant.enterTenantName")}
                      value={tenantFormData.name}
                      onChange={(e) => {
                        setTenantFormData({
                          ...tenantFormData,
                          name: e.target.value,
                        });
                        if (tenantErrors.name) {
                          setTenantErrors({ ...tenantErrors, name: undefined });
                        }
                      }}
                      className={tenantErrors.name ? "border-red-500" : ""}
                    />
                    {tenantErrors.name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {tenantErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="tenantPhone">
                      {t("tenant.tenantPhone")} *
                    </Label>
                    <Input
                      id="tenantPhone"
                      type="text"
                      placeholder={t("tenant.enterTenantPhone")}
                      value={tenantFormData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (/^\d+$/.test(value) && value.length <= 10)
                        ) {
                          setTenantFormData({
                            ...tenantFormData,
                            phone: value,
                          });
                          if (tenantErrors.phone) {
                            setTenantErrors({
                              ...tenantErrors,
                              phone: undefined,
                            });
                          }
                        }
                      }}
                      className={tenantErrors.phone ? "border-red-500" : ""}
                    />
                    {tenantErrors.phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {tenantErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label htmlFor="tenantEmail">
                      {t("tenant.tenantEmail")}
                    </Label>
                    <Input
                      id="tenantEmail"
                      type="email"
                      placeholder={t("tenant.enterTenantEmail")}
                      value={tenantFormData.email}
                      onChange={(e) => {
                        setTenantFormData({
                          ...tenantFormData,
                          email: e.target.value,
                        });
                        if (tenantErrors.email) {
                          setTenantErrors({
                            ...tenantErrors,
                            email: undefined,
                          });
                        }
                      }}
                      className={tenantErrors.email ? "border-red-500" : ""}
                    />
                    {tenantErrors.email && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {tenantErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Business Type */}
                  <div>
                    <Label htmlFor="businessType">
                      {t("tenant.businessType")} *
                    </Label>
                    <Input
                      id="businessType"
                      type="text"
                      placeholder={t("tenant.enterBusinessType")}
                      value={tenantFormData.businessType}
                      onChange={(e) => {
                        setTenantFormData({
                          ...tenantFormData,
                          businessType: e.target.value,
                        });
                        if (tenantErrors.businessType) {
                          setTenantErrors({
                            ...tenantErrors,
                            businessType: undefined,
                          });
                        }
                      }}
                      className={
                        tenantErrors.businessType ? "border-red-500" : ""
                      }
                    />
                    {tenantErrors.businessType && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {tenantErrors.businessType}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="tenantAddress">
                    {t("tenant.tenantAddress")} *
                  </Label>
                  <Textarea
                    id="tenantAddress"
                    placeholder={t("tenant.enterTenantAddress")}
                    value={tenantFormData.address}
                    onChange={(e) => {
                      setTenantFormData({
                        ...tenantFormData,
                        address: e.target.value,
                      });
                      if (tenantErrors.address) {
                        setTenantErrors({
                          ...tenantErrors,
                          address: undefined,
                        });
                      }
                    }}
                    className={tenantErrors.address ? "border-red-500" : ""}
                  />
                  {tenantErrors.address && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {tenantErrors.address}
                    </p>
                  )}
                </div>

                {/* ID Proof */}
                <div>
                  <Label htmlFor="idProof">{t("tenant.idProof")}</Label>
                  <Input
                    id="idProof"
                    type="text"
                    placeholder={t("tenant.enterIdProof")}
                    value={tenantFormData.idProof}
                    onChange={(e) => {
                      setTenantFormData({
                        ...tenantFormData,
                        idProof: e.target.value,
                      });
                    }}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t("tenant.addTenant")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tenants Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("tenant.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {normalizedTenants.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tenants found. Add a new tenant to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("tenant.tenantName")}</TableHead>
                        <TableHead>{t("tenant.tenantPhone")}</TableHead>
                        <TableHead>{t("tenant.tenantEmail")}</TableHead>
                        <TableHead>{t("tenant.businessType")}</TableHead>
                        <TableHead>{t("tenant.tenantStatus")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalizedTenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">
                            {tenant.name}
                          </TableCell>
                          <TableCell>{tenant.phone}</TableCell>
                          <TableCell>{tenant.email}</TableCell>
                          <TableCell>{tenant.businessType}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(tenant.status)}>
                              {getStatusLabel(tenant.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Implement edit functionality
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDeleteTenant(tenant.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agreement Management Tab */}
        <TabsContent value="agreements" className="space-y-4">
          {/* Create New Agreement Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                {t("agreement.createAgreement")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAgreement} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shop Selection */}
                  <div>
                    <Label htmlFor="shopId">
                      {t("agreement.selectShop")} *
                    </Label>
                    <Select
                      value={agreementFormData.shopId}
                      onValueChange={(value) => {
                        setAgreementFormData({
                          ...agreementFormData,
                          shopId: value,
                        });
                        if (agreementErrors.shopId) {
                          setAgreementErrors({
                            ...agreementErrors,
                            shopId: undefined,
                          });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={
                          agreementErrors.shopId ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder={t("agreement.selectShop")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                        {normalizedShops
                          .filter((shop) => shop.status === "Vacant")
                          .map((shop) => (
                            <SelectItem key={shop.id} value={shop.id}>
                              {shop.shopNumber} -{" "}
                              {formatCurrency(shop.monthlyRent)} - {shop.size}{" "}
                              sq ft
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {agreementErrors.shopId && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {agreementErrors.shopId}
                      </p>
                    )}
                  </div>

                  {/* Tenant Selection */}
                  <div>
                    <Label htmlFor="tenantId">
                      {t("agreement.selectTenant")} *
                    </Label>
                    <Select
                      value={agreementFormData.tenantId}
                      onValueChange={(value) => {
                        setAgreementFormData({
                          ...agreementFormData,
                          tenantId: value,
                        });
                        if (agreementErrors.tenantId) {
                          setAgreementErrors({
                            ...agreementErrors,
                            tenantId: undefined,
                          });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={
                          agreementErrors.tenantId ? "border-red-500" : ""
                        }
                      >
                        <SelectValue
                          placeholder={t("agreement.selectTenant")}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                        {normalizedTenants
                          .filter((tenant) => tenant.status === "Active")
                          .map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name} - {tenant.phone} -{" "}
                              {tenant.businessType}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {agreementErrors.tenantId && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {agreementErrors.tenantId}
                      </p>
                    )}
                  </div>

                  {/* Agreement Date */}
                  <div>
                    <Label htmlFor="agreementDate">
                      {t("agreement.agreementDate")} *
                    </Label>
                    <DatePicker
                      date={agreementFormData.agreementDate || undefined}
                      onDateChange={(date) => {
                        setAgreementFormData({
                          ...agreementFormData,
                          agreementDate: date || null,
                        });
                        if (agreementErrors.agreementDate) {
                          setAgreementErrors({
                            ...agreementErrors,
                            agreementDate: undefined,
                          });
                        }
                      }}
                    />
                    {agreementErrors.agreementDate && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {agreementErrors.agreementDate}
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor="duration">
                      {t("agreement.agreementDuration")} *
                    </Label>
                    <Input
                      id="duration"
                      type="text"
                      placeholder={t("agreement.enterDuration")}
                      value={agreementFormData.duration}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*$/.test(value)) {
                          setAgreementFormData({
                            ...agreementFormData,
                            duration: value,
                          });
                          if (agreementErrors.duration) {
                            setAgreementErrors({
                              ...agreementErrors,
                              duration: undefined,
                            });
                          }
                        }
                      }}
                      className={
                        agreementErrors.duration ? "border-red-500" : ""
                      }
                    />
                    {agreementErrors.duration && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {agreementErrors.duration}
                      </p>
                    )}
                  </div>

                  {/* Agreement Type */}
                  <div>
                    <Label htmlFor="agreementType">
                      {t("agreement.agreementType")} *
                    </Label>
                    <Select
                      value={agreementFormData.agreementType}
                      onValueChange={(value) => {
                        setAgreementFormData({
                          ...agreementFormData,
                          agreementType: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("agreement.agreementType")}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                        <SelectItem
                          className="hover:font-bold hover:bg-gray-100"
                          value="Commercial"
                        >
                          {t("agreement.commercial")}
                        </SelectItem>
                        <SelectItem
                          className="hover:font-bold hover:bg-gray-100"
                          value="Residential"
                        >
                          {t("agreement.residential")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Security Deposit */}
                  <div>
                    <Label htmlFor="securityDeposit">
                      {t("shop.securityDeposit")} ({t("common.currency")}) *
                    </Label>
                    <Input
                      id="securityDeposit"
                      type="text"
                      placeholder={t("shop.enterSecurityDeposit")}
                      value={agreementFormData.securityDeposit}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setAgreementFormData({
                            ...agreementFormData,
                            securityDeposit: value,
                          });
                          if (agreementErrors.securityDeposit) {
                            setAgreementErrors({
                              ...agreementErrors,
                              securityDeposit: undefined,
                            });
                          }
                        }
                      }}
                      className={
                        agreementErrors.securityDeposit ? "border-red-500" : ""
                      }
                    />
                    {agreementErrors.securityDeposit && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {agreementErrors.securityDeposit}
                      </p>
                    )}
                  </div>

                  {/* Advance Rent */}
                  <div>
                    <Label htmlFor="advanceRent">
                      {t("agreement.advanceRent")} ({t("common.currency")}) *
                    </Label>
                    <Input
                      id="advanceRent"
                      type="text"
                      placeholder={t("agreement.enterAdvanceRent")}
                      value={agreementFormData.advanceRent}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setAgreementFormData({
                            ...agreementFormData,
                            advanceRent: value,
                          });
                          if (agreementErrors.advanceRent) {
                            setAgreementErrors({
                              ...agreementErrors,
                              advanceRent: undefined,
                            });
                          }
                        }
                      }}
                      className={
                        agreementErrors.advanceRent ? "border-red-500" : ""
                      }
                    />
                    {agreementErrors.advanceRent && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {agreementErrors.advanceRent}
                      </p>
                    )}
                  </div>

                  {/* Total Deposit Display */}
                  {agreementFormData.securityDeposit &&
                    agreementFormData.advanceRent && (
                      <div>
                        <Label>
                          {t("agreement.totalDeposit")} ({t("common.currency")})
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={formatCurrency(
                              (parseFloat(agreementFormData.securityDeposit) ||
                                0) +
                                (parseFloat(agreementFormData.advanceRent) || 0)
                            )}
                            disabled
                            className="pl-10 bg-gray-50"
                          />
                        </div>
                      </div>
                    )}
                </div>

                {/* Agreement Documents Upload */}
                <div>
                  <Label>{t("agreement.agreementDocument")}</Label>
                  <FileUpload
                    value={agreementFormData.agreementDocument}
                    onChange={(files) =>
                      setAgreementFormData({
                        ...agreementFormData,
                        agreementDocument: files,
                      })
                    }
                    accept="image/*,.pdf"
                    maxFiles={5}
                    maxSize={300 * 1024}
                    label={t("agreement.uploadAgreementDocument")}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t("agreement.createAgreement")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Agreements Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("agreement.activeAgreements")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {normalizedAgreements.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No agreements found. Create a new agreement to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("shop.shopNumber")}</TableHead>
                        <TableHead>{t("tenant.tenantName")}</TableHead>
                        <TableHead>{t("agreement.agreementDate")}</TableHead>
                        <TableHead>{t("shop.monthlyRent")}</TableHead>
                        <TableHead>{t("agreement.agreementType")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalizedAgreements.map((agreement) => {
                        const shop = getShopById(agreement.shopId);
                        const tenant = getTenantById(agreement.tenantId);
                        return (
                          <TableRow key={agreement.id}>
                            <TableCell className="font-medium">
                              {shop?.shopNumber}
                            </TableCell>
                            <TableCell>{tenant?.name}</TableCell>
                            <TableCell>
                              {formatDate(agreement.agreementDate)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(agreement.monthlyRent)}
                            </TableCell>
                            <TableCell>{agreement.agreementType}</TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(agreement.status)}
                              >
                                {getStatusLabel(agreement.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Implement view functionality
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Implement edit functionality
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rent Income Tab (existing functionality) */}
        <TabsContent value="rent-income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("rent.addRentIncome")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRentIncome} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Receipt Number */}
                  <div>
                    <Label htmlFor="receiptNumber">
                      {t("donations.receiptNumber")} *
                    </Label>
                    <Input
                      id="receiptNumber"
                      value={rentIncomeFormData.receiptNumber}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <Label htmlFor="date">{t("donations.date")} *</Label>
                    <DatePicker
                      date={rentIncomeFormData.date || undefined}
                      onDateChange={(date) => {
                        setRentIncomeFormData({
                          ...rentIncomeFormData,
                          date: date || null,
                        });
                        if (rentIncomeErrors.date) {
                          setRentIncomeErrors({
                            ...rentIncomeErrors,
                            date: undefined,
                          });
                        }
                      }}
                    />
                    {rentIncomeErrors.date && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {rentIncomeErrors.date}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">
                      {t("donations.category")} *
                    </Label>
                    <Select
                      value={rentIncomeFormData.category}
                      onValueChange={handleRentCategoryChange}
                    >
                      <SelectTrigger
                        className={
                          rentIncomeErrors.category ? "border-red-500" : ""
                        }
                      >
                        <SelectValue
                          placeholder={t("donations.selectCategory")}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                        <SelectItem
                          className="hover:font-bold hover:bg-gray-100"
                          value="Bhade Jama"
                        >
                          {t("rent.bhadeJama")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {rentIncomeErrors.category && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {rentIncomeErrors.category}
                      </p>
                    )}
                  </div>

                  {/* Sub-Category */}
                  {rentIncomeFormData.category && (
                    <div>
                      <Label htmlFor="subCategory">
                        {t("donations.subCategory")} *
                      </Label>
                      <Select
                        value={rentIncomeFormData.subCategory}
                        onValueChange={handleSubCategoryChange}
                      >
                        <SelectTrigger
                          className={
                            rentIncomeErrors.subCategory ? "border-red-500" : ""
                          }
                        >
                          <SelectValue
                            placeholder={t("donations.selectSubCategory")}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                          {rentCategorySubCategories[
                            rentIncomeFormData.category as keyof typeof rentCategorySubCategories
                          ]?.map((subCat) => (
                            <SelectItem key={subCat} value={subCat}>
                              {t(`rent.${subCat}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {rentIncomeErrors.subCategory && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {rentIncomeErrors.subCategory}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Agreement Selection */}
                  {rentIncomeFormData.subCategory && (
                    <div>
                      <Label htmlFor="agreementId">
                        {t("rent.agreement")} *
                      </Label>
                      <Select
                        value={rentIncomeFormData.agreementId}
                        onValueChange={handleAgreementChange}
                      >
                        <SelectTrigger
                          className={
                            rentIncomeErrors.agreementId ? "border-red-500" : ""
                          }
                        >
                          <SelectValue
                            placeholder={t("rent.selectAgreement")}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                          {normalizedAgreements
                            .filter((a) => a.status === "Active")
                            .map((agreement) => {
                              const shop = getShopById(agreement.shopId);
                              const tenant = getTenantById(agreement.tenantId);
                              return (
                                <SelectItem
                                  key={agreement.id}
                                  value={agreement.id}
                                >
                                  {shop?.shopNumber} - {tenant?.name} -{" "}
                                  {formatCurrency(agreement.monthlyRent)}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      {rentIncomeErrors.agreementId && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {rentIncomeErrors.agreementId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tenant Name */}
                  {rentIncomeFormData.agreementId && (
                    <div>
                      <Label htmlFor="tenantName">
                        {t("rent.tenantName")} *
                      </Label>
                      <Input
                        id="tenantName"
                        value={rentIncomeFormData.tenantName}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  )}

                  {/* Tenant Contact */}
                  {rentIncomeFormData.agreementId && (
                    <div>
                      <Label htmlFor="tenantContact">
                        {t("rent.tenantContact")}
                      </Label>
                      <Input
                        id="tenantContact"
                        value={rentIncomeFormData.tenantContact}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  )}

                  {/* Rent Amount */}
                  {rentIncomeFormData.agreementId && (
                    <div>
                      <Label htmlFor="rentAmount">
                        {t("rent.rentAmount")} ({t("common.currency")}) *
                      </Label>
                      <Input
                        id="rentAmount"
                        type="text"
                        placeholder={t("rent.enterRentAmount")}
                        value={rentIncomeFormData.rentAmount}
                        onChange={handleRentAmountChange}
                        disabled={
                          rentIncomeFormData.subCategory !== "bhade2Jama"
                        }
                        className={`${
                          rentIncomeErrors.rentAmount ? "border-red-500" : ""
                        } ${
                          rentIncomeFormData.subCategory !== "bhade2Jama"
                            ? "bg-gray-50"
                            : ""
                        }`}
                      />
                      {rentIncomeFormData.subCategory !== "bhade2Jama" && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t("rent.amountAutoPopulated")}
                        </p>
                      )}
                      {rentIncomeFormData.subCategory === "bhade2Jama" && (
                        <p className="text-xs text-blue-600 mt-1">
                          {t("rent.amountEditable")}
                        </p>
                      )}
                      {rentIncomeErrors.rentAmount && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {rentIncomeErrors.rentAmount}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <Label htmlFor="details">{t("rent.details")} *</Label>
                  <Textarea
                    id="details"
                    placeholder={t("rent.enterDetails")}
                    value={rentIncomeFormData.details}
                    onChange={(e) => {
                      setRentIncomeFormData({
                        ...rentIncomeFormData,
                        details: e.target.value,
                      });
                      if (rentIncomeErrors.details) {
                        setRentIncomeErrors({
                          ...rentIncomeErrors,
                          details: undefined,
                        });
                      }
                    }}
                    className={rentIncomeErrors.details ? "border-red-500" : ""}
                  />
                  {rentIncomeErrors.details && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {rentIncomeErrors.details}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  {t("common.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loan Management Tab */}
        <TabsContent value="loan-management" className="space-y-4">
          {/* Add New Loan Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("loans.addLoan")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLoan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tenant Selection */}
                  <div>
                    <Label htmlFor="tenantId">
                      {t("loans.selectTenant")} *
                    </Label>
                    <Select
                      value={loanFormData.tenantId}
                      onValueChange={(value) => {
                        setLoanFormData({
                          ...loanFormData,
                          tenantId: value,
                          agreementId: "",
                        });
                        if (loanErrors.tenantId) {
                          setLoanErrors({ ...loanErrors, tenantId: undefined });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={loanErrors.tenantId ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder={t("loans.selectTenant")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                        {normalizedTenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} - {tenant.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loanErrors.tenantId && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {loanErrors.tenantId}
                      </p>
                    )}
                  </div>

                  {/* Agreement Selection */}
                  <div>
                    <Label htmlFor="agreementId">
                      {t("loans.selectAgreement")} *
                    </Label>
                    <Select
                      value={loanFormData.agreementId}
                      onValueChange={(value) => {
                        setLoanFormData({
                          ...loanFormData,
                          agreementId: value,
                        });
                        if (loanErrors.agreementId) {
                          setLoanErrors({
                            ...loanErrors,
                            agreementId: undefined,
                          });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={
                          loanErrors.agreementId ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder={t("loans.selectAgreement")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                        {normalizedAgreements
                          .filter(
                            (a) =>
                              a.status === "Active" &&
                              a.tenantId === loanFormData.tenantId
                          )
                          .map((agreement) => {
                            const shop = getShopById(agreement.shopId);
                            return (
                              <SelectItem
                                key={agreement.id}
                                value={agreement.id}
                              >
                                {shop?.shopNumber} -{" "}
                                {formatCurrency(agreement.monthlyRent)}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    {loanErrors.agreementId && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {loanErrors.agreementId}
                      </p>
                    )}
                  </div>

                  {/* Loan Amount */}
                  <div>
                    <Label htmlFor="loanAmount">
                      {t("loans.loanAmount")} ({t("common.currency")}) *
                    </Label>
                    <Input
                      id="loanAmount"
                      type="text"
                      placeholder={t("loans.enterLoanAmount")}
                      value={loanFormData.loanAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setLoanFormData({
                            ...loanFormData,
                            loanAmount: value,
                          });
                          if (loanErrors.loanAmount) {
                            setLoanErrors({
                              ...loanErrors,
                              loanAmount: undefined,
                            });
                          }
                        }
                      }}
                      className={loanErrors.loanAmount ? "border-red-500" : ""}
                    />
                    {loanErrors.loanAmount && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {loanErrors.loanAmount}
                      </p>
                    )}
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <Label htmlFor="interestRate">
                      {t("loans.interestRate")} *
                    </Label>
                    <Input
                      id="interestRate"
                      type="text"
                      placeholder={t("loans.enterInterestRate")}
                      value={loanFormData.interestRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setLoanFormData({
                            ...loanFormData,
                            interestRate: value,
                          });
                          if (loanErrors.interestRate) {
                            setLoanErrors({
                              ...loanErrors,
                              interestRate: undefined,
                            });
                          }
                        }
                      }}
                      className={
                        loanErrors.interestRate ? "border-red-500" : ""
                      }
                    />
                    {loanErrors.interestRate && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {loanErrors.interestRate}
                      </p>
                    )}
                  </div>

                  {/* Loan Duration */}
                  <div>
                    <Label htmlFor="loanDuration">
                      {t("loans.loanDuration")} *
                    </Label>
                    <Input
                      id="loanDuration"
                      type="text"
                      placeholder={t("loans.enterLoanDuration")}
                      value={loanFormData.loanDuration}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*$/.test(value)) {
                          setLoanFormData({
                            ...loanFormData,
                            loanDuration: value,
                          });
                          if (loanErrors.loanDuration) {
                            setLoanErrors({
                              ...loanErrors,
                              loanDuration: undefined,
                            });
                          }
                        }
                      }}
                      className={
                        loanErrors.loanDuration ? "border-red-500" : ""
                      }
                    />
                    {loanErrors.loanDuration && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {loanErrors.loanDuration}
                      </p>
                    )}
                  </div>

                  {/* Disbursed Date */}
                  <div>
                    <Label htmlFor="disbursedDate">
                      {t("loans.disbursedDate")} *
                    </Label>
                    <DatePicker
                      date={loanFormData.disbursedDate || undefined}
                      onDateChange={(date) => {
                        setLoanFormData({
                          ...loanFormData,
                          disbursedDate: date || null,
                        });
                        if (loanErrors.disbursedDate) {
                          setLoanErrors({
                            ...loanErrors,
                            disbursedDate: undefined,
                          });
                        }
                      }}
                    />
                    {loanErrors.disbursedDate && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {loanErrors.disbursedDate}
                      </p>
                    )}
                  </div>

                  {/* Calculated EMI Display */}
                  {loanFormData.loanAmount &&
                    loanFormData.interestRate &&
                    loanFormData.loanDuration && (
                      <div>
                        <Label>
                          {t("loans.monthlyEmi")} ({t("common.currency")})
                        </Label>
                        <div className="relative">
                          <Calculator className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={formatCurrency(
                              calculateEMI(
                                parseFloat(loanFormData.loanAmount) || 0,
                                parseFloat(loanFormData.interestRate) || 0,
                                parseInt(loanFormData.loanDuration) || 0
                              )
                            )}
                            disabled
                            className="pl-10 bg-gray-50"
                          />
                        </div>
                      </div>
                    )}
                </div>

                {/* Loan Documents Upload */}
                <div>
                  <Label>{t("loans.loanAgreement")}</Label>
                  <FileUpload
                    value={loanFormData.loanDocuments}
                    onChange={(files) =>
                      setLoanFormData({ ...loanFormData, loanDocuments: files })
                    }
                    accept="image/*,.pdf"
                    maxFiles={5}
                    maxSize={300 * 1024}
                    label={t("loans.uploadLoanAgreement")}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t("loans.addLoan")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Loans Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t("rent.activeLoans")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {normalizedLoans.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{t("rent.noActiveLoans")}</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("rent.tenantName")}</TableHead>
                        <TableHead>{t("loans.loanAmount")}</TableHead>
                        <TableHead>{t("loans.monthlyEmi")}</TableHead>
                        <TableHead>{t("loans.outstandingBalance")}</TableHead>
                        <TableHead>{t("loans.nextEmiDate")}</TableHead>
                        <TableHead>{t("loans.loanStatus")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalizedLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell>{loan.tenantName}</TableCell>
                          <TableCell>
                            {formatCurrency(loan.loanAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(loan.monthlyEmi)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(loan.outstandingBalance)}
                          </TableCell>
                          <TableCell>{formatDate(loan.nextEmiDate)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(loan.status)}>
                              {getStatusLabel(loan.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const emiAmount = loan.monthlyEmi;
                                  const newBalance = Math.max(
                                    0,
                                    loan.outstandingBalance - emiAmount
                                  );
                                  const newTotalRepaid =
                                    loan.totalRepaid + emiAmount;
                                  const nextEmiDate = new Date();
                                  nextEmiDate.setMonth(
                                    nextEmiDate.getMonth() + 1
                                  );

                                  onUpdateLoan(loan.id, {
                                    outstandingBalance: newBalance,
                                    totalRepaid: newTotalRepaid,
                                    lastPaymentDate: new Date()
                                      .toISOString()
                                      .split("T")[0],
                                    nextEmiDate: nextEmiDate
                                      .toISOString()
                                      .split("T")[0],
                                    status:
                                      newBalance <= 0 ? "Completed" : "Active",
                                  });

                                  toast.success(
                                    `EMI payment of ${formatCurrency(
                                      emiAmount
                                    )} recorded`
                                  );
                                }}
                                disabled={loan.status !== "Active"}
                              >
                                <CreditCard className="h-4 w-4" />
                                {t("loans.payEmi")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comprehensive Rent Collection Tab */}
        <TabsContent value="rent-collection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                {t("rent.collectRentWithLoan")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRentCollection} className="space-y-4">
                {/* Agreement Selection */}
                <div>
                  <Label htmlFor="collectionAgreementId">
                    {t("rent.selectAgreement")} *
                  </Label>
                  <Select
                    value={collectionFormData.agreementId}
                    onValueChange={handleCollectionAgreementChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("rent.selectAgreement")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                      {normalizedAgreements
                        .filter((a) => a.status === "Active")
                        .map((agreement) => {
                          const shop = getShopById(agreement.shopId);
                          const tenant = getTenantById(agreement.tenantId);
                          return (
                            <SelectItem key={agreement.id} value={agreement.id}>
                              {shop?.shopNumber} - {tenant?.name} -{" "}
                              {formatCurrency(agreement.monthlyRent)}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {collectionFormData.agreementId && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Rent Collection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={collectionFormData.collectRent}
                            onChange={(e) =>
                              setCollectionFormData({
                                ...collectionFormData,
                                collectRent: e.target.checked,
                              })
                            }
                          />
                          <IndianRupee className="h-4 w-4" />
                          Rent Collection
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label>{t("rent.rentAmount")}</Label>
                          <Input
                            type="text"
                            value={collectionFormData.rentAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                setCollectionFormData({
                                  ...collectionFormData,
                                  rentAmount: value,
                                });
                              }
                            }}
                            disabled={!collectionFormData.collectRent}
                            className={
                              !collectionFormData.collectRent
                                ? "bg-gray-50"
                                : ""
                            }
                          />
                          <p className="text-sm text-gray-500">
                            Monthly rent payment
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* EMI Collection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={collectionFormData.collectEmi}
                            onChange={(e) =>
                              setCollectionFormData({
                                ...collectionFormData,
                                collectEmi: e.target.checked,
                              })
                            }
                          />
                          <CreditCard className="h-4 w-4" />
                          {t("rent.emiAmount")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label>{t("loans.emiPayment")}</Label>
                          <Input
                            type="text"
                            value={collectionFormData.emiAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                setCollectionFormData({
                                  ...collectionFormData,
                                  emiAmount: value,
                                });
                              }
                            }}
                            disabled={!collectionFormData.collectEmi}
                            className={
                              !collectionFormData.collectEmi ? "bg-gray-50" : ""
                            }
                          />
                          <p className="text-sm text-gray-500">
                            Loan EMI payment (1% interest)
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Penalty Collection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={collectionFormData.collectPenalty}
                            onChange={(e) =>
                              setCollectionFormData({
                                ...collectionFormData,
                                collectPenalty: e.target.checked,
                              })
                            }
                          />
                          <AlertTriangle className="h-4 w-4" />
                          {t("penalties.penaltyAmount")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label>{t("penalties.lateFee")}</Label>
                          <Input
                            type="text"
                            value={collectionFormData.penaltyAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                setCollectionFormData({
                                  ...collectionFormData,
                                  penaltyAmount: value,
                                });
                              }
                            }}
                            disabled={!collectionFormData.collectPenalty}
                            className={
                              !collectionFormData.collectPenalty
                                ? "bg-gray-50"
                                : ""
                            }
                          />
                          <p className="text-sm text-gray-500">
                            Late payment penalty (1% rate)
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {collectionFormData.agreementId && (
                  <div className="mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">
                        {t("rent.totalCollection")}
                      </h4>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          (collectionFormData.collectRent
                            ? parseFloat(collectionFormData.rentAmount) || 0
                            : 0) +
                            (collectionFormData.collectEmi
                              ? parseFloat(collectionFormData.emiAmount) || 0
                              : 0) +
                            (collectionFormData.collectPenalty
                              ? parseFloat(collectionFormData.penaltyAmount) ||
                                0
                              : 0)
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !collectionFormData.agreementId ||
                    (!collectionFormData.collectRent &&
                      !collectionFormData.collectEmi &&
                      !collectionFormData.collectPenalty)
                  }
                >
                  {t("rent.rentAndEmiCollection")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Penalty Management Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t("rent.pendingPenalties")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {normalizedPenalties.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("rent.noPendingPenalties")}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("rent.tenantName")}</TableHead>
                        <TableHead>{t("penalties.rentAmount")}</TableHead>
                        <TableHead>{t("penalties.dueDate")}</TableHead>
                        <TableHead>{t("penalties.penaltyAmount")}</TableHead>
                        <TableHead>{t("penalties.penaltyStatus")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalizedPenalties.map((penalty) => (
                        <TableRow key={penalty.id}>
                          <TableCell>{penalty.tenantName}</TableCell>
                          <TableCell>
                            {formatCurrency(penalty.rentAmount)}
                          </TableCell>
                          <TableCell>{formatDate(penalty.dueDate)}</TableCell>
                          <TableCell>
                            {formatCurrency(penalty.penaltyAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(penalty.status)}>
                              {getStatusLabel(penalty.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onUpdatePenalty(penalty.id, {
                                  penaltyPaid: true,
                                  penaltyPaidDate: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                  status: "Paid",
                                });
                                toast.success(
                                  `Penalty of ${formatCurrency(
                                    penalty.penaltyAmount
                                  )} paid`
                                );
                              }}
                              disabled={penalty.status === "Paid"}
                            >
                              <CheckCircle className="h-4 w-4" />
                              {t("penalties.payPenalty")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {t("shop.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {normalizedShops.filter((s) => s.status === "Occupied").length}{" "}
                  / {normalizedShops.length}
                </div>
                <p className="text-sm text-gray-500">
                  {t("dashboard.activeShops")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("tenant.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {normalizedTenants.filter((t) => t.status === "Active").length}
                </div>
                <p className="text-sm text-gray-500">Active Tenants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" />
                  {t("agreement.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    normalizedAgreements.filter((a) => a.status === "Active")
                      .length
                  }
                </div>
                <p className="text-sm text-gray-500">
                  {t("agreement.activeAgreements")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Monthly Rent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    normalizedAgreements.reduce(
                      (sum, agreement) =>
                        agreement.status === "Active"
                          ? sum + agreement.monthlyRent
                          : sum,
                      0
                    )
                  )}
                </div>
                <p className="text-sm text-gray-500">Total Monthly Income</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("rent.activeLoans")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {normalizedLoans.filter((l) => l.status === "Active").length}
                </div>
                <p className="text-sm text-gray-500">
                  Outstanding:{" "}
                  {formatCurrency(
                    normalizedLoans.reduce(
                      (sum, loan) => sum + loan.outstandingBalance,
                      0
                    )
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t("rent.pendingPenalties")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    normalizedPenalties.filter((p) => p.status === "Pending")
                      .length
                  }
                </div>
                <p className="text-sm text-gray-500">
                  Total:{" "}
                  {formatCurrency(
                    normalizedPenalties.reduce(
                      (sum, penalty) =>
                        penalty.status === "Pending"
                          ? sum + penalty.penaltyAmount
                          : sum,
                      0
                    )
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Success Dialogs */}

      {/* Shop Success Dialog */}
      <Dialog
        open={showShopSuccessDialog}
        onOpenChange={setShowShopSuccessDialog}
      >
        <DialogContent className="sm:max-w-md  bg-orange-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                {t("shop.successTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("shop.successMessage")}
            </DialogDescription>
          </DialogHeader>

          {lastAddedShop && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Store className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">{t("shop.shopDetails")}</h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("shop.shopNumber")}:</span>
                  <span className="font-medium">
                    {lastAddedShop.shopNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("shop.shopSize")}:</span>
                  <span className="font-medium">
                    {lastAddedShop.size} sq ft
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("shop.monthlyRent")}:
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(lastAddedShop.monthlyRent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("shop.securityDeposit")}:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(lastAddedShop.deposit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowShopSuccessDialog(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Success Dialog */}
      <Dialog
        open={showTenantSuccessDialog}
        onOpenChange={setShowTenantSuccessDialog}
      >
        <DialogContent className="sm:max-w-md  bg-orange-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                {t("tenant.successTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("tenant.successMessage")}
            </DialogDescription>
          </DialogHeader>

          {lastAddedTenant && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">{t("tenant.tenantDetails")}</h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tenant.tenantName")}:
                  </span>
                  <span className="font-medium">{lastAddedTenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tenant.tenantPhone")}:
                  </span>
                  <span className="font-medium">{lastAddedTenant.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tenant.businessType")}:
                  </span>
                  <span className="font-medium">
                    {lastAddedTenant.businessType}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowTenantSuccessDialog(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agreement Success Dialog */}
      <Dialog
        open={showAgreementSuccessDialog}
        onOpenChange={setShowAgreementSuccessDialog}
      >
        <DialogContent className="sm:max-w-md  bg-orange-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                {t("agreement.successTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("agreement.successMessage")}
            </DialogDescription>
          </DialogHeader>

          {lastCreatedAgreement && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <FileSignature className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">
                  {t("agreement.agreementDetails")}
                </h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("shop.shopNumber")}:</span>
                  <span className="font-medium">
                    {getShopById(lastCreatedAgreement.shopId)?.shopNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("tenant.tenantName")}:
                  </span>
                  <span className="font-medium">
                    {getTenantById(lastCreatedAgreement.tenantId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("shop.monthlyRent")}:
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(lastCreatedAgreement.monthlyRent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("agreement.totalDeposit")}:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      lastCreatedAgreement.securityDeposit +
                        lastCreatedAgreement.advanceRent
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowAgreementSuccessDialog(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loan Success Dialog */}
      <Dialog
        open={showLoanSuccessDialog}
        onOpenChange={setShowLoanSuccessDialog}
      >
        <DialogContent className="sm:max-w-md  bg-orange-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                {t("loans.successTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("loans.successMessage")}
            </DialogDescription>
          </DialogHeader>

          {lastAddedLoan && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">{t("loans.loanDetails")}</h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("rent.tenantName")}:</span>
                  <span className="font-medium">
                    {lastAddedLoan.tenantName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("loans.loanAmount")}:
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(lastAddedLoan.loanAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("loans.monthlyEmi")}:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(lastAddedLoan.monthlyEmi)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("loans.nextEmiDate")}:
                  </span>
                  <span className="font-medium">
                    {formatDate(lastAddedLoan.nextEmiDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowLoanSuccessDialog(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collection Success Dialog */}
      <Dialog
        open={showCollectionSuccessDialog}
        onOpenChange={setShowCollectionSuccessDialog}
      >
        <DialogContent className="sm:max-w-md  bg-orange-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                Collection Successful!
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("rent.rentCollectionSuccess")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowCollectionSuccessDialog(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Original Rent Success Dialog */}
      <Dialog
        open={showRentSuccessDialog}
        onOpenChange={setShowRentSuccessDialog}
      >
        <DialogContent className="sm:max-w-md  bg-orange-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                {t("rent.successTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("rent.successMessage")}
            </DialogDescription>
          </DialogHeader>

          {lastAddedRentIncome && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-red-500" />
                <h4 className="font-medium">{t("rent.rentDetails")}</h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.receiptNumber")}:
                  </span>
                  <span className="font-medium">
                    {lastAddedRentIncome.receiptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("donations.date")}:</span>
                  <span className="font-medium">
                    {formatDate(lastAddedRentIncome.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.category")}:
                  </span>
                  <span className="font-medium">
                    {t(
                      `rent.${lastAddedRentIncome.category
                        .toLowerCase()
                        .replace(" ", "")}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.amount")}:
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(lastAddedRentIncome.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("rent.tenantName")}:</span>
                  <span className="font-medium">
                    {lastAddedRentIncome.tenantName}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowRentSuccessDialog(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
