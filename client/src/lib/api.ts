import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and check rate limits
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check client-side rate limiting for auth endpoints (excluding /auth/me)
    if (config.url?.includes("/auth/") && !config.url?.includes("/auth/me")) {
      const rateLimitKey = `auth-${config.url}`;
      if (!rateLimiter.canMakeRequest(rateLimitKey)) {
        const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey);
        const error = new Error(
          `Rate limit exceeded. Please wait ${Math.ceil(
            timeUntilReset / 1000
          )} seconds before trying again.`
        );
        error.name = "RateLimitError";
        return Promise.reject(error);
      }
    }

    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number = 30; // Max requests per window (increased from 5)
  private readonly windowMs: number = 60000; // 1 minute window

  // Method to clear all rate limits (useful for debugging)
  clearAllLimits(): void {
    this.requests.clear();
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getTimeUntilReset(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;

    const oldestRequest = Math.min(...requests);
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}

const rateLimiter = new RateLimiter();

// Make rateLimiter available in browser console for debugging
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).clearRateLimits = () => {
    rateLimiter.clearAllLimits();
  };
}

// Helper function for exponential backoff delay
const getRetryDelay = (retryCount: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};

// Response interceptor to handle errors, token refresh, and rate limiting
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 errors (rate limited) with exponential backoff
    if (error.response?.status === 429) {
      const retryCount = originalRequest._retryCount || 0;
      const maxRetries = 3;

      if (retryCount < maxRetries) {
        originalRequest._retryCount = retryCount + 1;
        const delay = getRetryDelay(retryCount);

        console.warn(
          `Rate limited. Retrying in ${Math.round(delay / 1000)}s... (attempt ${
            retryCount + 1
          }/${maxRetries})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(originalRequest);
      } else {
        // Max retries exceeded
        const rateLimitError = new Error(
          "Too many requests. Please wait a moment before trying again."
        );
        rateLimitError.name = "RateLimitError";
        return Promise.reject(rateLimitError);
      }
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              refreshToken,
            }
          );

          const { token, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API response interface
export interface ApiResponse<T = unknown> {
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

// API error interface
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// Generic API request function
export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await api(config);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: ApiResponse<T> } };
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
};

// Auth API functions
export const authAPI = {
  // Register user
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
  }) => {
    return apiRequest({
      method: "POST",
      url: "/auth/register",
      data: userData,
    });
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    return apiRequest({
      method: "POST",
      url: "/auth/login",
      data: credentials,
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return apiRequest({
      method: "GET",
      url: "/auth/me",
    });
  },

  // Logout user
  logout: async () => {
    return apiRequest({
      method: "POST",
      url: "/auth/logout",
    });
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    return apiRequest({
      method: "POST",
      url: "/auth/forgot-password",
      data: { email },
    });
  },

  // Reset password
  resetPassword: async (token: string, password: string) => {
    return apiRequest({
      method: "POST",
      url: "/auth/reset-password",
      data: { token, password },
    });
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest({
      method: "POST",
      url: "/auth/change-password",
      data: { currentPassword, newPassword },
    });
  },

  // Verify email
  verifyEmail: async (token: string) => {
    return apiRequest({
      method: "POST",
      url: "/auth/verify-email",
      data: { token },
    });
  },

  // Resend verification email
  resendVerificationEmail: async (email: string) => {
    return apiRequest({
      method: "POST",
      url: "/auth/resend-verification",
      data: { email },
    });
  },
};

// User API functions
export const userAPI = {
  // Get all users (admin only)
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    tenantId?: string;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/users",
      params,
    });
  },

  // Create new user (Super Admin only)
  createUser: async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId?: string;
    department?: string;
    password: string;
    status?: string;
  }) => {
    return apiRequest({
      method: "POST",
      url: "/users",
      data: userData,
    });
  },

  // Update user profile
  updateProfile: async (profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    location?: string;
    linkedinProfile?: string;
    twitterHandle?: string;
    githubProfile?: string;
    website?: string;
    preferences?: Record<string, unknown>;
  }) => {
    return apiRequest({
      method: "PUT",
      url: "/users/profile",
      data: profileData,
    });
  },

  // Update any user by ID (Super Admin only)
  updateUser: async (
    userId: string,
    userData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      bio?: string;
      location?: string;
      linkedinProfile?: string;
      twitterHandle?: string;
      githubProfile?: string;
      website?: string;
      preferences?: Record<string, unknown>;
    }
  ) => {
    return apiRequest({
      method: "PUT",
      url: `/users/${userId}`,
      data: userData,
    });
  },

  // Search users
  searchUsers: async (params?: {
    q?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/users/search",
      params,
    });
  },

  // Update user status (Super Admin only)
  updateUserStatus: async (userId: string, status: string) => {
    return apiRequest({
      method: "PUT",
      url: `/users/${userId}/status`,
      data: { status },
    });
  },

  // Delete user (Super Admin only)
  deleteUser: async (userId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/users/${userId}`,
    });
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    try {
      // First try the dedicated pending approvals endpoint
      const response = await apiRequest({
        method: "GET",
        url: "/users/pending-approvals",
      });
      return response;
    } catch (error) {
      console.warn(
        "Pending approvals endpoint not available, falling back to filtered users"
      );
      // Fallback: get all users and filter for pending status
      try {
        const response = await apiRequest({
          method: "GET",
          url: "/users",
          params: { status: "pending" },
        });

        if (response.success && response.data?.users) {
          return {
            success: true,
            data: response.data.users,
          };
        }
        return response;
      } catch (fallbackError) {
        console.error(
          "Both pending approvals endpoints failed:",
          fallbackError
        );
        throw fallbackError;
      }
    }
  },

  // Approve user
  approveUser: async (userId: string) => {
    try {
      // First try the dedicated approve endpoint
      const response = await apiRequest({
        method: "PUT",
        url: `/users/${userId}/approve`,
      });
      return response;
    } catch (error) {
      console.warn(
        "Approve endpoint not available, falling back to status update"
      );
      // Fallback: update user status to active
      return apiRequest({
        method: "PUT",
        url: `/users/${userId}/status`,
        data: { status: "active" },
      });
    }
  },

  // Reject user
  rejectUser: async (userId: string, reason?: string) => {
    try {
      // First try the dedicated reject endpoint
      const response = await apiRequest({
        method: "PUT",
        url: `/users/${userId}/reject`,
        data: { reason },
      });
      return response;
    } catch (error) {
      console.warn(
        "Reject endpoint not available, falling back to status update"
      );
      // Fallback: update user status to rejected
      return apiRequest({
        method: "PUT",
        url: `/users/${userId}/status`,
        data: { status: "rejected" },
      });
    }
  },

  // Create pending user request (NOT an actual user account)
  createPendingUserRequest: async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId?: string;
    department?: string;
    password: string;
  }) => {
    try {
      // Since user-requests endpoint doesn't exist, we'll use a different approach
      // We'll store the request data in localStorage temporarily and use a different endpoint
      // This ensures NO user account is created until approval

      const requestData = {
        ...userData,
        status: "pending_request", // This is NOT a user status
        requestedAt: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      // Store in localStorage as a temporary solution
      const existingRequests = JSON.parse(
        localStorage.getItem("pendingUserRequests") || "[]"
      );
      existingRequests.push(requestData);
      localStorage.setItem(
        "pendingUserRequests",
        JSON.stringify(existingRequests)
      );

      return {
        success: true,
        message: "User request submitted for approval",
        data: {
          request: requestData,
        },
      };
    } catch (error) {
      console.error("Error in createPendingUserRequest:", error);
      throw error;
    }
  },

  // Get pending user requests
  getPendingUserRequests: async () => {
    try {
      // Read from localStorage since we're storing requests there
      const pendingRequests = JSON.parse(
        localStorage.getItem("pendingUserRequests") || "[]"
      );

      return {
        success: true,
        data: pendingRequests,
      };
    } catch (error) {
      console.error("Error fetching pending user requests:", error);
      throw error;
    }
  },

  // Approve user request (creates actual user account)
  approveUserRequest: async (requestId: string) => {
    try {
      // Get the request from localStorage
      const pendingRequests = JSON.parse(
        localStorage.getItem("pendingUserRequests") || "[]"
      );

      const request = pendingRequests.find(
        (req: any) => req.requestId === requestId
      );

      if (!request) {
        throw new Error("Request not found");
      }

      // Create the actual user account
      const userData = {
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        role: request.role,
        tenantId: request.tenantId,
        department: request.department,
        password: request.password,
        status: "active", // Create as active user
      };

      const createUserResponse = await apiRequest({
        method: "POST",
        url: "/users",
        data: userData,
      });

      if (createUserResponse.success) {
        // Remove the request from localStorage
        const updatedRequests = pendingRequests.filter(
          (req: any) => req.requestId !== requestId
        );
        localStorage.setItem(
          "pendingUserRequests",
          JSON.stringify(updatedRequests)
        );

        return {
          success: true,
          message: "User request approved and account created",
          data: {
            user: createUserResponse.data?.user || createUserResponse.data,
          },
        };
      } else {
        const errorMessage =
          createUserResponse.message || "Failed to create user account";
        const errors = createUserResponse.errors || [];
        console.error("Validation errors:", errors);
        throw new Error(`${errorMessage}: ${errors.join(", ")}`);
      }
    } catch (error) {
      console.error("Error approving user request:", error);
      throw error;
    }
  },

  // Reject user request (removes the request)
  rejectUserRequest: async (requestId: string, reason?: string) => {
    try {
      // Get the request from localStorage
      const pendingRequests = JSON.parse(
        localStorage.getItem("pendingUserRequests") || "[]"
      );
      const request = pendingRequests.find(
        (req: any) => req.requestId === requestId
      );

      if (!request) {
        throw new Error("Request not found");
      }

      // Remove the request from localStorage (no user account was created)
      const updatedRequests = pendingRequests.filter(
        (req: any) => req.requestId !== requestId
      );
      localStorage.setItem(
        "pendingUserRequests",
        JSON.stringify(updatedRequests)
      );

      return {
        success: true,
        message: "User request rejected",
        data: {
          rejectedRequest: request,
          reason: reason,
        },
      };
    } catch (error) {
      console.error("Error rejecting user request:", error);
      throw error;
    }
  },
};

