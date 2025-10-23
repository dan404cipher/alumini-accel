import { useState, useEffect, useCallback } from "react";
import { messageAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface UseUnreadCountReturn {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUnreadCount = (): UseUnreadCountReturn => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await messageAPI.getUnreadCount();

      if (response.success && response.data) {
        // Handle different response structures
        const data = response.data as
          | { count?: number; unreadCount?: number }
          | number;
        const count =
          typeof data === "number" ? data : data.count || data.unreadCount || 0;

        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch unread count"
      );
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch unread count when user changes
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Set up polling to refresh unread count every 30 seconds (only when user is authenticated)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount, user]);

  return {
    unreadCount,
    isLoading,
    error,
    refetch: fetchUnreadCount,
  };
};
