import { Types } from "mongoose";
import { Notification } from "../models/Notification";
import User from "../models/User";
import { logger } from "../utils/logger";
import { getSocketService } from "./socketServiceInstance";
import {
  IUser,
  UserRole,
  UserStatus,
  INotification,
} from "../types";

export type NotificationEvent =
  | "job.new"
  | "job.applied"
  | "job.application.received"
  | "job.application.accepted"
  | "job.application.rejected"
  | "event.published"
  | "event.registered"
  | "event.attendance"
  | "event.reminder"
  | "news.published"
  | "gallery.album"
  | "gallery.media"
  | "community.created"
  | "community.joined"
  | "community.join.request"
  | "community.request.approved"
  | "community.request.rejected"
  | "post.new"
  | "post.comment"
  | "post.like"
  | "comment.reply"
  | "connection.request"
  | "connection.accepted"
  | "donation.campaign"
  | "donation.success"
  | "donation.thankyou"
  | "reward.new"
  | "task.assigned"
  | "task.completed"
  | "task.rejected"
  | "task.resubmitted"
  | "reward.earned"
  | "reward.claimed"
  | "profile.reminder"
  | "profile.completed";

type TemplateBuilder = {
  category: string;
  type?: "info" | "success" | "warning" | "error";
  priority?: "low" | "medium" | "high" | "urgent";
  actionUrl?: string | ((data?: Record<string, any>) => string | undefined);
  title: (data?: Record<string, any>) => string;
  message: (data?: Record<string, any>) => string;
};

