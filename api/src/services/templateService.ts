import { IEmailTemplate } from "../types";

// Available template variables documentation
export const AVAILABLE_VARIABLES = {
  programName: "{{programName}}",
  programCategory: "{{programCategory}}",
  mentorName: "{{mentorName}}",
  menteeName: "{{menteeName}}",
  registrationLink: "{{registrationLink}}",
  mentorSelectionLink: "{{mentorSelectionLink}}",
  studentID: "{{studentID}}",
  rejectionReason: "{{rejectionReason}}",
  approvalMessage: "{{approvalMessage}}",
  coordinatorName: "{{coordinatorName}}",
  programManagerName: "{{programManagerName}}",
  registrationDeadline: "{{registrationDeadline}}",
  mentorRegistrationDeadline: "{{mentorRegistrationDeadline}}",
  menteeRegistrationDeadline: "{{menteeRegistrationDeadline}}",
  matchingEndDate: "{{matchingEndDate}}",
  preferredName: "{{preferredName}}",
  firstName: "{{firstName}}",
  lastName: "{{lastName}}",
  personalEmail: "{{personalEmail}}",
  sitEmail: "{{sitEmail}}",
  classOf: "{{classOf}}",
};

// Variable data interface
export interface VariableData {
  programName?: string;
  programCategory?: string;
  mentorName?: string;
  menteeName?: string;
  registrationLink?: string;
  mentorSelectionLink?: string;
  studentID?: string;
  rejectionReason?: string;
  approvalMessage?: string;
  coordinatorName?: string;
  programManagerName?: string;
  registrationDeadline?: string;
  mentorRegistrationDeadline?: string;
  menteeRegistrationDeadline?: string;
  matchingEndDate?: string;
  preferredName?: string;
  firstName?: string;
  lastName?: string;
  personalEmail?: string;
  sitEmail?: string;
  classOf?: string;
  [key: string]: any; // Allow custom variables
}

// Replace template variables with actual data
export const replaceTemplateVariables = (
  template: string,
  data: VariableData
): string => {
  let result = template;

  // Replace all variables
  Object.keys(AVAILABLE_VARIABLES).forEach((key) => {
    const placeholder = AVAILABLE_VARIABLES[key as keyof typeof AVAILABLE_VARIABLES];
    const value = data[key] || "";
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), String(value));
  });

  // Replace any remaining {{variable}} patterns
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });

  return result;
};

// Extract variables from template
export const extractVariables = (template: string): string[] => {
  const variables: string[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
};

// Get variable documentation for a template type
export const getVariableDocumentation = (
  templateType: string
): { variable: string; description: string }[] => {
  const baseVars = [
    { variable: "{{programName}}", description: "Name of the mentoring program" },
    { variable: "{{programCategory}}", description: "Category of the mentoring program" },
    { variable: "{{coordinatorName}}", description: "Name of the program coordinator" },
    { variable: "{{programManagerName}}", description: "Name of the program manager" },
  ];

  const typeSpecificVars: Record<string, { variable: string; description: string }[]> = {
    mentor_invitation: [
      { variable: "{{mentorName}}", description: "Name of the mentor" },
      { variable: "{{preferredName}}", description: "Preferred name of the mentor" },
      { variable: "{{registrationLink}}", description: "Link to mentor registration form" },
      { variable: "{{mentorRegistrationDeadline}}", description: "Mentor registration deadline" },
    ],
    mentee_invitation: [
      { variable: "{{menteeName}}", description: "Name of the mentee" },
      { variable: "{{registrationLink}}", description: "Public registration link for mentee" },
      { variable: "{{menteeRegistrationDeadline}}", description: "Mentee registration deadline" },
    ],
    registration_acknowledgement: [
      { variable: "{{mentorName}}", description: "Name of the registrant (mentor)" },
      { variable: "{{menteeName}}", description: "Name of the registrant (mentee)" },
      { variable: "{{preferredName}}", description: "Preferred name" },
      { variable: "{{firstName}}", description: "First name" },
      { variable: "{{lastName}}", description: "Last name" },
    ],
    welcome_mentee: [
      { variable: "{{menteeName}}", description: "Name of the mentee" },
      { variable: "{{mentorSelectionLink}}", description: "Link to select preferred mentors" },
      { variable: "{{studentID}}", description: "Student ID" },
      { variable: "{{matchingEndDate}}", description: "Date when mentor matching ends" },
    ],
    mentor_match_request: [
      { variable: "{{mentorName}}", description: "Name of the mentor" },
      { variable: "{{menteeName}}", description: "Name of the mentee" },
      { variable: "{{preferredName}}", description: "Preferred name" },
    ],
    rejection_notification: [
      { variable: "{{mentorName}}", description: "Name of the registrant (mentor)" },
      { variable: "{{menteeName}}", description: "Name of the registrant (mentee)" },
      { variable: "{{rejectionReason}}", description: "Reason for rejection" },
      { variable: "{{preferredName}}", description: "Preferred name" },
    ],
    approval_notification: [
      { variable: "{{mentorName}}", description: "Name of the registrant (mentor)" },
      { variable: "{{menteeName}}", description: "Name of the registrant (mentee)" },
      { variable: "{{approvalMessage}}", description: "Approval message" },
      { variable: "{{preferredName}}", description: "Preferred name" },
    ],
  };

  return [...baseVars, ...(typeSpecificVars[templateType] || [])];
};

