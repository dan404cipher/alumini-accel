import { Document } from "mongoose";

// Connection status enum
export enum ConnectionStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  BLOCKED = "blocked",
  CANCELLED = "cancelled",
}

// Connection type enum
export enum ConnectionType {
  CONNECTION = "connection",
  MENTORSHIP = "mentorship",
  COLLABORATION = "collaboration",
}

// Connection interface
export interface IConnection extends Document {
  _id: string;
  requester: string; // User ID who sent the request
  recipient: string; // User ID who received the request
  status: ConnectionStatus;
  type: ConnectionType;
  message?: string; // Optional message with the request
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  blockedAt?: Date;

  // Virtual populated fields
  requesterUser?: any;
  recipientUser?: any;

  // Instance methods
  accept(): Promise<IConnection>;
  reject(): Promise<IConnection>;
  block(): Promise<IConnection>;
  cancel(): Promise<IConnection>;
}

// Connection request interface for API
export interface ConnectionRequest {
  recipientId: string;
  type: ConnectionType;
  message?: string;
}

// Connection response interface
export interface ConnectionResponse {
  id: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role: string;
  };
  status: ConnectionStatus;
  type: ConnectionType;
  message?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  blockedAt?: string;
}

// Connection statistics interface
export interface ConnectionStats {
  totalConnections: number;
  pendingRequests: number;
  sentRequests: number;
  receivedRequests: number;
  blockedUsers: number;
}

// Connection filter interface
export interface ConnectionFilter {
  status?: ConnectionStatus;
  type?: ConnectionType;
  search?: string;
  limit?: number;
  page?: number;
}
