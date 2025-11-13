import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Loader2, Users, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role?: "Mentor" | "Mentee" | "Staff" | "Admin";
  };
  content: string;
  messageType: string;
  createdAt: string;
}

interface ChatMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: "Mentor" | "Mentee";
  preferredName?: string;
}

interface ProgramChatProps {
  programId: string;
  programName?: string;
}

export const ProgramChat: React.FC<ProgramChatProps> = ({ programId, programName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const lastErrorRef = useRef<string | null>(null);
  const errorToastShownRef = useRef(false);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/program-chat/${programId}/messages`, {
        params: { limit: 100, page: 1 },
      });

      if (response.data?.success && response.data?.data?.messages) {
        setMessages(response.data.data.messages);
        // Reset error state on successful fetch
        lastErrorRef.current = null;
        errorToastShownRef.current = false;
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch messages";
      const errorKey = `${error.response?.status || 'unknown'}-${errorMessage}`;
      
      // Only show toast if it's a new error or we haven't shown an error toast yet
      if (error.response?.status !== 403) {
        if (lastErrorRef.current !== errorKey && !errorToastShownRef.current) {
          errorToastShownRef.current = true;
          lastErrorRef.current = errorKey;
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Reset error toast flag after 10 seconds to allow showing again if error persists
          setTimeout(() => {
            errorToastShownRef.current = false;
          }, 10000);
        }
      } else {
        // For 403 errors, just log silently (user not authorized)
        console.log("User not authorized to view chat messages");
      }
      
      // Only log to console, don't show repeated toasts
      console.error("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (programId) {
      fetchMessages();
    }
  }, [programId]);

  // Set up polling for new messages (every 3 seconds)
  useEffect(() => {
    if (programId && !loading) {
      const interval = setInterval(() => {
        fetchMessages();
      }, 3000); // Poll every 3 seconds

      setPollingInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [programId, loading]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Fetch members
  const fetchMembers = async () => {
    if (!programId) return;
    setLoadingMembers(true);
    try {
      const response = await api.get(`/program-chat/${programId}/members`);
      if (response.data?.success && response.data?.data?.members) {
        setMembers(response.data.data.members);
      } else {
        setMembers([]);
      }
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch members",
        variant: "destructive",
      });
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Handle program name click
  const handleProgramNameClick = () => {
    setShowMembersDialog(true);
    if (members.length === 0) {
      fetchMembers();
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.post(`/program-chat/${programId}/messages`, {
        content: newMessage.trim(),
      });

      if (response.data?.success) {
        setNewMessage("");
        // Fetch messages again to get the new one
        await fetchMessages();
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <p className="text-gray-600">Loading chat messages...</p>
      </div>
    );
  }

  const currentUserId = user?.id || user?._id;

  return (
    <>
      <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white">
        {/* Header with Program Name */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <button
            onClick={handleProgramNameClick}
            className="flex items-center justify-between w-full hover:bg-gray-100 rounded-lg p-2 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                {programName || "Program Chat"}
              </h3>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
          </button>
        </div>

        {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender.id === currentUserId;
            const senderName = `${message.sender.firstName} ${message.sender.lastName}`;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-[70%]">
                  {/* Sender Name and Role - Above message */}
                  <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <span className={`text-xs font-semibold ${
                      isOwnMessage ? "text-blue-600" : "text-gray-700"
                    }`}>
                      {senderName}
                    </span>
                    {message.sender.role && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          message.sender.role === "Mentor"
                            ? isOwnMessage
                              ? "bg-blue-200 text-blue-800"
                              : "bg-blue-100 text-blue-800"
                            : message.sender.role === "Mentee"
                            ? isOwnMessage
                              ? "bg-purple-200 text-purple-800"
                              : "bg-purple-100 text-purple-800"
                            : message.sender.role === "Staff"
                            ? isOwnMessage
                              ? "bg-green-200 text-green-800"
                              : "bg-green-100 text-green-800"
                            : message.sender.role === "Admin"
                            ? isOwnMessage
                              ? "bg-orange-200 text-orange-800"
                              : "bg-orange-100 text-orange-800"
                            : isOwnMessage
                            ? "bg-purple-200 text-purple-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {message.sender.role}
                      </span>
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div
                    className={`rounded-lg p-3 ${
                      isOwnMessage
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                  
                  {/* Timestamp - Below message */}
                  <div
                    className={`text-xs mt-1 ${isOwnMessage ? "text-right text-gray-500" : "text-left text-gray-500"}`}
                  >
                    {format(new Date(message.createdAt), "hh:mm a")}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Program Members
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            {loadingMembers ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <p className="text-gray-600">Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mentors Section */}
                {members.filter((m) => m.role === "Mentor").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Mentors</h4>
                    <div className="space-y-2">
                      {members
                        .filter((m) => m.role === "Mentor")
                        .map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                              {member.profilePicture ? (
                                <img
                                  src={member.profilePicture}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                `${member.firstName[0]}${member.lastName[0]}`
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {member.preferredName ||
                                  `${member.firstName} ${member.lastName}`}
                              </p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              Mentor
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Mentees Section */}
                {members.filter((m) => m.role === "Mentee").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Mentees ({members.filter((m) => m.role === "Mentee").length})
                    </h4>
                    <div className="space-y-2">
                      {members
                        .filter((m) => m.role === "Mentee")
                        .map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                              {member.profilePicture ? (
                                <img
                                  src={member.profilePicture}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                `${member.firstName[0]}${member.lastName[0]}`
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Mentee
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

