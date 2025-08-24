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
import TransactionTable from "./TransactionTable";
import { useLanguage } from "./LanguageContext";
import {
  Check,
  AlertCircle,
  Heart,
  IndianRupee,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";

interface DonationsProps {
  transactions: any[];
  onAddTransaction: (transaction: any) => void;
  onUpdateTransaction: (id: string, transaction: any) => void;
  onDeleteTransaction: (id: string) => void;
  receiptCounter: number;
  onUpdateReceiptCounter: (count: number) => void;
  currentUser: any;
}

interface ValidationErrors {
  date?: string;
  category?: string;
  subCategory?: string;
  description?: string;
  amount?: string;
  donorName?: string;
  donorContact?: string;
  familyMembers?: string;
  amountPerPerson?: string;
  purpose?: string;
}

// Category and sub-category definitions
const categorySubCategories = {
  Vargani: [
    "shivJayanti",
    "ganeshUtsav",
    "yatra",
    "navratri",
    "bailPola",
    "ashadhiEkadashi",
    "diwali",
    "dasra",
    "mahaShivratri",
    "shreekrishnaJanmashtami",
  ],
  Dengi: ["yatraUtsav", "bandkam", "itar"],
  "Shaskiy Nidhi": [
    "kendraShashan",
    "rajyaShashan",
    "mantriNidhi",
    "aamdarNidhi",
    "khajdarNidhi",
    "grampanchayat",
    "panchayatSamiti",
  ],
};

export default function Donations({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  receiptCounter,
  onUpdateReceiptCounter,
  currentUser,
}: DonationsProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    date: null as Date | null,
    category: "",
    subCategory: "",
    description: "",
    amount: "",
    donorName: "",
    donorContact: "",
    familyMembers: "",
    amountPerPerson: "",
    purpose: "",
    receiptNumber: receiptCounter.toString().padStart(4, "0"),
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastAddedDonation, setLastAddedDonation] = useState<any>(null);

  // Update receipt number when receiptCounter changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      receiptNumber: receiptCounter.toString().padStart(4, "0"),
    }));
  }, [receiptCounter]);

  // Calculate total amount for Vargani category
  useEffect(() => {
    if (
      formData.category === "Vargani" &&
      formData.familyMembers &&
      formData.amountPerPerson
    ) {
      const members = parseInt(formData.familyMembers);
      const amountPerPerson = parseFloat(formData.amountPerPerson);
      if (!isNaN(members) && !isNaN(amountPerPerson)) {
        const total = members * amountPerPerson;
        setFormData((prev) => ({
          ...prev,
          amount: total.toString(),
        }));
      }
    }
  }, [formData.familyMembers, formData.amountPerPerson, formData.category]);

  // Clear sub-category when category changes
  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
      subCategory: "",
      // Clear category-specific fields
      familyMembers: "",
      amountPerPerson: "",
      amount: value === "Vargani" ? "" : formData.amount,
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

    if (!formData.donorName.trim()) {
      newErrors.donorName = t("donations.donorNameInvalid");
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = t("donations.purposeRequired");
    }

    // Category-specific validations
    if (formData.category === "Vargani") {
      if (!formData.familyMembers.trim()) {
        newErrors.familyMembers = t("donations.familyMembersRequired");
      } else {
        const members = parseInt(formData.familyMembers);
        if (isNaN(members) || members <= 0) {
          newErrors.familyMembers = t("donations.familyMembersInvalid");
        }
      }

      if (!formData.amountPerPerson.trim()) {
        newErrors.amountPerPerson = t("donations.amountPerPersonRequired");
      } else {
        const amountPerPerson = parseFloat(formData.amountPerPerson);
        if (isNaN(amountPerPerson) || amountPerPerson <= 0) {
          newErrors.amountPerPerson = t("donations.amountPerPersonInvalid");
        }
      }
    } else {
      // For Dengi and Shaskiy Nidhi categories
      if (!formData.amount.trim()) {
        newErrors.amount = t("donations.amountRequired");
      } else {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
          newErrors.amount = t("donations.amountInvalid");
        }
      }
    }

    // Optional donor contact validation
    if (
      formData.donorContact.trim() &&
      !/^\d{10}$/.test(formData.donorContact.trim())
    ) {
      newErrors.donorContact = t("donations.donorContactInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle amount input for non-Vargani categories
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, amount: value });
      if (errors.amount) {
        setErrors({ ...errors, amount: undefined });
      }
    }
  };

  // Handle numeric inputs
  const handleNumericChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, [field]: value });
      if (errors[field as keyof ValidationErrors]) {
        setErrors({ ...errors, [field]: undefined });
      }
    }
  };

  // Handle contact input
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && value.length <= 10)) {
      setFormData({ ...formData, donorContact: value });
      if (errors.donorContact) {
        setErrors({ ...errors, donorContact: undefined });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("donations.validationError"));
      return;
    }

    const newDonation = {
      id: Date.now().toString(),
      date: formData.date!.toISOString().split("T")[0],
      type: "Donation",
      category: formData.category,
      sub_category: formData.subCategory,
      description: formData.purpose.trim(),
      amount: parseFloat(formData.amount),
      receipt_number: formData.receiptNumber,
      donor_name: formData.donorName.trim(),
      donor_contact: formData.donorContact.trim() || "",
      ...(formData.category === "Vargani" && {
        family_members: parseInt(formData.familyMembers),
        amount_per_person: parseFloat(formData.amountPerPerson),
      }),
    };

    try {
      await onAddTransaction(newDonation);
      setLastAddedDonation(newDonation);
      setShowSuccessDialog(true);

      // Reset form after successful submission
      setFormData({
        date: null,
        category: "",
        subCategory: "",
        description: "",
        amount: "",
        donorName: "",
        donorContact: "",
        familyMembers: "",
        amountPerPerson: "",
        purpose: "",
        receiptNumber: (receiptCounter + 1).toString().padStart(4, "0"),
      });
      setErrors({});
    } catch (error: any) {
      // Handle API errors - don't show success dialog
      toast.error(error.message || t("donations.addError"));
    }
  };

  const totalDonations = (transactions ?? []).reduce(
    (sum, donation) => sum + donation.amount,
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

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "subCategory":
        return formData.subCategory
          ? t(`donations.${formData.subCategory}`)
          : "";
      default:
        return t(`donations.${field}`);
    }
  };

  // Get dynamic donor name label based on category
  const getDonorNameLabel = () => {
    if (
      formData.category === "Dengi" ||
      formData.category === "Shaskiy Nidhi"
    ) {
      return t("donations.denagiDonorName");
    }
    return t("donations.donorName");
  };

  // Get dynamic donor contact label based on category
  const getDonorContactLabel = () => {
    if (
      formData.category === "Dengi" ||
      formData.category === "Shaskiy Nidhi"
    ) {
      return t("donations.denagiDonorContact");
    }
    return t("donations.donorContact");
  };

  // Get dynamic donor name placeholder based on category
  const getDonorNamePlaceholder = () => {
    if (
      formData.category === "Dengi" ||
      formData.category === "Shaskiy Nidhi"
    ) {
      return t("donations.enterDenagiDonorName");
    }
    return t("donations.enterDonorName");
  };

  // Get dynamic donor contact placeholder based on category
  const getDonorContactPlaceholder = () => {
    if (
      formData.category === "Dengi" ||
      formData.category === "Shaskiy Nidhi"
    ) {
      return t("donations.enterDenagiDonorContact");
    }
    return t("donations.enterDonorContact");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("donations.addDonation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Receipt Number */}
              <div>
                <Label htmlFor="receiptNumber">
                  {t("donations.receiptNumber")} *
                </Label>
                <Input
                  id="receiptNumber"
                  value={formData.receiptNumber}
                  disabled
                  className="bg-gray-50"
                />
              </div>

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
                      value="Vargani"
                    >
                      {t("donations.vargani")}
                    </SelectItem>
                    <SelectItem
                      className="hover:font-bold hover:bg-gray-100"
                      value="Dengi"
                    >
                      {t("donations.dengi")}
                    </SelectItem>
                    <SelectItem
                      className="hover:font-bold hover:bg-gray-100"
                      value="Shaskiy Nidhi"
                    >
                      {t("donations.shaskiyNighi")}
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
                      {categorySubCategories[
                        formData.category as keyof typeof categorySubCategories
                      ]?.map((subCat) => (
                        <SelectItem key={subCat} value={subCat}>
                          {t(`donations.${subCat}`)}
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

              {/* Donor Name */}
              <div>
                <Label htmlFor="donorName">{getDonorNameLabel()} *</Label>
                <Input
                  id="donorName"
                  placeholder={getDonorNamePlaceholder()}
                  value={formData.donorName}
                  onChange={(e) => {
                    setFormData({ ...formData, donorName: e.target.value });
                    if (errors.donorName) {
                      setErrors({ ...errors, donorName: undefined });
                    }
                  }}
                  className={errors.donorName ? "border-red-500" : ""}
                />
                {errors.donorName && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.donorName}
                  </p>
                )}
              </div>

              {/* Donor Contact */}
              <div>
                <Label htmlFor="donorContact">{getDonorContactLabel()}</Label>
                <Input
                  id="donorContact"
                  placeholder={getDonorContactPlaceholder()}
                  value={formData.donorContact}
                  onChange={handleContactChange}
                  className={errors.donorContact ? "border-red-500" : ""}
                />
                {errors.donorContact && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.donorContact}
                  </p>
                )}
              </div>

              {/* Vargani specific fields */}
              {formData.category === "Vargani" && (
                <>
                  <div>
                    <Label htmlFor="familyMembers">
                      {t("donations.familyMembers")} *
                    </Label>
                    <Input
                      id="familyMembers"
                      type="text"
                      placeholder={t("donations.enterFamilyMembers")}
                      value={formData.familyMembers}
                      onChange={(e) => handleNumericChange("familyMembers", e)}
                      className={errors.familyMembers ? "border-red-500" : ""}
                    />
                    {errors.familyMembers && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.familyMembers}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="amountPerPerson">
                      {t("donations.amountPerPerson")} ({t("common.currency")})
                      *
                    </Label>
                    <Input
                      id="amountPerPerson"
                      type="text"
                      placeholder={t("donations.enterAmountPerPerson")}
                      value={formData.amountPerPerson}
                      onChange={(e) =>
                        handleNumericChange("amountPerPerson", e)
                      }
                      className={errors.amountPerPerson ? "border-red-500" : ""}
                    />
                    {errors.amountPerPerson && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.amountPerPerson}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="totalAmount">
                      {t("donations.totalAmount")} ({t("common.currency")})
                    </Label>
                    <div className="relative">
                      <Calculator className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="totalAmount"
                        value={formData.amount}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Amount for non-Vargani categories */}
              {formData.category !== "Vargani" && formData.category && (
                <div>
                  <Label htmlFor="amount">
                    {t("donations.amount")} ({t("common.currency")}) *
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
              )}
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="purpose">{t("donations.purpose")} *</Label>
              <Textarea
                id="purpose"
                placeholder={t("donations.enterPurpose")}
                value={formData.purpose}
                onChange={(e) => {
                  setFormData({ ...formData, purpose: e.target.value });
                  if (errors.purpose) {
                    setErrors({ ...errors, purpose: undefined });
                  }
                }}
                className={errors.purpose ? "border-red-500" : ""}
              />
              {errors.purpose && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.purpose}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              {t("donations.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md  bg-orange-300">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-green-800">
                {t("donations.successTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {t("donations.successMessage")}
            </DialogDescription>
          </DialogHeader>

          {lastAddedDonation && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-red-500" />
                <h4 className="font-medium">
                  {t("donations.donationDetails")}
                </h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.receiptNumber")}:
                  </span>
                  <span className="font-medium">
                    {lastAddedDonation.receipt_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("donations.date")}:</span>
                  <span className="font-medium">
                    {formatDate(lastAddedDonation.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.category")}:
                  </span>
                  <span className="font-medium">
                    {t(
                      `donations.${lastAddedDonation.category
                        .toLowerCase()
                        .replace(" ", "")}`
                    )}
                  </span>
                </div>
                {lastAddedDonation.sub_category && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("donations.subCategory")}:
                    </span>
                    <span className="font-medium">
                      {t(`donations.${lastAddedDonation.sub_category}`)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.amount")}:
                  </span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {lastAddedDonation.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {lastAddedDonation.category === "Dengi" ||
                    lastAddedDonation.category === "Shaskiy Nidhi"
                      ? t("donations.denagiDonorName")
                      : t("donations.donorName")}
                    :
                  </span>
                  <span className="font-medium">
                    {lastAddedDonation.donor_name}
                  </span>
                </div>
                {lastAddedDonation.family_members && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("donations.familyMembers")}:
                    </span>
                    <span className="font-medium">
                      {lastAddedDonation.family_members}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donations.purpose")}:
                  </span>
                  <span className="font-medium">
                    {lastAddedDonation.description}
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
          <CardTitle>{t("donations.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-lg">
              {t("dashboard.totalDonations")}:{" "}
              <span className="text-green-600">
                {formatCurrency(totalDonations)}
              </span>
            </p>
          </div>
          <TransactionTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
