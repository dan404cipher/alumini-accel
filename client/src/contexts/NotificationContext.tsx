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

  // Note: Socket event listeners are now handled directly in the hooks
  // (useUnreadCount and useNotificationCount) to avoid unnecessary API calls.
  // The hooks update the count directly from socket events without refetching.

  const value: NotificationContextType = {
    unreadCount: unreadCount || 0,
    notificationCount: notificationCount || 0,
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
