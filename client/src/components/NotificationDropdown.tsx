import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { notificationAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  isToday,
  isYesterday,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  isWithinInterval,
} from "date-fns";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  timeAgo?: string;
  metadata?: {
    event?: string;
    [key: string]: any;
  };
  category?: string;
  priority?: string;
}

interface NotificationDropdownProps {
  className?: string;
}

type GroupKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "older";

interface DisplayNotification {
  ids: string[];
  primaryId: string;
  title: string;
  message: string;
  actionUrl?: string;
  type: Notification["type"];
  category?: string;
  isRead: boolean;
  createdAt: string;
  displayTimestamp: string;
  aggregated?: boolean;
  count: number;
  extraLabel?: string;
  metadata?: Notification["metadata"];
}

interface GroupedNotificationSet {
  key: GroupKey;
  label: string;
  items: DisplayNotification[];
}

const MAX_NOTIFICATION_AGE_DAYS = 90;
const GROUP_SEQUENCE: GroupKey[] = [
  "today",
  "yesterday",
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
  "older",
];

const AGGREGATABLE_EVENTS = new Set<string>([
  "connection.request",
  "job.new",
  "event.published",
  "post.new",
  "post.comment",
  "post.like",
  "donation.campaign",
]);

const pluralize = (word: string, count: number) =>
  count === 1 ? word : `${word}s`;

const AGGREGATION_COPY: Record<
  string,
  {
    label: string;
    buildTitle: (count: number) => string;
    message: string;
  }
> = {
  "connection.request": {
    label: "connection requests",
    buildTitle: (count) => `${count} new connection ${pluralize("request", count)}`,
    message: "Tap to review pending invitations.",
  },
  "job.new": {
    label: "job posts",
    buildTitle: (count) => `${count} new job ${pluralize("posting", count)}`,
    message: "Explore the latest opportunities.",
  },
  "event.published": {
    label: "events",
    buildTitle: (count) => `${count} new ${pluralize("event", count)}`,
    message: "See what's happening on campus.",
  },
  "post.new": {
    label: "community posts",
    buildTitle: (count) => `${count} new ${pluralize("post", count)}`,
    message: "Catch up on community conversations.",
  },
  "post.comment": {
    label: "comments",
    buildTitle: (count) => `${count} new ${pluralize("comment", count)}`,
    message: "Your posts are getting more replies.",
  },
  "post.like": {
    label: "likes",
    buildTitle: (count) => `${count} new ${pluralize("like", count)}`,
    message: "Your activity is getting noticed.",
  },
  "donation.campaign": {
    label: "campaigns",
    buildTitle: (count) => `${count} new ${pluralize("campaign", count)}`,
    message: "Support the latest fundraising efforts.",
  },
};

const getGroupDescriptor = (date: Date, now: Date): { key: GroupKey; label: string } => {
  if (isToday(date)) {
    return { key: "today", label: "Today" };
  }

  if (isYesterday(date)) {
    return { key: "yesterday", label: "Yesterday" };
  }

  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  if (
    isWithinInterval(date, {
      start: currentWeekStart,
      end: now,
    })
  ) {
    return { key: "thisWeek", label: "This Week" };
  }

  const lastWeekStart = subWeeks(currentWeekStart, 1);
  const lastWeekEnd = subDays(currentWeekStart, 1);
  if (
    isWithinInterval(date, {
      start: lastWeekStart,
      end: lastWeekEnd,
    })
  ) {
    return { key: "lastWeek", label: "Last Week" };
  }

  const currentMonthStart = startOfMonth(now);
  if (
    isWithinInterval(date, {
      start: currentMonthStart,
      end: now,
    })
  ) {
    return { key: "thisMonth", label: "This Month" };
  }

  const lastMonthDate = subMonths(now, 1);
  const lastMonthStart = startOfMonth(lastMonthDate);
  const lastMonthEnd = endOfMonth(lastMonthDate);
  if (
    isWithinInterval(date, {
      start: lastMonthStart,
      end: lastMonthEnd,
    })
  ) {
    return {
      key: "lastMonth",
      label: `Last Month • ${format(date, "MMMM")}`,
    };
  }

  return { key: "older", label: "Older" };
};

