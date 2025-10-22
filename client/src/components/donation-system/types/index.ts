// Donation Management Types
export interface Campaign {
  _id?: string; // For API compatibility
  title: string;
  description: string;
  category: string;
  amount: string; // store as string from input, cast on use
  endDate: string; // ISO date
  imageUrl: string;
  raised: number;
  donors: number;
}

export interface CampaignForm
  extends Pick<
    Campaign,
    "title" | "description" | "category" | "amount" | "endDate" | "imageUrl"
  > {
  imageFile?: File | null;
  imagePreviewUrl?: string;
  campaignId?: string; // For editing existing campaigns
}

export interface ErrorState {
  title: string;
  description: string;
  amount: string;
  endDate: string;
}

export type DonationStatus = "Processing" | "Completed" | "Failed";
export type PaymentMethod =
  | "UPI"
  | "Credit Card"
  | "Bank Transfer"
  | "Net Banking"
  | "UPI QR"
  | "Wallet"
  | "EMI"
  | "Razorpay";

export interface DonorInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
  anonymous: boolean;
}

export interface PaymentDetails {
  method: PaymentMethod;
  upiId?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface DonationFormData {
  amount: number;
  donorInfo: DonorInfo;
  paymentDetails: PaymentDetails;
  taxDeductible: boolean;
  message?: string;
  recurring?: boolean;
  recurringFrequency?: "monthly" | "quarterly" | "yearly";
}

export interface DonationReceipt {
  receiptId: string;
  donorName: string;
  amount: number;
  campaignTitle: string;
  date: string;
  paymentMethod: PaymentMethod;
  taxDeductible: boolean;
  transactionId?: string;
}

export interface DonationHistoryItem {
  id: string;
  campaignTitle: string;
  receiptId?: string; // present when completed
  amount: number;
  dateISO: string;
  status: DonationStatus;
  method: PaymentMethod;
  taxDeductible: boolean;
  // Donor information
  donorInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    anonymous?: boolean;
  };
}

export interface DonationCardProps {
  category: string;
  status: "Active" | "Ended";
  imageUrl: string;
  title: string;
  description: string;
  raisedAmount: number; // in rupees
  targetAmount: number; // in rupees
  donorsCount: number;
  by: string;
  endDateLabel: string; // e.g., "Ends Apr 15, 2025"
  onDonate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onViewDetails?: () => void;
}

export interface DonationModalProps {
  open: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  campaignIndex: number | null;
}

export interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
  editData?: CampaignForm;
  editIndex?: number | null;
}
