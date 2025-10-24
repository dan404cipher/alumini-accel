import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import socketService from "@/services/socketService";

interface NotificationContextType {
  unreadCount: number;
  notificationCount: number;
  isLoading: boolean;
  refreshUnreadCount: () => Promise<void>;
  refreshNotificationCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const {
    unreadCount,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useUnreadCount();
  const {
    notificationCount,
    isLoading: notificationLoading,
    refetch: refetchNotification,
  } = useNotificationCount();

  const refreshUnreadCount = async () => {
    await refetchUnread();
  };

  const refreshNotificationCount = async () => {
    await refetchNotification();
  };

  // Set up socket event listeners for real-time updates
  useEffect(() => {
    // Wait for socket to be connected before setting up listeners
    const setupSocketListeners = () => {
      if (socketService.isSocketConnected()) {
        console.log("🔔 Setting up notification socket listeners");

        // Listen for unread count updates
        socketService.on("unread_count_update", (data: { count: number }) => {
          // Trigger a refetch to get the latest count
          refreshUnreadCount();
        });

        // Listen for notification count updates
        socketService.on(
          "notification_count_update",
          (data: { count: number }) => {
            // Trigger a refetch to get the latest notifications
            refreshNotificationCount();
          }
        );

        // Listen for new notifications
        socketService.on("new_notification", (notification: any) => {
          // Trigger a refetch to get the latest notifications
          refreshNotificationCount();
        });

        // Listen for notification updates (read/delete)
        socketService.on(
          "notification_update",
          (data: { notificationId: string; action: string }) => {
            // Trigger a refetch to get the latest notifications
            refreshNotificationCount();
          }
        );
      } else {
        console.log("🔔 Socket not connected yet, retrying in 1 second...");
        setTimeout(setupSocketListeners, 1000);
      }
    };

    // Start setting up listeners
    setupSocketListeners();

    // Cleanup listeners on unmount
    return () => {
      socketService.off("unread_count_update");
      socketService.off("notification_count_update");
      socketService.off("new_notification");
      socketService.off("notification_update");
    };
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    notificationCount,
    isLoading: unreadLoading || notificationLoading,
    refreshUnreadCount,
    refreshNotificationCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};
