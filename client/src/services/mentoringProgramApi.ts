import api, { apiRequest, ApiResponse } from "@/lib/api";

export interface MentoringProgram {
  _id: string;
  category: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  programSchedule: "One-time" | "Recurring";
  programDuration: {
    startDate: string;
    endDate: string;
  };
  skillsRequired: string[];
  areasOfMentoring: {
    mentor: string[];
    mentee: string[];
  };
  entryCriteriaRules?: string;
  registrationEndDateMentee: string;
  registrationEndDateMentor: string;
  matchingEndDate: string;
  mentoringAgreementForm?: string;
  manager: string;
  coordinators: string[];
  reportsEscalationsTo: string[];
  registrationApprovalBy: string;
  emailTemplateMentorInvitation?: string;
  emailTemplateMenteeInvitation?: string;
  status: "draft" | "published" | "archived";
  mentorsPublished?: boolean;
  mentorsPublishedAt?: string;
  publishedMentorsCount?: number;
  createdBy: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramStatistics {
  totalMentors: number;
  totalMentees: number;
  approvedMentors: number;
  approvedMentees: number;
  pendingMentors: number;
  pendingMentees: number;
  matchedPairs: number;
  pendingMatches: number;
}

export interface CreateProgramData {
  category: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  programSchedule: "One-time" | "Recurring";
  programDuration: {
    startDate: string;
    endDate: string;
  };
  skillsRequired: string[];
  areasOfMentoring: {
    mentor: string[];
    mentee: string[];
  };
  entryCriteriaRules?: string;
  registrationEndDateMentee: string;
  registrationEndDateMentor: string;
  matchingEndDate: string;
  mentoringAgreementForm?: File;
  manager: string;
  coordinators: string[];
  reportsEscalationsTo: string[];
  registrationApprovalBy: string;
  emailTemplateMentorInvitation?: string;
  emailTemplateMenteeInvitation?: string;
}

export interface ProgramFilters {
  status?: "draft" | "published" | "archived";
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const mentoringProgramAPI = {
  // Create new program
  createProgram: async (programData: CreateProgramData): Promise<ApiResponse<MentoringProgram>> => {
    const formData = new FormData();
    
    Object.keys(programData).forEach((key) => {
      const value = (programData as any)[key];
      if (key === 'mentoringAgreementForm' && value instanceof File) {
        formData.append('mentoringAgreementForm', value);
      } else if (key === 'programDuration' && typeof value === 'object' && value !== null) {
        // Send nested object as JSON string
        formData.append('programDuration', JSON.stringify(value));
      } else if (key === 'areasOfMentoring' && typeof value === 'object' && value !== null) {
        // Send nested object as JSON string
        formData.append('areasOfMentoring', JSON.stringify(value));
      } else if (Array.isArray(value)) {
        // For arrays, send each item (FormData will handle multiple values with same key)
        if (value.length === 0) {
          // Don't append empty arrays
          return;
        }
        value.forEach((item) => {
          if (item !== null && item !== undefined) {
            formData.append(key, item.toString());
          }
        });
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    return apiRequest({
      method: "POST",
      url: "/mentoring-programs",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get all programs with filters
  getAllPrograms: async (filters?: ProgramFilters): Promise<ApiResponse<{ programs: MentoringProgram[]; pagination?: any }>> => {
    return apiRequest({
      method: "GET",
      url: "/mentoring-programs",
      params: filters,
    });
  },

  // Get program by ID
  getProgramById: async (id: string): Promise<ApiResponse<{ program: MentoringProgram }>> => {
    return apiRequest({
      method: "GET",
      url: `/mentoring-programs/${id}`,
    });
  },

  // Update program
  updateProgram: async (id: string, programData: Partial<CreateProgramData>): Promise<ApiResponse<MentoringProgram>> => {
    const formData = new FormData();
    
    Object.keys(programData).forEach((key) => {
      const value = (programData as any)[key];
      if (key === 'mentoringAgreementForm' && value instanceof File) {
        formData.append('mentoringAgreementForm', value);
      } else if (key === 'programDuration' && typeof value === 'object' && value !== null) {
        // Send nested object as JSON string
        formData.append('programDuration', JSON.stringify(value));
      } else if (key === 'areasOfMentoring' && typeof value === 'object' && value !== null) {
        // Send nested object as JSON string
        formData.append('areasOfMentoring', JSON.stringify(value));
      } else if (Array.isArray(value)) {
        // For arrays, send each item
        if (value.length === 0) {
          // Don't append empty arrays
          return;
        }
        value.forEach((item) => {
          if (item !== null && item !== undefined) {
            formData.append(key, item.toString());
          }
        });
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    return apiRequest({
      method: "PUT",
      url: `/mentoring-programs/${id}`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Publish program
  publishProgram: async (id: string): Promise<ApiResponse<MentoringProgram>> => {
    return apiRequest({
      method: "PUT",
      url: `/mentoring-programs/${id}/publish`,
    });
  },

  // Unpublish program
  unpublishProgram: async (id: string): Promise<ApiResponse<MentoringProgram>> => {
    return apiRequest({
      method: "PUT",
      url: `/mentoring-programs/${id}/unpublish`,
    });
  },

  // Delete program
  deleteProgram: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest({
      method: "DELETE",
      url: `/mentoring-programs/${id}`,
    });
  },

  // Get program statistics
  getProgramStatistics: async (id: string): Promise<ApiResponse<{ statistics: ProgramStatistics; program: MentoringProgram }>> => {
    return apiRequest({
      method: "GET",
      url: `/mentoring-programs/${id}/statistics`,
    });
  },
};

