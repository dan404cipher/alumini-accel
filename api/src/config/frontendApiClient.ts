// Frontend API Client Example
// This file shows how to implement API calls in the frontend
// Note: This is a frontend example - localStorage and fetch are browser APIs

import { API_CONFIG, HTTP_METHODS, STATUS_CODES } from "./apiConfig";

// Browser environment types (for frontend use)
// Note: These types are for frontend development - they won't exist in Node.js backend

// Type declarations for browser APIs (for frontend use only)
declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

declare const fetch: (input: string, init?: RequestInit) => Promise<Response>;

type HeadersInit = Record<string, string>;

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// API Client Class
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem("auth_token");
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = (await response.json()) as ApiResponse<T>;

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === STATUS_CODES.UNAUTHORIZED) {
          this.clearToken();
          // Redirect to login or trigger auth refresh
        }

        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Authentication methods
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>(API_CONFIG.AUTH.LOGIN, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>(API_CONFIG.AUTH.LOGOUT, {
      method: HTTP_METHODS.POST,
    });

    if (response.success) {
      this.clearToken();
    }

    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>(
      API_CONFIG.AUTH.REFRESH,
      {
        method: HTTP_METHODS.POST,
      }
    );

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  // User management methods
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ users: User[]; pagination: any }>> {
    const queryString = new URLSearchParams();

    if (params?.page) queryString.append("page", params.page.toString());
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.role) queryString.append("role", params.role);
    if (params?.status) queryString.append("status", params.status);
    if (params?.search) queryString.append("search", params.search);

    const endpoint = `${API_CONFIG.USERS.GET_ALL}${queryString.toString() ? `?${queryString}` : ""}`;

    return this.request<{ users: User[]; pagination: any }>(endpoint);
  }

  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(API_CONFIG.USERS.GET_BY_ID(id));
  }

  async updateProfile(
    profileData: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(API_CONFIG.USERS.UPDATE_PROFILE, {
      method: HTTP_METHODS.PUT,
      body: JSON.stringify(profileData),
    });
  }

  async searchUsers(params: {
    q?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ users: User[]; pagination: any }>> {
    const queryString = new URLSearchParams();

    if (params.q) queryString.append("q", params.q);
    if (params.role) queryString.append("role", params.role);
    if (params.status) queryString.append("status", params.status);
    if (params.page) queryString.append("page", params.page.toString());
    if (params.limit) queryString.append("limit", params.limit.toString());

    const endpoint = `${API_CONFIG.USERS.SEARCH}?${queryString}`;

    return this.request<{ users: User[]; pagination: any }>(endpoint);
  }

  // Alumni profile methods
  async getAllAlumni(params?: {
    page?: number;
    limit?: number;
    batchYear?: number;
    department?: string;
    isHiring?: boolean;
    availableForMentorship?: boolean;
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams();

    if (params?.page) queryString.append("page", params.page.toString());
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.batchYear)
      queryString.append("batchYear", params.batchYear.toString());
    if (params?.department) queryString.append("department", params.department);
    if (params?.isHiring !== undefined)
      queryString.append("isHiring", params.isHiring.toString());
    if (params?.availableForMentorship !== undefined)
      queryString.append(
        "availableForMentorship",
        params.availableForMentorship.toString()
      );

    const endpoint = `${API_CONFIG.ALUMNI.GET_ALL}${queryString.toString() ? `?${queryString}` : ""}`;

    return this.request<any>(endpoint);
  }

  // Event methods
  async getAllEvents(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    isOnline?: boolean;
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams();

    if (params?.page) queryString.append("page", params.page.toString());
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.type) queryString.append("type", params.type);
    if (params?.status) queryString.append("status", params.status);
    if (params?.isOnline !== undefined)
      queryString.append("isOnline", params.isOnline.toString());

    const endpoint = `${API_CONFIG.EVENTS.GET_ALL}${queryString.toString() ? `?${queryString}` : ""}`;

    return this.request<any>(endpoint);
  }

  async createEvent(eventData: any): Promise<ApiResponse<any>> {
    return this.request<any>(API_CONFIG.EVENTS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(eventData),
    });
  }

  // Job methods
  async getAllJobs(params?: {
    page?: number;
    limit?: number;
    type?: string;
    remote?: boolean;
    location?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams();

    if (params?.page) queryString.append("page", params.page.toString());
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.type) queryString.append("type", params.type);
    if (params?.remote !== undefined)
      queryString.append("remote", params.remote.toString());
    if (params?.location) queryString.append("location", params.location);

    const endpoint = `${API_CONFIG.JOBS.GET_ALL}${queryString.toString() ? `?${queryString}` : ""}`;

    return this.request<any>(endpoint);
  }

  async createJob(jobData: any): Promise<ApiResponse<any>> {
    return this.request<any>(API_CONFIG.JOBS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(jobData),
    });
  }

  // File upload method
  async uploadFile(
    file: File,
    type: "profile-picture" | "resume" | "event-image" | "job-image"
  ): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append("file", file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    // Remove Content-Type for FormData (browser sets it automatically)

    return this.request<{ url: string }>(
      API_CONFIG.UPLOADS[type.toUpperCase() as keyof typeof API_CONFIG.UPLOADS],
      {
        method: HTTP_METHODS.POST,
        headers,
        body: formData,
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>(API_CONFIG.HEALTH);
  }

  // Get API documentation
  async getApiDocs(): Promise<ApiResponse<any>> {
    return this.request<any>(API_CONFIG.DOCS);
  }
}

// Create and export a default instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  login,
  logout,
  refreshToken,
  getAllUsers,
  getUserById,
  updateProfile,
  searchUsers,
  getAllAlumni,
  getAllEvents,
  createEvent,
  getAllJobs,
  createJob,
  uploadFile,
  healthCheck,
  getApiDocs,
} = apiClient;

export default apiClient;
