import React, { useState, useEffect } from "react";
import {
  Mail,
  Search,
  Filter,
  Reply,
  Trash2,
  Download,
  Check,
  Clock,
  File,
  User,
  Calendar,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { EmailComposer } from "./EmailComposer";
import { format } from "date-fns";

interface CommunicationHistoryProps {
  communityId?: string;
  menteeId?: string;
  recipientId?: string;
  recipientName?: string;
  recipientType?: "mentor" | "mentee";
}

interface Communication {
  _id: string;
  fromUserId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  toUserId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subject: string;
  body: string;
  attachments: string[];
  sentAt: string;
  readAt?: string;
  isRead: boolean;
  replyToId?: string;
  replyTo?: Communication;
  communityId?: {
    _id: string;
    name: string;
  };
}

export const CommunicationHistory: React.FC<CommunicationHistoryProps> = ({
  communityId,
  menteeId,
  recipientId,
  recipientName,
  recipientType,
}) => {
  const { toast } = useToast();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSender, setFilterSender] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [selectedForReply, setSelectedForReply] = useState<Communication | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchCommunications();
    fetchUnreadCount();
  }, [communityId, menteeId]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      let response;
      if (communityId) {
        response = await api.get(
          `/mentorship-communications/community/${communityId}`
        );
      } else if (menteeId) {
        response = await api.get(
          `/mentorship-communications/mentee/${menteeId}`
        );
      } else {
        return;
      }

      if (response.data.success) {
        setCommunications(response.data.data.communications || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch communications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/mentorship-communications/unread-count");
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/mentorship-communications/${id}/mark-read`);
      setCommunications(
        communications.map((comm) =>
          comm._id === id
            ? { ...comm, isRead: true, readAt: new Date().toISOString() }
            : comm
        )
      );
      fetchUnreadCount();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark as read",
        variant: "destructive",
      });
    }
  };

  const deleteCommunication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this communication?")) {
      return;
    }

    try {
      await api.delete(`/mentorship-communications/${id}`);
      setCommunications(communications.filter((comm) => comm._id !== id));
      toast({
        title: "Success",
        description: "Communication deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleReply = (communication: Communication) => {
    setSelectedForReply(communication);
    setShowComposer(true);
  };

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      !searchTerm ||
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${comm.fromUserId.firstName} ${comm.fromUserId.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesSender =
      !filterSender ||
      comm.fromUserId._id === filterSender ||
      comm.toUserId._id === filterSender;

    return matchesSearch && matchesSender;
  });

  const senders = Array.from(
    new Set([
      ...communications.map((c) => ({
        id: c.fromUserId._id,
        name: `${c.fromUserId.firstName} ${c.fromUserId.lastName}`,
      })),
      ...communications.map((c) => ({
        id: c.toUserId._id,
        name: `${c.toUserId.firstName} ${c.toUserId.lastName}`,
      })),
    ])
  );

  if (loading && communications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Communication History</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {recipientId && recipientName && recipientType && (
          <button
            onClick={() => {
              setSelectedForReply(null);
              setShowComposer(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            New Message
          </button>
        )}
      </div>

      {/* Composer */}
      {showComposer && recipientId && recipientName && recipientType && (
        <EmailComposer
          communityId={communityId || ""}
          recipientId={recipientId}
          recipientName={recipientName}
          recipientType={recipientType}
          replyToId={selectedForReply?._id}
          onSent={() => {
            setShowComposer(false);
            setSelectedForReply(null);
            fetchCommunications();
            fetchUnreadCount();
          }}
          onCancel={() => {
            setShowComposer(false);
            setSelectedForReply(null);
          }}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by subject, content, or sender..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Sender
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={filterSender}
                onChange={(e) => setFilterSender(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">All Senders</option>
                {senders.map((sender) => (
                  <option key={sender.id} value={sender.id}>
                    {sender.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Communications List */}
      {filteredCommunications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No communications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommunications.map((comm) => {
            const isUnread = !comm.isRead;
            const isFromMe =
              comm.fromUserId._id === (window as any).userId; // Assuming userId is available

            return (
              <div
                key={comm._id}
                className={`bg-white rounded-lg border-2 p-6 ${
                  isUnread ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">
                        {comm.fromUserId.firstName} {comm.fromUserId.lastName}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="text-gray-700">
                        {comm.toUserId.firstName} {comm.toUserId.lastName}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {comm.subject}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(comm.sentAt), "MMM d, yyyy h:mm a")}
                      </div>
                      {comm.readAt && (
                        <div className="flex items-center text-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Read {format(new Date(comm.readAt), "MMM d, h:mm a")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isUnread && (
                      <button
                        onClick={() => markAsRead(comm._id)}
                        className="p-2 text-gray-500 hover:text-blue-600"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {recipientId && recipientType && (
                      <button
                        onClick={() => handleReply(comm)}
                        className="p-2 text-gray-500 hover:text-blue-600"
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                    )}
                    {isFromMe && (
                      <button
                        onClick={() => deleteCommunication(comm._id)}
                        className="p-2 text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="prose max-w-none text-gray-700 mb-4"
                  dangerouslySetInnerHTML={{ __html: comm.body }}
                />

                {comm.attachments && comm.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Attachments:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {comm.attachments.map((attachment, idx) => (
                        <a
                          key={idx}
                          href={`/api/v1/uploads/${attachment}`}
                          download
                          className="flex items-center px-3 py-2 bg-gray-100 rounded border border-gray-300 hover:bg-gray-200 text-sm"
                        >
                          <File className="w-4 h-4 mr-2" />
                          {attachment.split("/").pop()}
                          <Download className="w-3 h-3 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {comm.replyTo && (
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-500 mb-1">In reply to:</div>
                    <div className="text-sm font-medium text-gray-700">
                      {comm.replyTo.subject}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

