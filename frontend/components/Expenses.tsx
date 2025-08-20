import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { FileUpload } from "./ui/file-upload";
import TransactionTable from "./TransactionTable";
import { useLanguage } from "./LanguageContext";
import { Check, AlertCircle, Receipt, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  base64: string;
  uploadedAt: string;
  compressedSize?: number;
}

interface ExpensesProps {
  expenses: any[];
  onAddExpense: (expense: any) => void;
}

interface ValidationErrors {
  date?: string;
  category?: string;
  subCategory?: string;
  payeeName?: string;
  payeeContact?: string;
  amount?: string;
  details?: string;
  receiptImages?: string;
}

export default function Expenses({ expenses, onAddExpense }: ExpensesProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    date: null as Date | null,
    category: "",
    subCategory: "",
    payeeName: "",
    payeeContact: "",
    amount: "",
    details: "",
    receiptImages: [] as UploadedFile[],
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastAddedExpense, setLastAddedExpense] = useState<any>(null);

  // Category and sub-category definitions for expenses
  const expenseCategorySubCategories = {
    Utsav: [
      "parayan",
      "dindi",
      "shivjayanti",
      "ganeshUtsav",
      "yatra",
      "navratra",
      "bailPola",
      "ashadhiEkadashi",
      "diwali",
      "dasra",
      "mahashivratri",
      "shreeKrushnaJanmashtami",
      "ramNavami",
    ],
    "Gala Kharch": [
      "bandhkam",
      "putalaKharch",
      "karmchariPagar",
      "karmchariKharch",
      "safayi",
      "itar",
    ],
    "Mandir Dekhbhal": [
      "bandhkam",
      "pooja",
      "karmchariPagar",
      "karmchariKharch",
      "safayi",
      "soundLightMaintenance",
      "flowerDecoration",
      "securityServices",
      "bijliBill",
      "paani",
      "itar",
    ],
  };

  // Clear sub-category when category changes
  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
      subCategory: "",
    });
    if (errors.category) {
      setErrors({ ...errors, category: undefined, subCategory: undefined });
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Common validations
    if (!formData.date) {
      newErrors.date = t("donations.dateRequired");
    }

    if (!formData.category) {
      newErrors.category = t("donations.categoryRequired");
    }

    if (!formData.subCategory) {
      newErrors.subCategory = t("donations.subCategoryRequired");
    }

    if (!formData.payeeName.trim()) {
      newErrors.payeeName = t("expenses.payeeNameRequired");
    }

    if (!formData.amount.trim()) {
      newErrors.amount = t("donations.amountRequired");
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = t("donations.amountInvalid");
      }
    }

    if (!formData.details.trim()) {
      newErrors.details = t("expenses.detailsRequired");
    }

    // Optional payee contact validation
    if (
      formData.payeeContact.trim() &&
      !/^\d{10}$/.test(formData.payeeContact.trim())
    ) {
      newErrors.payeeContact = t("expenses.payeeContactInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle amount input to allow only numbers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, amount: value });
      // Clear amount error when user starts typing valid number
      if (errors.amount) {
        setErrors({ ...errors, amount: undefined });
      }
    }
  };

  // Handle payee contact input
  const handlePayeeContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && value.length <= 10)) {
      setFormData({ ...formData, payeeContact: value });
      if (errors.payeeContact) {
        setErrors({ ...errors, payeeContact: undefined });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("expenses.validationError"));
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      date: formData.date!.toISOString().split("T")[0],
      type: "Expense",
      category: formData.category,
      subCategory: formData.subCategory,
      description: formData.details.trim(),
      amount: parseFloat(formData.amount),
      payeeName: formData.payeeName.trim(),
      payeeContact: formData.payeeContact.trim(),
      receiptImages: formData.receiptImages,
    };

    onAddExpense(newExpense);
    setLastAddedExpense(newExpense);
    setShowSuccessDialog(true);

    // Reset form
    setFormData({
      date: null,
      category: "",
      subCategory: "",
      payeeName: "",
      payeeContact: "",
      amount: "",
      details: "",
      receiptImages: [],
    });
    setErrors({});
  };

  const totalExpenses = (expenses ?? []).reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("expenses.addExpense")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <Label htmlFor="date">{t("donations.date")} *</Label>
                <DatePicker
                  date={formData.date || undefined}
                  onDateChange={(date) => {
                    setFormData({ ...formData, date: date || null });
                    if (errors.date) {
                      setErrors({ ...errors, date: undefined });
                    }
                  }}
                />
                {errors.date && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">{t("donations.category")} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger
                    className={errors.category ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={t("donations.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                    <SelectItem
                      className="hover:font-bold hover:bg-gray-100"
                      value="Utsav"
                    >
                      {t("expenses.utsav")}
                    </SelectItem>
                    <SelectItem
                      className="hover:font-bold hover:bg-gray-100"
                      value="Gala Kharch"
                    >
                      {t("expenses.galaKharch")}
                    </SelectItem>
                    <SelectItem
                      className="hover:font-bold hover:bg-gray-100"
                      value="Mandir Dekhbhal"
                    >
                      {t("expenses.mandirDekhbhal")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Sub-Category */}
              {formData.category && (
                <div>
                  <Label htmlFor="subCategory">
                    {t("donations.subCategory")} *
                  </Label>
                  <Select
                    value={formData.subCategory}
                    onValueChange={(value) => {
                      setFormData({ ...formData, subCategory: value });
                      if (errors.subCategory) {
                        setErrors({ ...errors, subCategory: undefined });
                      }
                    }}
                  >
                    <SelectTrigger
                      className={errors.subCategory ? "border-red-500" : ""}
                    >
                      <SelectValue
                        placeholder={t("donations.selectSubCategory")}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black border border-gray-200 shadow-lg">
                      {expenseCategorySubCategories[
                        formData.category as keyof typeof expenseCategorySubCategories
                      ]?.map((subCat) => (
                        <SelectItem key={subCat} value={subCat}>
                          {t(`expenses.${subCat}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subCategory && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.subCategory}
                    </p>
                  )}
                </div>
              )}

              {/* Payee Name */}
              <div>
                <Label htmlFor="payeeName">{t("expenses.payeeName")} *</Label>
                <Input
                  id="payeeName"
                  placeholder={t("expenses.enterPayeeName")}
                  value={formData.payeeName}
                  onChange={(e) => {
                    setFormData({ ...formData, payeeName: e.target.value });
                    if (errors.payeeName) {
                      setErrors({ ...errors, payeeName: undefined });
                    }
                  }}
                  className={errors.payeeName ? "border-red-500" : ""}
                />
                {errors.payeeName && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.payeeName}
                  </p>
                )}
              </div>

              {/* Payee Contact */}
              <div>
                <Label htmlFor="payeeContact">
                  {t("expenses.payeeContact")}
                </Label>
                <Input
                  id="payeeContact"
                  placeholder={t("expenses.enterPayeeContact")}
                  value={formData.payeeContact}
                  onChange={handlePayeeContactChange}
                  className={errors.payeeContact ? "border-red-500" : ""}
                />
                {errors.payeeContact && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.payeeContact}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount">
                  {t("common.amount")} ({t("common.currency")}) *
                </Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder={t("donations.enterAmount")}
                  value={formData.amount}
                  onChange={handleAmountChange}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.amount}
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div>
              <Label htmlFor="details">{t("expenses.details")} *</Label>
              <Textarea
                id="details"
                placeholder={t("expenses.enterDetails")}
                value={formData.details}
                onChange={(e) => {
                  setFormData({ ...formData, details: e.target.value });
                  if (errors.details) {
                    setErrors({ ...errors, details: undefined });
                  }
                }}
                className={errors.details ? "border-red-500" : ""}
              />
              {errors.details && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.details}
                </p>
              )}
            </div>

            {/* Receipt Images Upload */}
            <div>
              <FileUpload
                label={t("documents.uploadReceiptImage")}
                accept="image/*,application/pdf"
                maxSize={300}
                maxFiles={3}
                value={formData.receiptImages}
                onChange={(files) => {
                  setFormData({ ...formData, receiptImages: files });
                  if (errors.receiptImages) {
                    setErrors({ ...errors, receiptImages: undefined });
                  }
                }}
                placeholder={t("documents.dragAndDrop")}
                compressImages={true}
                quality={0.8}
                error={errors.receiptImages}
              />
            </div>

            <Button type="submit" className="w-full">
              {t("donations.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                {t("expenses.expenseSuccessTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("expenses.expenseSuccessMessage")}
            </DialogDescription>
          </DialogHeader>

          {lastAddedExpense && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-5 w-5 text-red-500" />
                <h4 className="font-medium">{t("expenses.expenseDetails")}</h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("donations.date")}:</span>
                  <span className="font-medium">
                    {formatDate(lastAddedExpense.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.category")}:
                  </span>
                  <span className="font-medium">
                    {lastAddedExpense.category === "Utsav" &&
                      t("expenses.utsav")}
                    {lastAddedExpense.category === "Gala Kharch" &&
                      t("expenses.galaKharch")}
                    {lastAddedExpense.category === "Mandir Dekhbhal" &&
                      t("expenses.mandirDekhbhal")}
                  </span>
                </div>
                {lastAddedExpense.subCategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("donations.subCategory")}:
                    </span>
                    <span className="font-medium">
                      {t(`expenses.${lastAddedExpense.subCategory}`)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("expenses.payeeName")}:
                  </span>
                  <span className="font-medium">
                    {lastAddedExpense.payeeName}
                  </span>
                </div>
                {lastAddedExpense.payeeContact && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("expenses.payeeContact")}:
                    </span>
                    <span className="font-medium">
                      {lastAddedExpense.payeeContact}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("common.amount")}:</span>
                  <span className="font-medium text-red-600 flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {lastAddedExpense.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("expenses.details")}:
                  </span>
                  <span className="font-medium">
                    {lastAddedExpense.description}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowSuccessDialog(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t("expenses.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-lg">
              {t("dashboard.totalExpenses")}:{" "}
              <span className="text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </p>
          </div>
          <TransactionTable transactions={expenses} />
        </CardContent>
      </Card>
    </div>
  );
}