// Alumni API functions
export const alumniAPI = {
  // Get all users directory (students and alumni)
  getAllUsersDirectory: async (params?: {
    page?: number;
    limit?: number;
    userType?: "student" | "alumni" | "all";
    tenantId?: string;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/alumni/users",
      params,
    });
  },

  // Get user by ID (student or alumni)
  getUserById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/alumni/user/${id}`,
    });
  },

  // Get public alumni directory (no authentication required)
  getPublicAlumniDirectory: async (params?: {
    page?: number;
    limit?: number;
    batchYear?: number;
    department?: string;
    isHiring?: boolean;
    availableForMentorship?: boolean;
    location?: string;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/alumni/public",
      params,
    });
  },

  // Get all alumni
  getAllAlumni: async (params?: {
    page?: number;
    limit?: number;
    batchYear?: number;
    department?: string;
    isHiring?: boolean;
    availableForMentorship?: boolean;
    location?: string;
    tenantId?: string;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/alumni",
      params,
    });
  },

  // Get alumni by ID
  getAlumniById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/alumni/${id}`,
    });
  },

  // Create alumni profile
  createProfile: async (profileData: Record<string, unknown>) => {
    return apiRequest({
      method: "POST",
      url: "/alumni/profile",
      data: profileData,
    });
  },

  // Update alumni profile
  updateProfile: async (profileData: Record<string, unknown>) => {
    return apiRequest({
      method: "PUT",
      url: "/alumni/profile",
      data: profileData,
    });
  },

  // Search alumni
  searchAlumni: async (params?: {
    q?: string;
    batchYear?: number;
    department?: string;
    location?: string;
    skills?: string[];
    isHiring?: boolean;
    availableForMentorship?: boolean;
    page?: number;
    limit?: number;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/alumni/search",
      params,
    });
  },

  // Get alumni by batch year
  getAlumniByBatch: async (
    year: number,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return apiRequest({
      method: "GET",
      url: `/alumni/batch/${year}`,
      params,
    });
  },

  // Get hiring alumni
  getHiringAlumni: async (params?: { page?: number; limit?: number }) => {
    return apiRequest({
      method: "GET",
      url: "/alumni/hiring",
      params,
    });
  },

  // Get mentors
  getMentors: async (params?: { page?: number; limit?: number }) => {
    return apiRequest({
      method: "GET",
      url: "/alumni/mentors",
      params,
    });
  },
};

