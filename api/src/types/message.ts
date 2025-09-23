import { Document } from "mongoose";

// Message interface
export interface IMessage extends Document {
  _id: string;
  sender: string; // User ID who sent the message
  recipient: string; // User ID who received the message
  content: string; // Message content
  messageType: MessageType;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message type enum
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  SYSTEM = "system",
}

// Message request interface for API
export interface MessageRequest {
  recipientId: string;
  content: string;
  messageType?: MessageType;
}

// Message response interface
export interface MessageResponse {
  id: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  content: string;
  messageType: MessageType;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Conversation interface
export interface Conversation {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

// Message filter interface
export interface MessageFilter {
  recipientId?: string;
  isRead?: boolean;
  messageType?: MessageType;
  limit?: number;
  page?: number;
}