const formatTimestampLabel = (groupKey: GroupKey, date: Date) => {
  switch (groupKey) {
    case "today":
      return format(date, "p");
    case "yesterday":
      return `Yesterday • ${format(date, "p")}`;
    case "thisWeek":
      return `${format(date, "EEE")} • ${format(date, "p")}`;
    case "lastWeek":
      return `Last week • ${format(date, "EEE, p")}`;
    case "thisMonth":
      return `${format(date, "d MMM")}, ${format(date, "p")}`;
    case "lastMonth":
      return `${format(date, "d MMM")}, ${format(date, "p")}`;
    default:
      return format(date, "dd MMM yyyy, p");
  }
};

const convertToDisplayNotification = (
  notification: Notification,
  groupKey: GroupKey
): DisplayNotification => {
  const createdDate = new Date(notification.createdAt);
  return {
    ids: [notification._id],
    primaryId: notification._id,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl,
    type: notification.type,
    category: notification.category,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    displayTimestamp: formatTimestampLabel(groupKey, createdDate),
    metadata: notification.metadata,
    count: 1,
  };
};

const buildAggregatedDisplayItem = (
  bucket: Notification[],
  eventKey: string,
  groupKey: GroupKey
): DisplayNotification => {
  const latest = bucket[0];
  const template =
    AGGREGATION_COPY[eventKey] ?? {
      label: "notifications",
      buildTitle: (count: number) =>
        `${count} new notification${count === 1 ? "" : "s"}`,
      message: latest.message,
    };

  const count = bucket.length;

  return {
    ids: bucket.map((item) => item._id),
    primaryId: latest._id,
    title: template.buildTitle(count),
    message: template.message || latest.message,
    actionUrl: latest.actionUrl,
    type: latest.type,
    category: latest.category,
    isRead: bucket.every((item) => item.isRead),
    createdAt: latest.createdAt,
    displayTimestamp: formatTimestampLabel(
      groupKey,
      new Date(latest.createdAt)
    ),
    metadata: latest.metadata,
    aggregated: true,
    count,
    extraLabel:
      count > 1 ? `+${count - 1} more ${template.label}` : undefined,
  };
};