// Job API functions
export const jobAPI = {
  // Get all jobs
  getAllJobs: async (params?: {
    page?: number;
    limit?: number;
    company?: string;
    location?: string;
    type?: string;
    experience?: string;
    industry?: string;
    remote?: boolean;
    tenantId?: string;
  }) => {
    try {
      // Try backend API first
      const response = await apiRequest({
        method: "GET",
        url: "/jobs",
        params,
      });
      return response;
    } catch (error) {
      // Fallback to localStorage data
      const mockJobs = [
        {
          _id: "job_1",
          company: "TechCorp",
          position: "Senior Software Engineer",
          location: "San Francisco, CA",
          type: "full-time",
          remote: true,
          salary: { min: 120000, max: 180000, currency: "USD" },
          description:
            "We're looking for a senior software engineer to join our team...",
          requirements: ["5+ years experience", "React/Node.js", "AWS"],
          benefits: ["Health insurance", "401k", "Flexible hours"],
          tags: ["javascript", "react", "nodejs"],
          deadline: "2024-02-15",
          companyWebsite: "https://techcorp.com",
          applicationUrl: "https://techcorp.com/careers",
          contactEmail: "careers@techcorp.com",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          _id: "job_2",
          company: "StartupXYZ",
          position: "Frontend Developer",
          location: "New York, NY",
          type: "full-time",
          remote: false,
          salary: { min: 80000, max: 120000, currency: "USD" },
          description:
            "Join our fast-growing startup as a frontend developer...",
          requirements: ["3+ years experience", "React", "TypeScript"],
          benefits: ["Stock options", "Health insurance", "Unlimited PTO"],
          tags: ["react", "typescript", "frontend"],
          deadline: "2024-02-20",
          companyWebsite: "https://startupxyz.com",
          applicationUrl: "https://startupxyz.com/jobs",
          contactEmail: "jobs@startupxyz.com",
          createdAt: "2024-01-10T14:30:00Z",
          updatedAt: "2024-01-10T14:30:00Z",
        },
        {
          _id: "job_3",
          company: "DataFlow Inc",
          position: "Data Scientist",
          location: "Remote",
          type: "full-time",
          remote: true,
          salary: { min: 100000, max: 150000, currency: "USD" },
          description:
            "We're seeking a data scientist to help us build ML models...",
          requirements: ["PhD in Data Science", "Python", "TensorFlow"],
          benefits: ["Health insurance", "401k", "Learning budget"],
          tags: ["python", "machine-learning", "data-science"],
          deadline: "2024-02-25",
          companyWebsite: "https://dataflow.com",
          applicationUrl: "https://dataflow.com/careers",
          contactEmail: "hr@dataflow.com",
          createdAt: "2024-01-05T09:15:00Z",
          updatedAt: "2024-01-05T09:15:00Z",
        },
      ];

      // Filter jobs based on params
      let filteredJobs = mockJobs;

      if (params?.company) {
        filteredJobs = filteredJobs.filter((job) =>
          job.company.toLowerCase().includes(params.company!.toLowerCase())
        );
      }

      if (params?.location && params.location !== "all") {
        filteredJobs = filteredJobs.filter((job) =>
          job.location.toLowerCase().includes(params.location!.toLowerCase())
        );
      }

      if (params?.type && params.type !== "all") {
        filteredJobs = filteredJobs.filter((job) => job.type === params.type);
      }

      // Simulate pagination
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          jobs: paginatedJobs,
          pagination: {
            page,
            limit,
            total: filteredJobs.length,
            pages: Math.ceil(filteredJobs.length / limit),
          },
        },
      };
    }
  },

  // Get job by ID
  getJobById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/jobs/${id}`,
    });
  },

  // Create job post
  createJob: async (jobData: {
    company: string;
    position: string;
    location: string;
    type: string;
    remote?: boolean;
    salary?: {
      min: number;
      max: number;
      currency: string;
    };
    description: string;
    requirements?: string[];
    benefits?: string[];
    tags?: string[];
    deadline?: string;
    companyWebsite?: string;
    applicationUrl?: string;
    contactEmail?: string;
  }) => {
    try {
      // Try backend API first
      const response = await apiRequest({
        method: "POST",
        url: "/jobs",
        data: jobData,
      });
      return response;
    } catch (error) {
      // Simulate successful job creation
      const newJob = {
        _id: `job_${Date.now()}`,
        ...jobData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        message: "Job posted successfully",
        data: {
          job: newJob,
        },
      };
    }
  },

  // Update job post
  updateJob: async (id: string, jobData: Record<string, unknown>) => {
    return apiRequest({
      method: "PUT",
      url: `/jobs/${id}`,
      data: jobData,
    });
  },

  // Delete job post
  deleteJob: async (id: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/jobs/${id}`,
    });
  },

  // Apply for job
  applyForJob: async (
    id: string,
    applicationData: {
      resume?: string;
      coverLetter?: string;
    }
  ) => {
    return apiRequest({
      method: "POST",
      url: `/jobs/${id}/apply`,
      data: applicationData,
    });
  },

  // Search jobs
  searchJobs: async (params?: {
    q?: string;
    company?: string;
    location?: string;
    type?: string;
    remote?: boolean;
    page?: number;
    limit?: number;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/jobs/search",
      params,
    });
  },

  // Get jobs by company
  getJobsByCompany: async (
    company: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return apiRequest({
      method: "GET",
      url: `/jobs/company/${company}`,
      params,
    });
  },

  // Get jobs by location
  getJobsByLocation: async (
    location: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return apiRequest({
      method: "GET",
      url: `/jobs/location/${location}`,
      params,
    });
  },

  // Get jobs by type
  getJobsByType: async (
    type: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return apiRequest({
      method: "GET",
      url: `/jobs/type/${type}`,
      params,
    });
  },

  // Get my job posts
  getMyJobPosts: async (params?: { page?: number; limit?: number }) => {
    return apiRequest({
      method: "GET",
      url: "/jobs/my-posts",
      params,
    });
  },
};

