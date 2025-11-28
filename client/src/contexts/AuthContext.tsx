import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authAPI } from "@/lib/api";
import socketService from "@/services/socketService";

// User interface
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  tenantId?: string;
  tenantName?: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  phone?: string;
  linkedinProfile?: string;
  twitterHandle?: string;
  githubProfile?: string;
  website?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  privacy?: {
    profileVisibility: "public" | "alumni" | "private";
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    showCompany: boolean;
  };
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Skip automatic login if user is on reset password page
      if (window.location.pathname === "/reset-password") {
        setLoading(false);
        return;
      }

      // Check localStorage first (remember me), then sessionStorage
      let token = localStorage.getItem("token");
      let refreshToken = localStorage.getItem("refreshToken");
      let userData = localStorage.getItem("user");
      let storageType = "localStorage";

      if (!token) {
        token = sessionStorage.getItem("token");
        refreshToken = sessionStorage.getItem("refreshToken");
        userData = sessionStorage.getItem("user");
        storageType = "sessionStorage";
      }

      if (token) {
        try {
          // If we have user data in storage, use it immediately while verifying
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData) as User;
              setUser(parsedUser);
              // Trigger socket connection immediately with cached user
              socketService.connectSocket();
            } catch (parseError) {
              // Invalid user data, will be cleared below
            }
          }

          // Verify token with API call
          const response = await authAPI.getCurrentUser();

          if (
            response.success &&
            response.data &&
            typeof response.data === "object" &&
            response.data !== null &&
            "user" in response.data
          ) {
            const userData = (response.data as { user: User }).user;
            setUser(userData);
            // Update stored user data
            if (storageType === "localStorage") {
              localStorage.setItem("user", JSON.stringify(userData));
            } else {
              sessionStorage.setItem("user", JSON.stringify(userData));
            }
            // Trigger socket connection after successful authentication
            socketService.connectSocket();
          } else {
            // Token is invalid, clear it from both storages
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refreshToken");
            sessionStorage.removeItem("user");
            setUser(null);
          }
        } catch (err) {
          // If we have a token but API call fails, check if it's a network error
          // Don't clear tokens on network errors, only on auth errors
          const error = err as Error & { response?: { status: number } };
          if (error.response?.status === 401 || error.response?.status === 403) {
            // Auth error - clear tokens
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refreshToken");
            sessionStorage.removeItem("user");
            setUser(null);
          }
          // For network errors, keep the cached user if available
          // This allows offline access with cached credentials
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login({ email, password });

      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        response.data !== null
      ) {
        const {
          user: userData,
          token,
          refreshToken,
        } = response.data as {
          user: User;
          token: string;
          refreshToken: string;
        };

        // Store tokens and user data
        if (rememberMe) {
          // Store in localStorage for persistent login
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          // Store in sessionStorage for session-only login
          sessionStorage.setItem("token", token);
          sessionStorage.setItem("refreshToken", refreshToken);
          sessionStorage.setItem("user", JSON.stringify(userData));
        }

        setUser(userData);
        // Trigger socket connection after successful login
        socketService.connectSocket();
        return true;
      } else {
        setError(response.message || "Login failed");
        return false;
      }
    } catch (err: unknown) {
      // Handle specific error types
      const error = err as Error & { response?: { status: number } };
      if (error.name === "RateLimitError") {
        setError(
          "Too many login attempts. Please wait a moment before trying again."
        );
      } else if (error.response?.status === 429) {
        setError(
          "Too many requests. Please wait a moment before trying again."
        );
      } else if (error.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (error.response?.status === 403) {
        setError("Account is disabled. Please contact support.");
      } else if (error.response?.status && error.response.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.register(userData);

      if (response.success) {
        setError(null);
        return true;
      } else {
        setError(response.message || "Registration failed");
        return false;
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (err) {
      // Ignore logout API errors
    } finally {
      // Disconnect socket before clearing state
      socketService.disconnectSocket();
      
      // Clear local storage and state
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      setUser(null);
      setError(null);
    }
  };

  // Clear error function
  const clearError = (): void => {
    setError(null);
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authAPI.getCurrentUser();
      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        response.data !== null &&
        "user" in response.data
      ) {
        const userData = (response.data as { user: User }).user;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (err) {
      // Error refreshing user data
      console.error("Error refreshing user data:", err);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