const notificationTemplates: Record<NotificationEvent, TemplateBuilder> = {
  "job.new": {
    category: "job",
    type: "info",
    actionUrl: (data) => `/jobs/${data?.jobId ?? ""}`,
    title: (data) => `New job posted: ${data?.title ?? "Job Opportunity"}`,
    message: (data) =>
      `${data?.company ?? "An employer"} just posted a${
        data?.title ? ` ${data.title}` : ""
      } role. Apply before it fills up!`,
  },
  "job.applied": {
    category: "job",
    type: "success",
    actionUrl: (data) => `/jobs/myapplications/${data?.jobId ?? ""}`,
    title: () => "Application submitted",
    message: (data) =>
      `Your application for ${data?.title ?? "the job"} was sent successfully.`,
  },
  "job.application.received": {
    category: "job",
    type: "info",
    actionUrl: (data) => `/jobs/${data?.jobId ?? ""}/applications`,
    title: () => "New job application received",
    message: (data) =>
      `${data?.applicantName ?? "An applicant"} applied for ${
        data?.title ?? "your job"
      }.`,
  },
  "job.application.accepted": {
    category: "job",
    type: "success",
    actionUrl: (data) => `/jobs/myapplications/${data?.jobId ?? ""}`,
    title: () => "Application shortlisted",
    message: (data) =>
      `Great news! Your application for ${
        data?.title ?? "the job"
      } moved to the next stage.`,
  },
  "job.application.rejected": {
    category: "job",
    type: "warning",
    actionUrl: (data) => `/jobs/myapplications/${data?.jobId ?? ""}`,
    title: () => "Application update",
    message: (data) =>
      `Your application for ${data?.title ?? "the job"} was not selected.`,
  },
  "event.published": {
    category: "event",
    type: "info",
    actionUrl: (data) => `/events/${data?.eventId ?? ""}`,
    title: (data) => `New event: ${data?.title ?? "Campus event"}`,
    message: (data) =>
      `${data?.organizer ?? "Your college"} announced a new event starting ${data?.startDateFormatted ?? "soon"}.`,
  },
  "event.registered": {
    category: "event",
    type: "success",
    actionUrl: (data) => `/events/${data?.eventId ?? ""}`,
    title: () => "Event registration confirmed",
    message: (data) =>
      `You're registered for ${data?.title ?? "the event"}. Check details for venue and timing.`,
  },
  "event.attendance": {
    category: "event",
    type: "success",
    title: (data) => `Thanks for attending ${data?.title ?? "the event"}`,
    message: () =>
      "We recorded your attendance. Hope you had a great experience!",
  },
  "event.reminder": {
    category: "event",
    type: "info",
    title: (data) => `${data?.title ?? "Event"} starts soon`,
    message: (data) =>
      `Reminder: ${data?.title ?? "Your event"} begins on ${
        data?.startDateFormatted ?? "the scheduled date"
      }.`,
  },
  "news.published": {
    category: "announcement",
    type: "info",
    actionUrl: (data) => `/news/${data?.newsId ?? ""}`,
    title: (data) => data?.title ?? "News update",
    message: (data) =>
      `${data?.summary ?? "A new story"} has been published. Tap to read more.`,
  },
  "gallery.album": {
    category: "announcement",
    type: "info",
    actionUrl: (data) => `/gallery/${data?.albumId ?? ""}`,
    title: (data) => `New album: ${data?.title ?? "Gallery update"}`,
    message: () => "Fresh memories have been added to the gallery.",
  },
  "gallery.media": {
    category: "announcement",
    type: "info",
    actionUrl: (data) => `/gallery/${data?.albumId ?? ""}`,
    title: () => "New photos uploaded",
    message: (data) =>
      `${data?.count ?? "Some"} new media items are now live in ${
        data?.albumTitle ?? "the gallery"
      }.`,
  },
  "community.created": {
    category: "community",
    type: "info",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}`,
    title: (data) => `${data?.name ?? "A new community"} is live`,
    message: () => "Join the conversation and connect with peers.",
  },
  "community.join.request": {
    category: "community",
    type: "info",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}`,
    title: () => "New join request",
    message: (data) =>
      `${data?.requesterName ?? "A member"} wants to join ${
        data?.communityName ?? "your community"
      }.`,
  },
  "community.joined": {
    category: "community",
    type: "success",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}`,
    title: () => "Welcome to the community",
    message: (data) =>
      `You just joined ${data?.name ?? "a community"}. Start posting and engaging!`,
  },
  "community.request.approved": {
    category: "community",
    type: "success",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}`,
    title: () => "Community request approved",
    message: (data) =>
      `Your request to join "${data?.name ?? "the community"}" has been approved.`,
  },
  "community.request.rejected": {
    category: "community",
    type: "info",
    actionUrl: "/communities",
    title: () => "Community request rejected",
    message: (data) =>
      `Your request to join "${data?.name ?? "the community"}" was rejected.`,
  },
  "post.new": {
    category: "community",
    type: "info",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}/posts`,
    title: (data) => `${data?.authorName ?? "Someone"} posted in ${
      data?.communityName ?? "your community"
    }`,
    message: (data) =>
      `${data?.preview ?? "New activity"} — jump in to keep the momentum going.`,
  },
  "post.comment": {
    category: "community",
    type: "info",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}/posts/${data?.postId ?? ""}`,
    title: () => "New comment on your post",
    message: (data) =>
      `${data?.commenterName ?? "Someone"} commented on your post.`,
  },
  "post.like": {
    category: "community",
    type: "success",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}/posts/${data?.postId ?? ""}`,
    title: () => "Your post is getting likes",
    message: (data) =>
      `${data?.likerName ?? "Someone"} liked your recent update.`,
  },
  "comment.reply": {
    category: "community",
    type: "info",
    actionUrl: (data) => `/communities/${data?.communityId ?? ""}/posts/${data?.postId ?? ""}`,
    title: () => "New reply to your comment",
    message: (data) =>
      `${data?.replierName ?? "Someone"} replied to your comment.`,
  },
  "connection.request": {
    category: "connection",
    type: "info",
  actionUrl: "/connections/pending",
    title: () => "New connection request",
    message: (data) =>
      `${data?.senderName ?? "A user"} wants to connect with you.`,
  },
  "connection.accepted": {
    category: "connection",
    type: "success",
    actionUrl: "/connections",
    title: () => "Connection request accepted",
    message: (data) =>
      `${data?.recipientName ?? "They"} accepted your connection request.`,
  },
  "donation.campaign": {
    category: "donation",
    type: "info",
    actionUrl: (data) => `/donations/campaigns/${data?.campaignId ?? ""}`,
    title: (data) => `New campaign: ${data?.title ?? "Support cause"}`,
    message: (data) =>
      `${data?.organizer ?? "The college"} launched a new fundraising campaign.`,
  },
  "donation.success": {
    category: "donation",
    type: "success",
    title: () => "Thank you for your donation",
    message: (data) =>
      `We received your ${data?.amount ?? ""} donation for ${
        data?.campaignTitle ?? "the campaign"
      }.`,
  },
  "donation.thankyou": {
    category: "donation",
    type: "success",
    title: () => "A note of thanks",
    message: (data) =>
      `${data?.organizer ?? "The campaign team"} sent a thank-you note.`,
  },
  "reward.new": {
    category: "reward",
    type: "info",
    actionUrl: (data) => data?.rewardId ? `/rewards?reward=${data.rewardId}` : "/rewards",
    title: (data) => `New reward: ${data?.title ?? "Reward available"}`,
    message: (data) =>
      `A new reward${data?.title ? ` "${data.title}"` : ""} is live in the catalogue. Redeem points before it expires.`,
  },
  "task.assigned": {
    category: "reward",
    type: "info",
    actionUrl: "/rewards",
    title: () => "New task assigned",
    message: (data) =>
      `${data?.assignedBy ?? "The college"} assigned you a new task worth ${data?.points ?? 0} pts.`,
  },
  "task.completed": {
    category: "reward",
    type: "success",
    actionUrl: "/rewards",
    title: () => "Task marked complete",
    message: (data) =>
      `Your submission for ${data?.taskTitle ?? "a task"} is complete. Pending verification.`,
  },
  "task.rejected": {
    category: "reward",
    type: "error",
    actionUrl: "/rewards",
    title: () => "Task verification rejected",
    message: (data) =>
      `Your task "${data?.taskTitle ?? "task"}" was rejected. ${data?.rejectionReason ? `Reason: ${data.rejectionReason}` : "Please review and resubmit."}`,
  },
  "task.resubmitted": {
    category: "reward",
    type: "info",
    actionUrl: "/rewards",
    title: () => "Task resubmitted",
    message: (data) =>
      `Your task "${data?.taskTitle ?? "task"}" has been resubmitted and is pending verification again.`,
  },
  "reward.earned": {
    category: "reward",
    type: "success",
    actionUrl: "/rewards",
    title: () => "Reward unlocked",
    message: (data) =>
      `You earned ${data?.points ?? 0} pts and ${
        data?.badgeName ? `badge ${data.badgeName}` : "a new reward"
      }.`,
  },
  "reward.claimed": {
    category: "reward",
    type: "success",
    actionUrl: "/rewards",
    title: () => "Reward claimed",
    message: (data) =>
      `Enjoy your reward: ${data?.title ?? "Reward"}. Check your email for details.`,
  },
  "profile.reminder": {
    category: "reminder",
    type: "warning",
    actionUrl: "/profile",
    title: () => "Complete your profile",
    message: (data) =>
      `Your profile is ${data?.completion ?? "still"} incomplete. Finish it to unlock more features.`,
  },
  "profile.completed": {
    category: "reminder",
    type: "success",
    actionUrl: "/profile",
    title: () => "Profile completed",
    message: () =>
      "Awesome! Your alumni profile is now 100% complete and visible to the network.",
  },
};

interface BaseNotificationPayload {
  recipients: string[];
  event: NotificationEvent;
  data?: Record<string, any>;
  overrides?: Partial<
    Pick<
      TemplateBuilder,
      "title" | "message" | "category" | "type" | "priority" | "actionUrl"
    >
  >;
  metadata?: Record<string, any>;
  relatedEntity?: { type: string; id: string };
}

const MAX_RECIPIENTS = 500;

const buildTemplate = (
  event: NotificationEvent,
  data: Record<string, any> | undefined,
  overrides?: BaseNotificationPayload["overrides"]
) => {
  const template = notificationTemplates[event];

  const title =
    overrides?.title?.(data) ??
    (typeof overrides?.title === "string"
      ? overrides.title
      : template.title(data));

  const message =
    overrides?.message?.(data) ??
    (typeof overrides?.message === "string"
      ? overrides.message
      : template.message(data));

  const actionUrlValue =
    typeof overrides?.actionUrl === "function"
      ? overrides.actionUrl(data)
      : overrides?.actionUrl ??
        (typeof template.actionUrl === "function"
          ? template.actionUrl(data)
          : template.actionUrl);

  return {
    title,
    message,
    actionUrl: actionUrlValue,
    category: overrides?.category ?? template.category,
    type: overrides?.type ?? template.type ?? "info",
    priority: overrides?.priority ?? template.priority ?? "medium",
  };
};

const chunkRecipients = (recipients: string[]) => {
  const chunks: string[][] = [];
  for (let i = 0; i < recipients.length; i += MAX_RECIPIENTS) {
    chunks.push(recipients.slice(i, i + MAX_RECIPIENTS));
  }
  return chunks;
};

class NotificationService {
  async send(payload: BaseNotificationPayload): Promise<INotification[]> {
    const { recipients, event, data, overrides, metadata, relatedEntity } =
      payload;

    if (!recipients?.length) {
      logger.warn(`Notification skipped (${event}) - no recipients provided`);
      return [];
    }

    const built = buildTemplate(event, data, overrides);
    const chunks = chunkRecipients(recipients);
    const notifications: INotification[] = [];

    for (const chunk of chunks) {
      const operations = chunk.map(async (userId) => {
        try {
          const record = await Notification.createNotification({
            userId,
            title: built.title,
            message: built.message,
            type: built.type,
            category: built.category,
            priority: built.priority,
            actionUrl: built.actionUrl,
            metadata: {
              ...(metadata || {}),
              event,
              data,
            },
            relatedEntity,
          });

          notifications.push(record);

          try {
            const socketService = getSocketService();
            socketService.emitNewNotification(record);
            const unread = await Notification.getUnreadCount(userId);
            socketService.emitNotificationCountUpdate(userId, unread);
            socketService.emitUnreadCountUpdate(userId, unread);
          } catch (err) {
            logger.warn("Socket service not available for notification:", err);
          }
        } catch (err) {
          logger.error("Error sending notification:", err);
        }
      });

      await Promise.all(operations);
    }

    return notifications;
  }

  async sendToRoles(params: {
    event: NotificationEvent;
    roles: UserRole[];
    tenantId?: string | Types.ObjectId | null;
    data?: Record<string, any>;
    overrides?: BaseNotificationPayload["overrides"];
    metadata?: Record<string, any>;
    relatedEntity?: { type: string; id: string };
    filters?: Record<string, any>;
  }) {
    const { roles, tenantId, filters = {} } = params;
    const query: any = {
      role: { $in: roles },
      status: UserStatus.ACTIVE,
      ...filters,
    };

    if (tenantId) {
      // Convert tenantId to ObjectId if it's a string, or use as-is if already ObjectId
      query.tenantId = Types.ObjectId.isValid(tenantId)
        ? typeof tenantId === "string"
          ? new Types.ObjectId(tenantId)
          : tenantId
        : tenantId;
    }

    const users = await User.find(query).select("_id");
    const recipientIds = users.map((user) => user._id.toString());

    logger.info(
      `Notification sendToRoles: event=${params.event}, roles=${roles.join(",")}, tenantId=${tenantId}, foundUsers=${users.length}, recipients=${recipientIds.length}`
    );

    if (recipientIds.length === 0) {
      logger.warn(
        `No recipients found for notification ${params.event} with tenantId=${tenantId} and roles=${roles.join(",")}`
      );
    }

    return this.send({
      recipients: recipientIds,
      event: params.event,
      data: params.data,
      overrides: params.overrides,
      metadata: params.metadata,
      relatedEntity: params.relatedEntity,
    });
  }

  async sendToUsers(params: {
    userIds: (string | Types.ObjectId)[];
    event: NotificationEvent;
    data?: Record<string, any>;
    overrides?: BaseNotificationPayload["overrides"];
    metadata?: Record<string, any>;
    relatedEntity?: { type: string; id: string };
  }) {
    const recipients = params.userIds.map((id) =>
      typeof id === "string" ? id : id.toString()
    );
    return this.send({
      recipients,
      event: params.event,
      data: params.data,
      overrides: params.overrides,
      metadata: params.metadata,
      relatedEntity: params.relatedEntity,
    });
  }
}

const notificationService = new NotificationService();

export default notificationService;

