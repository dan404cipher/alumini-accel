# 🚀 Frontend Integration Guide for AlumniAccel API

This guide provides everything the frontend team needs to integrate with the AlumniAccel backend API.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [API Endpoints Overview](#api-endpoints-overview)
3. [Authentication](#authentication)
4. [API Client Implementation](#api-client-implementation)
5. [Error Handling](#error-handling)
6. [File Uploads](#file-uploads)
7. [Pagination & Filtering](#pagination--filtering)
8. [Real-time Updates](#real-time-updates)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Base URL

```
Development: http://localhost:3000/api/v1
Production: https://yourdomain.com/api/v1
```

### 2. Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### 3. Sample Login

```typescript
const response = await fetch("http://localhost:3000/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@alumniaccel.com",
    password: "Admin@123",
  }),
});

const { token } = await response.json();
// Store token and use in subsequent requests
```

---

## 🔗 API Endpoints Overview

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token

### Users

- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/profile` - Update user profile
- `PUT /users/:id/status` - Update user status (admin only)
- `DELETE /users/:id` - Delete user (admin only)
- `GET /users/search` - Search users

### Alumni Profiles

- `GET /alumni` - Get all alumni profiles
- `GET /alumni/:id` - Get alumni profile by ID
- `POST /alumni` - Create alumni profile
- `PUT /alumni/:id` - Update alumni profile

### Events

- `GET /events` - Get all events
- `GET /events/:id` - Get event by ID
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `POST /events/:id/register` - Register for event

### Jobs

- `GET /jobs` - Get all job posts
- `GET /jobs/:id` - Get job post by ID
- `POST /jobs` - Create job post
- `POST /jobs/:id/apply` - Apply for job

### Mentorship

- `GET /mentorship` - Get mentorship requests
- `POST /mentorship` - Request mentorship
- `PUT /mentorship/:id/accept` - Accept mentorship

### Donations

- `GET /donations` - Get donation history
- `POST /donations` - Make donation

---

## 🔐 Authentication

### JWT Token Flow

1. **Login** → Receive JWT token
2. **Store token** in localStorage or secure storage
3. **Include token** in Authorization header for all protected requests
4. **Handle token expiration** with refresh endpoint
5. **Logout** → Clear token and redirect to login

### Token Management

```typescript
class AuthManager {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem("auth_token");
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```

### Protected Request Example

```typescript
const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
    return;
  }

  return response.json();
};
```

---

## 🛠️ API Client Implementation

### Using the Provided API Client

```typescript
import { apiClient } from "./config/frontendApiClient";

// Authentication
const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.login({ email, password });
    if (response.success) {
      // Redirect to dashboard
      window.location.href = "/dashboard";
    }
  } catch (error) {
    console.error("Login failed:", error);
  }
};

// Get users
const getUsers = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.getAllUsers({ page, limit });
    return response.data?.users || [];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
};

// Update profile
const updateProfile = async (profileData: any) => {
  try {
    const response = await apiClient.updateProfile(profileData);
    if (response.success) {
      // Show success message
      showNotification("Profile updated successfully", "success");
    }
  } catch (error) {
    console.error("Profile update failed:", error);
    showNotification("Profile update failed", "error");
  }
};
```

### Custom API Client

```typescript
class CustomApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem("auth_token");
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // User methods
  async getUsers(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ""}`;
    return this.request(endpoint);
  }

  async updateUserProfile(data: any) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}
```

---

## ❌ Error Handling

### Standard Error Response Format

```typescript
interface ApiError {
  success: false;
  message: string;
  error?: string;
  validationErrors?: Record<string, string[]>;
}
```

### Error Handling Implementation

```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        if (data.validationErrors) {
          // Handle validation errors
          Object.entries(data.validationErrors).forEach(([field, errors]) => {
            showFieldError(field, errors[0]);
          });
        } else {
          showNotification(data.message, "error");
        }
        break;

      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        break;

      case 403:
        // Forbidden - show access denied message
        showNotification("Access denied", "error");
        break;

      case 404:
        // Not found
        showNotification("Resource not found", "error");
        break;

      case 422:
        // Validation error
        showNotification(data.message, "error");
        break;

      case 500:
        // Server error
        showNotification("Server error. Please try again later.", "error");
        break;

      default:
        showNotification("An unexpected error occurred", "error");
    }
  } else if (error.request) {
    // Network error
    showNotification("Network error. Please check your connection.", "error");
  } else {
    // Other error
    showNotification(error.message || "An error occurred", "error");
  }
};
```

---

## 📁 File Uploads

### Profile Picture Upload

```typescript
const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/v1/uploads/profile-picture", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      // Update UI with new profile picture
      updateProfilePicture(data.data.url);
    }
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

### Resume Upload

```typescript
const uploadResume = async (file: File) => {
  // Validate file type and size
  if (!file.type.includes("pdf") && !file.type.includes("word")) {
    showNotification("Please upload a PDF or Word document", "error");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    showNotification("File size must be less than 10MB", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/v1/uploads/resume", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      showNotification("Resume uploaded successfully", "success");
    }
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

---

## 📄 Pagination & Filtering

### Pagination Implementation

```typescript
interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

const usePaginatedData = <T>(endpoint: string, initialParams = {}) => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async (params: any) => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${endpoint}?${queryString}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      const result: PaginatedResponse<T> = await response.json();
      setData(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const changePage = (page: number) => {
    fetchData({ ...initialParams, page });
  };

  const changeLimit = (limit: number) => {
    fetchData({ ...initialParams, page: 1, limit });
  };

  useEffect(() => {
    fetchData(initialParams);
  }, []);

  return {
    data,
    pagination,
    loading,
    changePage,
    changeLimit,
    refresh: () => fetchData(initialParams),
  };
};
```

### Filtering Implementation

```typescript
const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setActiveFilters(filters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setActiveFilters(initialFilters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setActiveFilters(initialFilters);
  };

  return {
    filters,
    activeFilters,
    updateFilter,
    applyFilters,
    clearFilters,
    resetFilters,
  };
};
```

---

## 🔄 Real-time Updates

### WebSocket Connection (if implemented)

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    this.ws = new WebSocket(`ws://localhost:3000?token=${token}`);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case "notification":
        showNotification(data.message, data.level);
        break;
      case "user_update":
        // Update user data in UI
        updateUserData(data.user);
        break;
      case "event_update":
        // Update event data in UI
        updateEventData(data.event);
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        const token = localStorage.getItem("auth_token");
        if (token) {
          this.connect(token);
        }
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

---

## 🧪 Testing

### API Testing with Jest

```typescript
import { apiClient } from "./apiClient";

// Mock fetch
global.fetch = jest.fn();

describe("API Client", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test("login success", async () => {
    const mockResponse = {
      success: true,
      data: {
        token: "mock-token",
        user: { id: "1", email: "test@example.com" },
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.login({
      email: "test@example.com",
      password: "password",
    });

    expect(result.success).toBe(true);
    expect(result.data?.token).toBe("mock-token");
  });

  test("login failure", async () => {
    const mockResponse = {
      success: false,
      message: "Invalid credentials",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => mockResponse,
    });

    await expect(
      apiClient.login({
        email: "test@example.com",
        password: "wrong-password",
      })
    ).rejects.toThrow();
  });
});
```

### Integration Testing

```typescript
describe("User Management Integration", () => {
  test("complete user flow", async () => {
    // 1. Login
    const loginResponse = await apiClient.login({
      email: "admin@alumniaccel.com",
      password: "Admin@123",
    });
    expect(loginResponse.success).toBe(true);

    // 2. Get users
    const usersResponse = await apiClient.getAllUsers({ page: 1, limit: 10 });
    expect(usersResponse.success).toBe(true);
    expect(usersResponse.data?.users).toBeDefined();

    // 3. Update profile
    const profileResponse = await apiClient.updateProfile({
      bio: "Updated bio",
    });
    expect(profileResponse.success).toBe(true);

    // 4. Logout
    const logoutResponse = await apiClient.logout();
    expect(logoutResponse.success).toBe(true);
  });
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem:** `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:3001' has been blocked by CORS policy`

**Solution:** Backend CORS is already configured, but ensure your frontend origin is included in the allowed origins.

#### 2. Authentication Token Issues

**Problem:** `401 Unauthorized` errors

**Solutions:**

- Check if token is stored correctly
- Verify token format: `Bearer <token>`
- Check if token has expired
- Ensure token is being sent in Authorization header

#### 3. File Upload Failures

**Problem:** File uploads failing

**Solutions:**

- Check file size limits
- Verify file types are allowed
- Ensure FormData is used (not JSON)
- Check if Authorization header is included

#### 4. Network Errors

**Problem:** `Failed to fetch` errors

**Solutions:**

- Verify backend server is running
- Check if base URL is correct
- Ensure network connectivity
- Check if backend is accessible from frontend

### Debug Mode

```typescript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === "development";

const logApiCall = (method: string, url: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`API Call: ${method} ${url}`, data);
  }
};

const logApiResponse = (response: any) => {
  if (DEBUG_MODE) {
    console.log("API Response:", response);
  }
};
```

---

## 📚 Additional Resources

### API Documentation

- **Live API Docs:** `GET /api/v1/docs`
- **Health Check:** `GET /health`
- **Swagger/OpenAPI:** Coming soon

### Sample Data

Use these credentials for testing:

```json
{
  "admin": {
    "email": "admin@alumniaccel.com",
    "password": "Admin@123"
  },
  "coordinator": {
    "email": "coordinator@alumniaccel.com",
    "password": "Coord@123"
  },
  "alumni": {
    "email": "alumni1@alumniaccel.com",
    "password": "Alumni@123"
  },
  "student": {
    "email": "student1@alumniaccel.com",
    "password": "Student@123"
  }
}
```

### Rate Limiting

- **Auth endpoints:** 5 requests per 15 minutes
- **User endpoints:** 50 requests per 15 minutes
- **General endpoints:** 100 requests per 15 minutes

---

## 🆘 Support

If you encounter issues:

1. **Check the logs** in the backend console
2. **Verify API endpoints** using the docs endpoint
3. **Test with Postman** to isolate frontend vs backend issues
4. **Check network tab** in browser dev tools
5. **Review this documentation** for common solutions

---

**Happy coding! 🚀**

For backend-specific questions, refer to the backend team or check the backend logs and documentation.