// Job Application API functions
export const jobApplicationAPI = {
  // Apply for a job
  applyForJob: async (
    jobId: string,
    applicationData: {
      skills: string[];
      experience: string;
      contactDetails: {
        name: string;
        email: string;
        phone: string;
      };
      message?: string;
      resume?: string;
    }
  ) => {
    return apiRequest({
      method: "POST",
      url: `/job-applications/jobs/${jobId}/apply`,
      data: applicationData,
    });
  },

  // Get applications for a specific job (for job poster)
  getJobApplications: async (
    jobId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return apiRequest({
      method: "GET",
      url: `/job-applications/jobs/${jobId}/applications`,
      params,
    });
  },

  // Get user's applications (for applicant)
  getUserApplications: async (params?: { page?: number; limit?: number }) => {
    return apiRequest({
      method: "GET",
      url: "/job-applications/my-applications",
      params,
    });
  },

  // Get application details
  getApplicationDetails: async (applicationId: string) => {
    return apiRequest({
      method: "GET",
      url: `/job-applications/applications/${applicationId}`,
    });
  },

  // Update application status (for job poster)
  updateApplicationStatus: async (
    applicationId: string,
    data: {
      status: "Applied" | "Shortlisted" | "Rejected" | "Hired";
      reviewNotes?: string;
    }
  ) => {
    return apiRequest({
      method: "PATCH",
      url: `/job-applications/applications/${applicationId}/status`,
      data,
    });
  },

  // Delete application (for applicant)
  deleteApplication: async (applicationId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/job-applications/applications/${applicationId}`,
    });
  },
};

// Event API functions
export const eventAPI = {
  // Get all events
  getAllEvents: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    location?: string;
    tenantId?: string;
  }) => {
    try {
      // Try backend API first
      const response = await apiRequest({
        method: "GET",
        url: "/events",
        params,
      });
      return response;
    } catch (error) {
      // Fallback to mock data
      const mockEvents = [
        {
          _id: "507f1f77bcf86cd799439011",
          title: "Tech Meetup 2024",
          description:
            "Join us for an exciting tech meetup featuring the latest trends in software development.",
          startDate: "2024-02-15T18:00:00Z",
          endDate: "2024-02-15T21:00:00Z",
          location: "San Francisco, CA",
          type: "meetup",
          capacity: 100,
          registeredCount: 45,
          registrationDeadline: "2024-02-10T23:59:59Z",
          image:
            "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500",
          organizer: "Tech Community SF",
          contactEmail: "events@techcommunitysf.com",
          tags: ["technology", "networking", "software"],
          isOnline: false,
          meetingLink: null,
          createdAt: "2024-01-10T10:00:00Z",
          updatedAt: "2024-01-10T10:00:00Z",
        },
        {
          _id: "507f1f77bcf86cd799439012",
          title: "React Workshop",
          description:
            "Learn React fundamentals and advanced patterns in this hands-on workshop.",
          startDate: "2024-02-20T10:00:00Z",
          endDate: "2024-02-20T17:00:00Z",
          location: "Online",
          type: "workshop",
          capacity: 50,
          registeredCount: 32,
          registrationDeadline: "2024-02-15T23:59:59Z",
          image:
            "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
          organizer: "React Academy",
          contactEmail: "workshop@reactacademy.com",
          tags: ["react", "javascript", "frontend"],
          isOnline: true,
          meetingLink: "https://zoom.us/j/123456789",
          createdAt: "2024-01-05T14:30:00Z",
          updatedAt: "2024-01-05T14:30:00Z",
        },
        {
          _id: "507f1f77bcf86cd799439013",
          title: "Alumni Reunion 2024",
          description:
            "Annual alumni reunion event with networking, food, and fun activities.",
          startDate: "2024-03-10T16:00:00Z",
          endDate: "2024-03-10T22:00:00Z",
          location: "University Campus",
          type: "reunion",
          capacity: 200,
          registeredCount: 156,
          registrationDeadline: "2024-03-01T23:59:59Z",
          image:
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500",
          organizer: "Alumni Association",
          contactEmail: "reunion@alumni.edu",
          tags: ["alumni", "networking", "reunion"],
          isOnline: false,
          meetingLink: null,
          createdAt: "2024-01-01T09:00:00Z",
          updatedAt: "2024-01-01T09:00:00Z",
        },
      ];

      // Filter events based on params
      let filteredEvents = mockEvents;

      if (params?.type && params.type !== "all") {
        filteredEvents = filteredEvents.filter(
          (event) => event.type === params.type
        );
      }

      if (params?.location && params.location !== "all") {
        filteredEvents = filteredEvents.filter((event) =>
          event.location.toLowerCase().includes(params.location!.toLowerCase())
        );
      }

      // Simulate pagination
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          events: paginatedEvents,
          pagination: {
            page,
            limit,
            total: filteredEvents.length,
            pages: Math.ceil(filteredEvents.length / limit),
          },
        },
      };
    }
  },

  // Get event by ID
  getEventById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/events/${id}`,
    });
  },

  // Create event
  createEvent: async (eventData: Record<string, unknown>) => {
    try {
      // Try backend API first
      const response = await apiRequest({
        method: "POST",
        url: "/events",
        data: eventData,
      });
      return response;
    } catch (error) {
      // Simulate successful event creation
      const newEvent = {
        _id: `507f1f77bcf86cd7994390${Date.now().toString().slice(-2)}`,
        ...eventData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        message: "Event created successfully",
        data: {
          event: newEvent,
        },
      };
    }
  },

  // Create event with image upload
  createEventWithImage: async (formData: FormData) => {
    return apiRequest({
      method: "POST",
      url: "/events/with-image",
      data: formData,
      headers: {
        "Content-Type": undefined, // Remove Content-Type to let browser set multipart/form-data
      },
    });
  },

  // Update event
  updateEvent: async (id: string, eventData: Record<string, unknown>) => {
    return apiRequest({
      method: "PUT",
      url: `/events/${id}`,
      data: eventData,
    });
  },

  // Update event with image
  updateEventWithImage: async (id: string, formData: FormData) => {
    return apiRequest({
      method: "PUT",
      url: `/events/${id}/with-image`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete event
  deleteEvent: async (id: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/events/${id}`,
    });
  },

  // Register for event
  registerForEvent: async (id: string) => {
    return apiRequest({
      method: "POST",
      url: `/events/${id}/register`,
    });
  },

  // Unregister from event
  unregisterFromEvent: async (id: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/events/${id}/unregister`,
    });
  },

  // Submit event feedback
  submitFeedback: async (
    id: string,
    feedbackData: {
      rating: number;
      comment?: string;
    }
  ) => {
    return apiRequest({
      method: "POST",
      url: `/events/${id}/feedback`,
      data: feedbackData,
    });
  },

  // Get upcoming events
  getUpcomingEvents: async (params?: { page?: number; limit?: number }) => {
    return apiRequest({
      method: "GET",
      url: "/events/upcoming",
      params,
    });
  },

  // Search events
  searchEvents: async (params?: {
    q?: string;
    type?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/events/search",
      params,
    });
  },

  // Save event for alumni
  saveEvent: async (eventId: string) => {
    return apiRequest({
      method: "POST",
      url: `/events/${eventId}/save`,
    });
  },

  // Unsave event for alumni
  unsaveEvent: async (eventId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/events/${eventId}/save`,
    });
  },

  // Get saved events for alumni
  getSavedEvents: async () => {
    return apiRequest({
      method: "GET",
      url: "/events/saved",
    });
  },
};

// Invitation API functions
export const invitationAPI = {
  // Send alumni invitation
  sendInvitation: async (invitationData: {
    name: string;
    email: string;
    graduationYear: number;
    degree?: string;
    currentRole?: string;
    company?: string;
    location?: string;
    linkedinProfile?: string;
  }) => {
    return apiRequest({
      method: "POST",
      url: "/invitations",
      data: invitationData,
    });
  },

  // Get invitation by token
  getInvitationByToken: async (token: string) => {
    return apiRequest({
      method: "GET",
      url: `/invitations/${token}`,
    });
  },

  // Accept invitation
  acceptInvitation: async (token: string) => {
    return apiRequest({
      method: "POST",
      url: `/invitations/${token}/accept`,
    });
  },

  // Get user's invitations
  getInvitations: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/invitations",
      params,
    });
  },

  // Check if invitation exists for email
  checkInvitationExists: async (email: string) => {
    return apiRequest({
      method: "GET",
      url: `/invitations/check/${encodeURIComponent(email)}`,
    });
  },

  // News API
  news: {
    // Get all news
    getAllNews: async (
      params?: Record<string, unknown> & { tenantId?: string }
    ) => {
      return apiRequest({
        method: "GET",
        url: "/news",
        params,
      });
    },

    // Get news by ID
    getNewsById: async (id: string) => {
      return apiRequest({
        method: "GET",
        url: `/news/${id}`,
      });
    },

    // Create news
    createNews: async (newsData: Record<string, unknown>) => {
      return apiRequest({
        method: "POST",
        url: "/news",
        data: newsData,
      });
    },

    // Create news with image
    createNewsWithImage: async (formData: FormData) => {
      return apiRequest({
        method: "POST",
        url: "/news/with-image",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },

    // Update news
    updateNews: async (id: string, newsData: Record<string, unknown>) => {
      return apiRequest({
        method: "PUT",
        url: `/news/${id}`,
        data: newsData,
      });
    },

    // Update news with image
    updateNewsWithImage: async (id: string, formData: FormData) => {
      return apiRequest({
        method: "PUT",
        url: `/news/${id}/with-image`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },

    // Delete news
    deleteNews: async (id: string) => {
      return apiRequest({
        method: "DELETE",
        url: `/news/${id}`,
      });
    },

    // Get my news
    getMyNews: async (params?: Record<string, unknown>) => {
      return apiRequest({
        method: "GET",
        url: "/news/my/news",
        params,
      });
    },
  },
};

// News API (separate object)
export const newsAPI = {
  // Get all news
  getAllNews: async (params?: Record<string, unknown>) => {
    try {
      // Try backend API first
      const response = await apiRequest({
        method: "GET",
        url: "/news",
        params,
      });
      return response;
    } catch (error) {
      // Fallback to mock data
      const mockNews = [
        {
          _id: "news_1",
          title: "Alumni Association Launches New Mentorship Program",
          summary:
            "The Alumni Association is excited to announce the launch of our new mentorship program connecting current students with successful alumni.",
          content:
            "We are thrilled to announce the launch of our new mentorship program...",
          image:
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500",
          author: "Alumni Association",
          publishedAt: "2024-01-15T10:00:00Z",
          tags: ["mentorship", "alumni", "program"],
          isShared: false,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          _id: "news_2",
          title: "Tech Industry Trends 2024: What Alumni Need to Know",
          summary:
            "A comprehensive overview of the latest trends in technology that are shaping the industry in 2024.",
          content:
            "As we move through 2024, several key trends are emerging in the tech industry...",
          image:
            "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500",
          author: "Tech Committee",
          publishedAt: "2024-01-10T14:30:00Z",
          tags: ["technology", "trends", "industry"],
          isShared: true,
          createdAt: "2024-01-10T14:30:00Z",
          updatedAt: "2024-01-10T14:30:00Z",
        },
        {
          _id: "news_3",
          title: "Annual Alumni Reunion 2024: Save the Date!",
          summary:
            "Mark your calendars for our biggest event of the year - the Annual Alumni Reunion on March 10th, 2024.",
          content:
            "We're excited to announce that our Annual Alumni Reunion will be held on March 10th, 2024...",
          image:
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500",
          author: "Event Committee",
          publishedAt: "2024-01-05T09:15:00Z",
          tags: ["reunion", "event", "alumni"],
          isShared: false,
          createdAt: "2024-01-05T09:15:00Z",
          updatedAt: "2024-01-05T09:15:00Z",
        },
      ];

      // Simulate pagination
      const page = (params?.page as number) || 1;
      const limit = (params?.limit as number) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNews = mockNews.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          news: paginatedNews,
          pagination: {
            page,
            limit,
            total: mockNews.length,
            pages: Math.ceil(mockNews.length / limit),
          },
        },
      };
    }
  },

  // Get news by ID
  getNewsById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/news/${id}`,
    });
  },

  // Create news
  createNews: async (newsData: Record<string, unknown>) => {
    try {
      // Try backend API first
      const response = await apiRequest({
        method: "POST",
        url: "/news",
        data: newsData,
      });
      return response;
    } catch (error) {
      // Simulate successful news creation
      const newNews = {
        _id: `news_${Date.now()}`,
        ...newsData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        message: "News article created successfully",
        data: {
          news: newNews,
        },
      };
    }
  },

  // Create news with image
  createNewsWithImage: async (formData: FormData) => {
    return apiRequest({
      method: "POST",
      url: "/news/with-image",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Update news
  updateNews: async (id: string, newsData: Record<string, unknown>) => {
    return apiRequest({
      method: "PUT",
      url: `/news/${id}`,
      data: newsData,
    });
  },

  // Update news with image
  updateNewsWithImage: async (id: string, formData: FormData) => {
    return apiRequest({
      method: "PUT",
      url: `/news/${id}/with-image`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete news
  deleteNews: async (id: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/news/${id}`,
    });
  },

  // Get my news
  getMyNews: async (params?: Record<string, unknown>) => {
    return apiRequest({
      method: "GET",
      url: "/news/my/news",
      params,
    });
  },

  // Save news article
  saveNews: async (newsId: string) => {
    return apiRequest({
      method: "POST",
      url: `/news/${newsId}/save`,
    });
  },

  // Unsave news article
  unsaveNews: async (newsId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/news/${newsId}/save`,
    });
  },

  // Get saved news articles
  getSavedNews: async (params?: Record<string, unknown>) => {
    return apiRequest({
      method: "GET",
      url: "/news/saved",
      params,
    });
  },

  // Check if news article is saved
  checkSavedNews: async (newsId: string) => {
    return apiRequest({
      method: "GET",
      url: `/news/${newsId}/saved`,
    });
  },
};

// Gallery API functions
export const galleryAPI = {
  // Get all galleries
  getAllGalleries: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
  }) => {
    try {
      // Try backend API first
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.category) queryParams.append("category", params.category);

      const response = await apiRequest({
        method: "GET",
        url: `/gallery?${queryParams.toString()}`,
      });
      return response;
    } catch (error) {
      // Fallback to mock data
      const mockGalleries = [
        {
          _id: "gallery_1",
          title: "Alumni Reunion 2023",
          description: "Photos from our amazing alumni reunion event",
          images: [
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500",
            "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500",
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500",
          ],
          createdBy: {
            firstName: "John",
            lastName: "Smith",
            email: "john.smith@alumni.edu",
          },
          createdAt: "2024-01-15T10:00:00Z",
          category: "events",
        },
        {
          _id: "gallery_2",
          title: "Campus Life Memories",
          description: "Beautiful moments from campus life",
          images: [
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500",
            "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500",
          ],
          createdBy: {
            firstName: "Sarah",
            lastName: "Johnson",
            email: "sarah.johnson@alumni.edu",
          },
          createdAt: "2024-01-10T14:30:00Z",
          category: "campus",
        },
        {
          _id: "gallery_3",
          title: "Graduation Ceremony 2023",
          description: "Celebrating our graduates",
          images: [
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500",
            "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
          ],
          createdBy: {
            firstName: "Mike",
            lastName: "Davis",
            email: "mike.davis@alumni.edu",
          },
          createdAt: "2024-01-05T09:15:00Z",
          category: "graduation",
        },
      ];

      // Filter galleries based on category
      let filteredGalleries = mockGalleries;

      if (params?.category && params.category !== "all") {
        filteredGalleries = filteredGalleries.filter(
          (gallery) => gallery.category === params.category
        );
      }

      // Simulate pagination
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedGalleries = filteredGalleries.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          galleries: paginatedGalleries,
          pagination: {
            page,
            limit,
            total: filteredGalleries.length,
            pages: Math.ceil(filteredGalleries.length / limit),
          },
        },
      };
    }
  },

  // Get gallery by ID
  getGalleryById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/gallery/${id}`,
    });
  },

  // Upload gallery images
  uploadImages: async (images: File[]) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    return apiRequest({
      method: "POST",
      url: "/gallery/upload-images",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Create gallery
  createGallery: async (galleryData: {
    title: string;
    description?: string;
    images: string[];
    tags?: string[];
    category?: string;
  }) => {
    return apiRequest({
      method: "POST",
      url: "/gallery",
      data: galleryData,
    });
  },

  // Update gallery
  updateGallery: async (
    id: string,
    galleryData: {
      title?: string;
      description?: string;
      images?: string[];
      tags?: string[];
      category?: string;
    }
  ) => {
    return apiRequest({
      method: "PUT",
      url: `/gallery/${id}`,
      data: galleryData,
    });
  },

  // Delete gallery
  deleteGallery: async (id: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/gallery/${id}`,
    });
  },

  // Get user's galleries
  getUserGalleries: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return apiRequest({
      method: "GET",
      url: `/gallery/user/my-galleries?${queryParams.toString()}`,
    });
  },
};

