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
  | "credit-card";

export interface DonationHistoryItem {
  id: string;
  campaignTitle: string;
  receiptId?: string; // present when completed
  amount: number;
  dateISO: string;
  status: DonationStatus;
  method: PaymentMethod;
  taxDeductible: boolean;
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
