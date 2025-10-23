import { useState, useEffect, useCallback } from "react";
import { notificationAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface UseNotificationCountReturn {
  notificationCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useNotificationCount = (): UseNotificationCountReturn => {
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotificationCount = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user) {
      setNotificationCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationAPI.getUnreadCount();

      if (response.success && response.data) {
        const data = response.data as { count?: number } | number;
        const count = typeof data === "number" ? data : data.count || 0;

        setNotificationCount(count);
      } else {
        setNotificationCount(0);
      }
    } catch (err) {
      console.error("Error fetching notification count:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch notification count"
      );
      setNotificationCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch notification count when user changes
  useEffect(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  // Set up polling to refresh notification count every 60 seconds (only when user is authenticated)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(interval);
  }, [fetchNotificationCount, user]);

  return {
    notificationCount,
    isLoading,
    error,
    refetch: fetchNotificationCount,
  };
};
