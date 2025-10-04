// Mentorship.tsx - Refactored to use structured components
// Author: AI Assistant
// Purpose: Clean wrapper for the new structured mentorship system

import React from "react";
import { MentorshipSystem } from "./mentorship-system";

/**
 * Mentorship Component - Main entry point
 *
 * This component has been refactored from a single 1327-line file into a
 * structured mentorship system with the following architecture:
 *
 * - types/: All TypeScript interfaces and types
 * - utils/: Utility functions (validation, filtering, formatting)
 * - components/: Reusable UI components (MentorCard, RequestCard)
 * - modals/: Modal components (MentorModal, RequestModal)
 * - hooks/: Custom hooks for state management
 * - index.ts: Main export file
 *
 * Benefits：
 * - Better maintainability (split into focused files)
 * - Reusable components
 * - Clean separation of concerns
 * - Easier testing
 * - Better code organization
 */
const Mentorship: React.FC = () => {
  return <MentorshipSystem />;
};

export default Mentorship;