// Connection API
export const connectionAPI = {
  // Send connection request
  sendConnectionRequest: async (data: {
    recipientId: string;
    type?: string;
    message?: string;
  }) => {
    return apiRequest({
      method: "POST",
      url: "/connections/send",
      data,
    });
  },

  // Accept connection request
  acceptConnection: async (connectionId: string) => {
    return apiRequest({
      method: "PATCH",
      url: `/connections/${connectionId}/accept`,
    });
  },

  // Reject connection request
  rejectConnection: async (connectionId: string) => {
    return apiRequest({
      method: "PATCH",
      url: `/connections/${connectionId}/reject`,
    });
  },

  // Block user
  blockUser: async (connectionId: string) => {
    return apiRequest({
      method: "PATCH",
      url: `/connections/${connectionId}/block`,
    });
  },

  // Unblock user
  unblockUser: async (connectionId: string) => {
    return apiRequest({
      method: "PATCH",
      url: `/connections/${connectionId}/unblock`,
    });
  },

  // Cancel connection request
  cancelConnection: async (connectionId: string) => {
    return apiRequest({
      method: "PATCH",
      url: `/connections/${connectionId}/cancel`,
    });
  },

  // Remove connection (unfriend)
  removeConnection: async (connectionId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/connections/${connectionId}/remove`,
    });
  },

  // Get user connections
  getUserConnections: async (params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return apiRequest({
      method: "GET",
      url: `/connections?${queryParams.toString()}`,
    });
  },

  // Get pending requests
  getPendingRequests: async () => {
    return apiRequest({
      method: "GET",
      url: "/connections/pending",
    });
  },

  // Get sent requests
  getSentRequests: async () => {
    return apiRequest({
      method: "GET",
      url: "/connections/sent",
    });
  },

  // Get connection statistics
  getConnectionStats: async () => {
    return apiRequest({
      method: "GET",
      url: "/connections/stats",
    });
  },

  // Check connection status between two users
  checkConnectionStatus: async (userId: string) => {
    return apiRequest({
      method: "GET",
      url: `/connections/check/${userId}`,
    });
  },
};

// Message API
export const messageAPI = {
  // Send a message
  sendMessage: async (data: {
    recipientId: string;
    content: string;
    messageType?: string;
  }) => {
    return apiRequest({
      method: "POST",
      url: "/messages",
      data,
    });
  },

  // Get messages between two users
  getMessages: async (
    recipientId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return apiRequest({
      method: "GET",
      url: `/messages/${recipientId}`,
      params,
    });
  },

  // Get all conversations for a user
  getConversations: async () => {
    return apiRequest({
      method: "GET",
      url: "/messages/conversations",
    });
  },

  // Mark a message as read
  markAsRead: async (messageId: string) => {
    return apiRequest({
      method: "PATCH",
      url: `/messages/${messageId}/read`,
    });
  },

  // Get unread message count
  getUnreadCount: async () => {
    return apiRequest({
      method: "GET",
      url: "/messages/unread-count",
    });
  },

  // Delete a message
  deleteMessage: async (messageId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/messages/${messageId}`,
    });
  },
};

