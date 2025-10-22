import React, { createContext, useContext, ReactNode } from "react";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useNotificationCount } from "@/hooks/useNotificationCount";

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
