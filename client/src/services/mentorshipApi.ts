// Mentorship API Service
// Author: AI Assistant
// Purpose: API service layer for mentorship management

import { getAuthTokenOrNull } from "@/utils/auth";
import { API_BASE_URL } from "@/lib/api";

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface MentorshipApiData {
  mentorships: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MentorshipRequest {
  mentorId: string;
  menteeId?: string;
  domain: string;
  message?: string;
  goals?: string[];
  timeCommitment?: string;
  communicationMethod?: string;
}

interface MentorshipSession {
  date: string;
  duration: number;
  type: string;
  notes?: string;
  rating?: number;
}

interface MentorshipFeedback {
  from: "mentor" | "mentee";
  rating: number;
  comment: string;
  type: "mentor" | "mentee";
}

class MentorshipApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get token from localStorage or sessionStorage (same logic as AuthContext)
    const token = getAuthTokenOrNull();

    if (!token) {
      throw new Error("Access token is required");
    }

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // For 400 Bad Request, return the response data instead of throwing
        // This allows the frontend to handle business logic responses properly
        if (response.status === 400) {
          return errorData;
        }

        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Mentorship Management
  async getAllMentorships(params?: {
    page?: number;
    limit?: number;
    status?: string;
    domain?: string;
  }): Promise<ApiResponse<MentorshipApiData>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.domain) queryParams.append("domain", params.domain);

    const queryString = queryParams.toString();
    const endpoint = `/mentorship${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<ApiResponse<MentorshipApiData>>(endpoint);
  }

  async getMentorshipById(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(`/mentorship/${id}`);
  }

  async createMentorship(data: MentorshipRequest): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>("/mentorship", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async acceptMentorship(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(`/mentorship/${id}/accept`, {
      method: "PUT",
    });
  }

  async rejectMentorship(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(`/mentorship/${id}/reject`, {
      method: "PUT",
    });
  }

  async completeMentorship(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(`/mentorship/${id}/complete`, {
      method: "PUT",
    });
  }

  async updateMentorship(
    id: string,
    data: {
      domain?: string;
      goals?: string[];
      duration?: number;
      startDate?: string;
      endDate?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(`/mentorship/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMentorship(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(`/mentorship/${id}`, {
      method: "DELETE",
    });
  }

  // Mentorship Sessions
  async addSession(
    mentorshipId: string,
    sessionData: MentorshipSession
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(
      `/mentorship/${mentorshipId}/sessions`,
      {
        method: "POST",
        body: JSON.stringify(sessionData),
      }
    );
  }

  async updateSession(
    mentorshipId: string,
    sessionId: string,
    sessionData: Partial<MentorshipSession>
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(
      `/mentorship/${mentorshipId}/sessions/${sessionId}`,
      {
        method: "PUT",
        body: JSON.stringify(sessionData),
      }
    );
  }

  // Mentorship Feedback
  async submitFeedback(
    mentorshipId: string,
    feedback: MentorshipFeedback
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>(
      `/mentorship/${mentorshipId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify(feedback),
      }
    );
  }

  // User-Specific Endpoints
  async getMyMentorships(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<MentorshipApiData>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/mentorship/my-mentorships${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<ApiResponse<MentorshipApiData>>(endpoint);
  }

  async getActiveMentorships(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<ApiResponse<any[]>>("/mentorship/active");
  }

  async getPendingMentorships(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<ApiResponse<any[]>>("/mentorship/pending");
  }

  // Alumni Mentors
  async getMentors(params?: {
    page?: number;
    limit?: number;
    domain?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.domain) queryParams.append("domain", params.domain);

    const queryString = queryParams.toString();
    const endpoint = `/alumni/mentors${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<ApiResponse<any>>(endpoint);
  }

  // Register as mentor
  async registerAsMentor(data: {
    mentorshipDomains: string[];
    availableSlots?: Array<{ day: string; timeSlots: string[] }>;
    mentoringStyle?: string;
    availableHours?: string;
    timezone?: string;
    bio?: string;
    testimonials?: Array<{ content: string; author: string; date: Date }>;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<ApiResponse<any>>("/alumni/register-mentor", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Utility Methods
  async checkApiHealth(): Promise<boolean> {
    try {
      await this.makeRequest("/mentorship?limit=1");
      return true;
    } catch (error) {
      console.warn("Mentorship API not available:", error);
      return false;
    }
  }
}

// Create and export singleton instance
export const mentorshipApi = new MentorshipApiService();

// Export types for use in components
export type {
  ApiResponse,
  MentorshipApiData,
  MentorshipRequest,
  MentorshipSession,
  MentorshipFeedback,
};
