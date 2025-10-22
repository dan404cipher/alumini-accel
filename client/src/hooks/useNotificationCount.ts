import { useState, useEffect, useCallback } from "react";
import { notificationAPI } from "@/lib/api";

interface UseNotificationCountReturn {
  notificationCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useNotificationCount = (): UseNotificationCountReturn => {
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificationCount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationAPI.getUnreadCount();

      if (response.success && response.data) {
        const count =
          typeof response.data === "number"
            ? response.data
            : response.data.count || 0;

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
  }, []);

  // Fetch notification count on mount
  useEffect(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  // Set up polling to refresh notification count every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  return {
    notificationCount,
    isLoading,
    error,
    refetch: fetchNotificationCount,
  };
};
