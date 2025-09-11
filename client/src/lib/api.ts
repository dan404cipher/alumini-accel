import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

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
  }) => {
    return apiRequest({
      method: "GET",
      url: "/users",
      params,
    });
  },

  // Get user by ID
  getUserById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/users/${id}`,
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
};

// Alumni API functions
export const alumniAPI = {
  // Get all users directory (students and alumni)
  getAllUsersDirectory: async (params?: {
    page?: number;
    limit?: number;
    userType?: "student" | "alumni" | "all";
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
    remote?: boolean;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/jobs",
      params,
    });
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
    return apiRequest({
      method: "POST",
      url: "/jobs",
      data: jobData,
    });
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

// Event API functions
export const eventAPI = {
  // Get all events
  getAllEvents: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    location?: string;
  }) => {
    return apiRequest({
      method: "GET",
      url: "/events",
      params,
    });
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
    return apiRequest({
      method: "POST",
      url: "/events",
      data: eventData,
    });
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
    getAllNews: async (params?: Record<string, unknown>) => {
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
};

// Student API functions
export const studentAPI = {
  // Get all students
  getAllStudents: async (params?: Record<string, unknown>) => {
    return apiRequest({
      method: "GET",
      url: "/students",
      params,
    });
  },

  // Get student by ID
  getStudentById: async (id: string) => {
    return apiRequest({
      method: "GET",
      url: `/students/${id}`,
    });
  },

  // Get student profile
  getStudentProfile: async () => {
    return apiRequest({
      method: "GET",
      url: "/students/profile",
    });
  },

  // Create student profile
  createStudentProfile: async (profileData: Record<string, unknown>) => {
    return apiRequest({
      method: "POST",
      url: "/students/profile",
      data: profileData,
    });
  },

  // Update student profile
  updateStudentProfile: async (profileData: Record<string, unknown>) => {
    return apiRequest({
      method: "PUT",
      url: "/students/profile",
      data: profileData,
    });
  },

  // Add project
  addProject: async (projectData: Record<string, unknown>) => {
    return apiRequest({
      method: "POST",
      url: "/students/profile/projects",
      data: projectData,
    });
  },

  // Update project
  updateProject: async (
    projectId: string,
    projectData: Record<string, unknown>
  ) => {
    return apiRequest({
      method: "PUT",
      url: `/students/profile/projects/${projectId}`,
      data: projectData,
    });
  },

  // Delete project
  deleteProject: async (projectId: string) => {
    return apiRequest({
      method: "DELETE",
      url: `/students/profile/projects/${projectId}`,
    });
  },

  // Add internship experience
  addInternshipExperience: async (formData: FormData) => {
    return apiRequest({
      method: "POST",
      url: "/students/profile/internships",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Add research work
  addResearchWork: async (formData: FormData) => {
    return apiRequest({
      method: "POST",
      url: "/students/profile/research",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Add certification
  addCertification: async (formData: FormData) => {
    return apiRequest({
      method: "POST",
      url: "/students/profile/certifications",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get student stats
  getStudentStats: async () => {
    return apiRequest({
      method: "GET",
      url: "/students/profile/stats",
    });
  },
};

// Export the API instance and functions
export default api;
