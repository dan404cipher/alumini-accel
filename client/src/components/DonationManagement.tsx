// DonationManagement.tsx - Refactored to use structured components
import React from "react";
import { DonationManagementSystem } from "./donation-system";

// Removed unused interface - component takes no props

/**
 * Donation Management Component - Main entry point
 *
 * This component has been refactored from a single 1626-line file into a
 * structured donation system with the following architecture:
 *
 * - types/: All TypeScript interfaces and types
 * - utils/: Utility functions (formatters, generators, etc.)
 * - components/: Reusable UI components (DonationCard, DonationTable)
 * - modals/: Modal components (CampaignModal, DonationModal)
 * - hooks/: Custom hooks for state management
 * - index.ts: Main export file
 *
 * Benefits:
 * - Better maintainability (split into focused files)
 * - Reusable components
 * - Clean separation of concerns
 * - Easier testing
 * - Better code organization
 */
const DonationManagement: React.FC = () => {
  return <DonationManagementSystem />;
};

export default DonationManagement;