const aggregateGroupNotifications = (
  items: Notification[],
  groupKey: GroupKey
): DisplayNotification[] => {
  const buckets = new Map<
    string,
    {
      notifications: Notification[];
      eventKey?: string;
    }
  >();

  items.forEach((notification) => {
    const eventKey = notification.metadata?.event as string | undefined;
    const bucketKey =
      eventKey ??
      `${notification.category ?? "general"}::${
        notification.title ?? "notification"
      }`;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, { notifications: [], eventKey });
    }

    buckets.get(bucketKey)!.notifications.push(notification);
  });

  const aggregated: DisplayNotification[] = [];

  buckets.forEach(({ notifications: bucket, eventKey }) => {
    bucket.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (
      eventKey &&
      AGGREGATABLE_EVENTS.has(eventKey) &&
      bucket.length > 1
    ) {
      aggregated.push(
        buildAggregatedDisplayItem(bucket, eventKey, groupKey)
      );
    } else {
      bucket.forEach((notification) =>
        aggregated.push(convertToDisplayNotification(notification, groupKey))
      );
    }
  });

  return aggregated.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const buildGroupedNotifications = (
  items: Notification[]
): GroupedNotificationSet[] => {
  const now = new Date();
  const ninetyDaysAgo = subDays(now, MAX_NOTIFICATION_AGE_DAYS);

  const recentItems = items
    .filter((notification) => {
      const createdDate = new Date(notification.createdAt);
      return (
        !Number.isNaN(createdDate.getTime()) && createdDate >= ninetyDaysAgo
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const groupedMap = new Map<
    GroupKey,
    {
      label: string;
      items: Notification[];
    }
  >();

  recentItems.forEach((notification) => {
    const createdDate = new Date(notification.createdAt);
    const descriptor = getGroupDescriptor(createdDate, now);

    if (!groupedMap.has(descriptor.key)) {
      groupedMap.set(descriptor.key, {
        label: descriptor.label,
        items: [],
      });
    }

    groupedMap.get(descriptor.key)!.items.push(notification);
  });

  return GROUP_SEQUENCE.map((key) => {
    const group = groupedMap.get(key);
    if (!group) return null;
    const aggregatedItems = aggregateGroupNotifications(group.items, key);
    if (!aggregatedItems.length) return null;
    return {
      key,
      label: group.label,
      items: aggregatedItems,
    };
  }).filter(Boolean) as GroupedNotificationSet[];
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  className = "",
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { notificationCount, refreshNotificationCount } =
    useNotificationContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const groupedNotifications = useMemo(
    () => buildGroupedNotifications(notifications),
    [notifications]
  );

  // Fetch notifications when dropdown opens
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ limit: 50 });

      if (response.success) {
        const payload = response.data as
          | { notifications?: Notification[] }
          | { data?: { notifications?: Notification[] } };
        const records =
          (payload as any)?.notifications ??
          (payload as any)?.data?.notifications ??
          [];
        setNotifications(records);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark one or more notifications as read
  const markNotificationsAsRead = async (notificationIds: string[]) => {
    if (!notificationIds.length) return;

    const unreadIds = notifications
      .filter(
        (notif) => notificationIds.includes(notif._id) && !notif.isRead
      )
      .map((notif) => notif._id);

    if (!unreadIds.length) return;

    try {
      await Promise.all(
        unreadIds.map((id) => notificationAPI.markAsRead(id))
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          unreadIds.includes(notif._id) ? { ...notif, isRead: true } : notif
        )
      );
      await refreshNotificationCount();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();

      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
        await refreshNotificationCount();
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  // Delete one or more notifications
  const deleteNotifications = async (notificationIds: string[]) => {
    if (!notificationIds.length) return;

    try {
      await Promise.all(
        notificationIds.map((id) => notificationAPI.deleteNotification(id))
      );
      setNotifications((prev) =>
        prev.filter((notif) => !notificationIds.includes(notif._id))
      );
      await refreshNotificationCount();
    } catch (error) {
      console.error("Error deleting notifications:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (item: DisplayNotification) => {
    await markNotificationsAsRead(item.ids);

    if (item.actionUrl) {
      if (item.actionUrl.startsWith("http")) {
        window.open(item.actionUrl, "_blank");
      } else {
        navigate(item.actionUrl);
      }
    }

    setIsOpen(false);
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative p-2.5 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-105 group ${className}`}
        >
          <Bell className="w-5 h-5 group-hover:animate-pulse" />
          {/* Notification badge - only show if there are notifications */}
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg animate-pulse">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.key} className="pb-2">
              <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-gray-500">
                {group.label}
              </div>
              {group.items.map((item) => (
                <DropdownMenuItem
                  key={`${group.key}-${item.primaryId}`}
                  className={`p-3 cursor-pointer ${
                    !item.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-medium ${
                              !item.isRead ? "font-semibold" : ""
                            }`}
                          >
                            {item.title}
                          </h4>
                          {item.aggregated && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold"
                            >
                              {item.count}
                            </Badge>
                          )}
                        </div>
                        {!item.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {item.message}
                      </p>
                      {item.extraLabel && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          {item.extraLabel}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {item.displayTimestamp}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.actionUrl && (
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotifications(item.ids);
                            }}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))
        )}

        {groupedNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
