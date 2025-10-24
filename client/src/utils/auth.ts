/**
 * Authentication utility functions
 * Centralized token management for the application
 */

/**
 * Get authentication token from localStorage or sessionStorage
 * @returns The authentication token or throws an error if not found
 */
export const getAuthToken = (): string => {
  // Check localStorage first (remember me), then sessionStorage
  let token = localStorage.getItem("token");
  if (!token) {
    token = sessionStorage.getItem("token");
  }
  if (!token) {
    throw new Error("Access token is required");
  }
  return token;
};

/**
 * Get authentication token from localStorage or sessionStorage (nullable)
 * @returns The authentication token or null if not found
 */
export const getAuthTokenOrNull = (): string | null => {
  // Check localStorage first (remember me), then sessionStorage
  let token = localStorage.getItem("token");
  if (!token) {
    token = sessionStorage.getItem("token");
  }
  return token;
};

/**
 * Clear all authentication data from both localStorage and sessionStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");
};

/**
 * Check if user is authenticated (has a valid token)
 * @returns true if user has a token, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return getAuthTokenOrNull() !== null;
};