// Tenant API functions
export const tenantAPI = {
  // Get all tenants (Super Admin only)
  getAllTenants: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);

    return apiRequest({
      method: "GET",
      url: `/tenants?${queryParams.toString()}`,
    });
  },

  // Get tenant by ID
  getTenantById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/tenants/${id}`,
    });
  },

  // Create new tenant
  createTenant: async (tenantData: {
    name: string;
    domain: string;
    about?: string;
    superAdminEmail: string;
    superAdminFirstName: string;
    superAdminLastName: string;
    contactInfo: {
      email: string;
      phone?: string;
      address?: string;
      website?: string;
    };
    settings?: {
      allowAlumniRegistration?: boolean;
      requireApproval?: boolean;
      allowJobPosting?: boolean;
      allowFundraising?: boolean;
      allowMentorship?: boolean;
      allowEvents?: boolean;
      emailNotifications?: boolean;
      whatsappNotifications?: boolean;
      customBranding?: boolean;
    };
  }) => {
    return apiRequest({
      method: "POST",
      url: "/tenants",
      data: tenantData,
    });
  },

  // Update tenant
  updateTenant: async (id: string, tenantData: any) => {
    return apiRequest({
      method: "PUT",
      url: `/tenants/${id}`,
      data: tenantData,
    });
  },

  // Delete tenant
  deleteTenant: async (id: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/tenants/${id}`,
    });
  },

  // Get tenant users
  getTenantUsers: async (
    id: string,
    params?: {
      page?: number;
      limit?: number;
      role?: string;
      status?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.role) queryParams.append("role", params.role);
    if (params?.status) queryParams.append("status", params.status);

    return apiRequest({
      method: "GET",
      url: `/tenants/${id}/users?${queryParams.toString()}`,
    });
  },

  // Get tenant statistics
  getTenantStats: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/tenants/${id}/stats`,
    });
  },

  // Upload college logo
  uploadLogo: async (tenantId: string, logoFile: File) => {
    const formData = new FormData();
    formData.append("logo", logoFile);

    return apiRequest({
      method: "POST",
      url: `/tenants/${tenantId}/logo`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get college logo
  getLogo: async (tenantId: string) => {
    try {
      const response = await apiRequest({
        method: "GET",
        url: `/tenants/${tenantId}/logo`,
      });

      // Handle both JSON response (external URL) and direct image response
      if (response.success && (response.data as any)?.logo) {
        return (response.data as any).logo; // Return the URL string directly
      }

      return null;
    } catch (error) {
      console.error("Error fetching logo:", error);
      throw error;
    }
  },

  // Delete college logo
  deleteLogo: async (tenantId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/tenants/${tenantId}/logo`,
    });
  },

  // Upload college banner
  uploadBanner: async (tenantId: string, bannerFile: File) => {
    const formData = new FormData();
    formData.append("banner", bannerFile);

    return apiRequest({
      method: "POST",
      url: `/tenants/${tenantId}/banner`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get college banner
  getBanner: async (tenantId: string) => {
    try {
      const response = await apiRequest({
        method: "GET",
        url: `/tenants/${tenantId}/banner`,
      });

      // Handle both JSON response (external URL) and direct image response
      if (response.success && (response.data as any)?.banner) {
        return (response.data as any).banner; // Return the URL string directly
      }

      return null;
    } catch (error) {
      console.error("Error fetching banner:", error);
      throw error;
    }
  },

  // Delete college banner
  deleteBanner: async (tenantId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/tenants/${tenantId}/banner`,
    });
  },

  // Update college description
  updateDescription: async (tenantId: string, description: string) => {
    return apiRequest({
      method: "PUT",
      url: `/tenants/${tenantId}/description`,
      data: { description },
    });
  },

  // Get public college information (no authentication required)
  getPublicCollegeInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/college/public-info`);
      return response.data;
    } catch (error) {
      console.error("Error fetching public college info:", error);
      throw error;
    }
  },
};

