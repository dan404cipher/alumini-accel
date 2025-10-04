// Main export
export { default as DonationManagementSystem } from "./DonationManagementSystem";

// Component exports
export { default as DonationCard } from "./components/DonationCard";
export { default as DonationTable } from "./components/DonationTable";

// Modal exports
export { default as CampaignModal } from "./modals/CampaignModal";
export { default as DonationModal } from "./modals/DonationModal";

// Hook exports
export { useDonationManagement } from "./hooks/useDonationManagement";

// Type exports
export type {
  Campaign,
  CampaignForm,
  ErrorState,
  DonationStatus,
  PaymentMethod,
  DonationHistoryItem,
  DonationCardProps,
  DonationModalProps,
  CampaignModalProps,
} from "./types";

// Utility exports
export {
  formatINR,
  formatDateShort,
  formatEndDateLabel,
  calculateProgressPercentage,
  generateReceiptId,
  generateDonationId,
  downloadReceipt,
  exportToCSV,
  shareCampaign,
} from "./utils";
