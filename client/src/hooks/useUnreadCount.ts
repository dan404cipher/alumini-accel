import { useState, useEffect, useCallback, useRef } from "react";
import { messageAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import socketService from "@/services/socketService";

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
  const userId = user?._id;
  const fetchUnreadCountRef = useRef<() => Promise<void>>();

  const fetchUnreadCount = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!userId) {
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
  }, [userId]);

  // Store the latest fetch function in a ref
  fetchUnreadCountRef.current = fetchUnreadCount;

  // Fetch unread count when user ID changes
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Listen to socket events for real-time updates (no API call needed)
  useEffect(() => {
    if (!userId) return;

    const handleUnreadCountUpdate = (data: { count: number }) => {
      // Update count directly from socket event (no API call)
      setUnreadCount(data.count || 0);
    };

    // Wait for socket connection
    const setupSocketListener = (retries: number = 0, maxRetries: number = 10) => {
      if (socketService.isSocketConnected()) {
        socketService.on("unread_count_update", handleUnreadCountUpdate);
      } else if (retries < maxRetries) {
        setTimeout(() => setupSocketListener(retries + 1, maxRetries), 1000);
      } else {
        console.error('useUnreadCount: Failed to connect socket after max retries');
      }
    };

    setupSocketListener();

    return () => {
      socketService.off("unread_count_update", handleUnreadCountUpdate);
    };
  }, [userId]);

  // Set up polling to refresh unread count every 2 minutes (only when tab is visible)
  // Reduced frequency since we have real-time socket updates
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    // Only poll when tab is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && fetchUnreadCountRef.current) {
        fetchUnreadCountRef.current();
      }
    };

    // Poll every 2 minutes (120 seconds) when visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && fetchUnreadCountRef.current) {
        fetchUnreadCountRef.current();
      }
    }, 120000); // Poll every 2 minutes

    // Also fetch when tab becomes visible
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId]); // Only restart interval when userId changes

  return {
    unreadCount,
    isLoading,
    error,
    refetch: fetchUnreadCount,
  };
};