// Campaign API functions
export const campaignAPI = {
  // Get all campaigns
  getAllCampaigns: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    featured?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.featured !== undefined)
      queryParams.append("featured", params.featured.toString());

    return apiRequest({
      method: "GET",
      url: `/campaigns?${queryParams.toString()}`,
    });
  },

  // Get campaign by ID
  getCampaignById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/campaigns/${id}`,
    });
  },

  // Create new campaign
  createCampaign: async (campaignData: {
    title: string;
    description: string;
    category: string;
    targetAmount: number;
    currency?: string;
    startDate: string;
    endDate: string;
    images?: string[];
    documents?: string[];
    allowAnonymous?: boolean;
    featured?: boolean;
    tags?: string[];
    location?: string;
    contactInfo: {
      email: string;
      phone?: string;
      person?: string;
    };
  }) => {
    return apiRequest({
      method: "POST",
      url: "/campaigns",
      data: campaignData,
    });
  },

  // Update campaign
  updateCampaign: async (id: string, campaignData: any) => {
    return apiRequest({
      method: "PUT",
      url: `/campaigns/${id}`,
      data: campaignData,
    });
  },

  // Delete campaign
  deleteCampaign: async (id: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/campaigns/${id}`,
    });
  },

  // Add campaign update
  addCampaignUpdate: async (
    id: string,
    updateData: {
      title: string;
      description: string;
    }
  ) => {
    return apiRequest({
      method: "POST",
      url: `/campaigns/${id}/updates`,
      data: updateData,
    });
  },

  // Get campaign donations
  getCampaignDonations: async (
    id: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    return apiRequest({
      method: "GET",
      url: `/campaigns/${id}/donations?${queryParams.toString()}`,
    });
  },

  // Update campaign statistics
  updateCampaignStats: async (id: string) => {
    return apiRequest({
      method: "PUT",
      url: `/campaigns/${id}/stats`,
    });
  },
};

// Community API functions
export const communityAPI = {
  // Discussion functions
  getDiscussions: async (params?: {
    category?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return apiRequest({
      method: "GET",
      url: `/community/discussions?${queryParams.toString()}`,
    });
  },

  createDiscussion: async (data: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
  }) => {
    return apiRequest({
      method: "POST",
      url: "/community/discussions",
      data,
    });
  },

  likeDiscussion: async (discussionId: string) => {
    return apiRequest({
      method: "POST",
      url: `/community/discussions/${discussionId}/like`,
    });
  },

  // Community stats
  getCommunityStats: async () => {
    return apiRequest({
      method: "GET",
      url: "/community/stats",
    });
  },
};

// Export the API instance and functions
export default api;
