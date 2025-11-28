import { useState, useEffect, useCallback, useRef } from "react";
import { notificationAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import socketService from "@/services/socketService";

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
  const userId = user?._id;
  const fetchNotificationCountRef = useRef<() => Promise<void>>();

  const fetchNotificationCount = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!userId) {
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
  }, [userId]);

  // Store the latest fetch function in a ref
  fetchNotificationCountRef.current = fetchNotificationCount;

  // Fetch notification count when user ID changes
  useEffect(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  // Listen to socket events for real-time updates (no API call needed)
  useEffect(() => {
    if (!userId) return;

    const handleNotificationCountUpdate = (data: { count: number }) => {
      // Update count directly from socket event (no API call)
      setNotificationCount(data.count || 0);
    };

    const handleNewNotification = () => {
      // Increment count when new notification arrives
      setNotificationCount((prev) => prev + 1);
    };

    const handleNotificationUpdate = (data: { action: string }) => {
      // Decrement count when notification is read/deleted
      if (data.action === "read" || data.action === "delete") {
        setNotificationCount((prev) => Math.max(0, prev - 1));
      }
    };

    // Wait for socket connection
    const setupSocketListeners = () => {
      if (socketService.isSocketConnected()) {
        socketService.on("notification_count_update", handleNotificationCountUpdate);
        socketService.on("new_notification", handleNewNotification);
        socketService.on("notification_update", handleNotificationUpdate);
      } else {
        setTimeout(setupSocketListeners, 1000);
      }
    };

    setupSocketListeners();

    return () => {
      socketService.off("notification_count_update", handleNotificationCountUpdate);
      socketService.off("new_notification", handleNewNotification);
      socketService.off("notification_update", handleNotificationUpdate);
    };
  }, [userId]);

  // Set up polling to refresh notification count every 3 minutes (only when tab is visible)
  // Reduced frequency since we have real-time socket updates
  useEffect(() => {
    if (!userId) {
      setNotificationCount(0);
      return;
    }

    // Only poll when tab is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && fetchNotificationCountRef.current) {
        fetchNotificationCountRef.current();
      }
    };

    // Poll every 3 minutes (180 seconds) when visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && fetchNotificationCountRef.current) {
        fetchNotificationCountRef.current();
      }
    }, 180000); // Poll every 3 minutes

    // Also fetch when tab becomes visible
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId]); // Only restart interval when userId changes

  return {
    notificationCount,
    isLoading,
    error,
    refetch: fetchNotificationCount,
  };
};
