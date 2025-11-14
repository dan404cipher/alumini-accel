import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Send,
  Search,
  MoreHorizontal,
  Trash2,
  Check,
  CheckCheck,
  Edit,
  Reply,
  X,
} from "lucide-react";
import { messageAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useMessagesContext } from "@/contexts/MessagesContext";

interface Message {
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
  messageType: string;
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
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

const Messages = () => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null
  );
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { refreshUnreadCount } = useNotificationContext();
  const {
    messages: socketMessages,
    setMessages: setSocketMessages,
    joinConversation,
    leaveConversation,
    markMessagesAsRead,
    isTyping,
  } = useMessagesContext();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Debounce the API call to prevent rapid successive requests
    const timeoutId = setTimeout(() => {
      fetchConversations();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  // Handle auto-selecting conversation when user parameter is provided
  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId && conversations.length > 0) {
      const targetConversation = conversations.find(
        (conv) => conv.user.id === userId
      );
      if (targetConversation && !selectedConversation) {
        setSelectedConversation(targetConversation);
        fetchMessages(targetConversation.user.id);
      }
    }
  }, [conversations, searchParams, selectedConversation]);

  // Cleanup socket connections on unmount
  useEffect(() => {
    return () => {
      if (selectedConversation && currentUser) {
        // Create consistent conversation ID (sorted to ensure both users use same ID)
        const userIds = [currentUser._id, selectedConversation.user.id].sort();
        const conversationId = `${userIds[0]}_${userIds[1]}`;
        leaveConversation(conversationId);
      }
    };
  }, [selectedConversation, currentUser, leaveConversation]);

  const fetchConversations = useCallback(async () => {
    try {
      // setLoading(true);
      // Add a small delay to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 100));
      const response = await messageAPI.getConversations({
        page: 1,
        limit: 20,
      });

      if (response.success) {
        const conversationsData = (response.data as Conversation[]) || [];
        setConversations(conversationsData);
      } else {
        console.error("❌ API Error:", response.message);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMessages = useCallback(
    async (recipientId: string) => {
      try {
        const response = await messageAPI.getMessages(recipientId, {
          limit: 50,
        });
        if (response.success) {
          const messagesData =
            (response.data as { messages: Message[] }).messages || [];
          setMessages(messagesData);

          // Refresh unread count after loading messages
          await refreshUnreadCount();
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    },
    [toast, refreshUnreadCount]
  );

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const response = await messageAPI.sendMessage({
        recipientId: selectedConversation.user.id,
        content: newMessage.trim(),
        replyTo: replyingToMessage?.id,
      });

      if (response.success) {
        setNewMessage("");
        setReplyingToMessage(null); // Clear reply after sending

        // Refresh messages
        await fetchMessages(selectedConversation.user.id);
        // Refresh conversations to update last message
        await fetchConversations();

        // Refresh unread count after sending message
        await refreshUnreadCount();

        // Refocus the input after sending
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  };

  const handleSendMessage = () => {
    sendMessage();
  };

  // Edit message function
  const handleEditMessage = async (messageId: string) => {
    try {
      const response = await messageAPI.editMessage(messageId, editingContent);
      if (response.success) {
        // Update the message in the messages array
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: editingContent,
                  isEdited: true,
                  editedAt: new Date().toISOString(),
                }
              : msg
          )
        );
        setEditingMessageId(null);
        setEditingContent("");
        toast({
          title: "Success",
          description: "Message updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error editing message:", error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  // Delete message function
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await messageAPI.deleteMessage(messageId);
      if (response.success) {
        // Remove the message from the messages array
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== messageId)
        );
        toast({
          title: "Success",
          description: "Message deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  // Start editing a message
  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  // Start replying to a message
  const startReply = (message: Message) => {
    setReplyingToMessage(message);
    setNewMessage("");
    // Focus the input after starting reply
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingToMessage(null);
    // Focus the input after canceling reply
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  const selectConversation = (conversation: Conversation) => {
    // Leave previous conversation room if exists
    if (selectedConversation) {
      const prevConversationId = `${currentUser?._id}_${selectedConversation.user.id}`;
      leaveConversation(prevConversationId);
    }

    setSelectedConversation(conversation);
    fetchMessages(conversation.user.id);

    // Join new conversation room for real-time updates
    // Create consistent conversation ID (sorted to ensure both users use same ID)
    const userIds = [currentUser?._id, conversation.user.id].sort();
    const conversationId = `${userIds[0]}_${userIds[1]}`;
    joinConversation(conversationId);

    // Mark messages as read
    markMessagesAsRead(conversationId, conversation.user.id);

    // Focus the input after selecting a conversation
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 200);
  };

  const getImageUrl = (profilePicture?: string, name?: string) => {
    if (profilePicture) {
      if (profilePicture.startsWith("http")) {
        return profilePicture;
      }
      return profilePicture;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&background=random`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Prevent conversation selection
    navigate(`/alumni/${userId}`);
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Loading messages...
          </h3>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col min-h-0">
        <div className="flex flex-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden min-h-0">
          {/* Conversations List */}
          <div className="w-full lg:w-1/3 xl:w-1/4 border-r border-gray-200 flex flex-col bg-gray-50/50">
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">
                Messages
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-500">
                  <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">
                    No conversations yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Connect with other users to start messaging
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.user.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                      selectedConversation?.user.id === conversation.user.id
                        ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm"
                        : "hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Avatar
                        className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
                        onClick={(e) =>
                          handleProfileClick(e, conversation.user.id)
                        }
                      >
                        <AvatarImage
                          src={getImageUrl(
                            conversation.user.profilePicture,
                            `${conversation.user.firstName} ${conversation.user.lastName}`
                          )}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                          {conversation.user.firstName[0]}
                          {conversation.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className="font-semibold text-sm sm:text-base text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={(e) =>
                              handleProfileClick(e, conversation.user.id)
                            }
                          >
                            {conversation.user.firstName}{" "}
                            {conversation.user.lastName}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="ml-2 flex-shrink-0 text-xs px-2 py-0"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessage ? (
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="text-xs sm:text-sm text-gray-600 truncate flex-1">
                              {conversation.lastMessage.content}
                            </p>
                            {conversation.lastMessage.createdAt && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-400 italic mt-1">
                            No messages yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex-col hidden lg:flex bg-white">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:bg-white/80 p-2 rounded-lg transition-all duration-200 group"
                      onClick={(e) =>
                        handleProfileClick(e, selectedConversation.user.id)
                      }
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all">
                        <AvatarImage
                          src={getImageUrl(
                            selectedConversation.user.profilePicture,
                            `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`
                          )}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                          {selectedConversation.user.firstName[0]}
                          {selectedConversation.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {selectedConversation.user.firstName}{" "}
                          {selectedConversation.user.lastName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {selectedConversation.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white custom-scrollbar"
                  ref={messagesEndRef}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-700 mb-1">
                        No messages yet
                      </p>
                      <p className="text-sm text-gray-500">
                        Start the conversation with{" "}
                        {selectedConversation.user.firstName}{" "}
                        {selectedConversation.user.lastName}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage =
                        message.sender.id === currentUser?._id;
                      const isEditing = editingMessageId === message.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="group relative">
                            {/* Reply indicator */}
                            {message.replyTo && (
                              <div
                                className={`mb-2 p-2 rounded-lg border-l-4 ${
                                  isOwnMessage
                                    ? "bg-blue-50 border-blue-300"
                                    : "bg-gray-50 border-gray-300"
                                }`}
                              >
                                <p className="text-xs text-gray-600 mb-1">
                                  Replying to {message.replyTo.sender.firstName}{" "}
                                  {message.replyTo.sender.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {message.replyTo.content}
                                </p>
                              </div>
                            )}

                            <div
                              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl shadow-sm ${
                                isOwnMessage
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                              }`}
                            >
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) =>
                                      setEditingContent(e.target.value)
                                    }
                                    className="w-full p-2 rounded border text-gray-900 text-sm resize-none"
                                    rows={2}
                                    maxLength={1000}
                                  />
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleEditMessage(message.id)
                                      }
                                      disabled={!editingContent.trim()}
                                      className="text-xs"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditing}
                                      className="text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm">{message.content}</p>
                                  {message.isEdited && (
                                    <p className="text-xs opacity-70 italic">
                                      (edited)
                                    </p>
                                  )}
                                  <div className="flex items-center justify-end mt-1 space-x-1">
                                    <span className="text-xs opacity-70">
                                      {formatTime(message.createdAt)}
                                    </span>
                                    {isOwnMessage && (
                                      <div className="text-xs opacity-70">
                                        {message.isRead ? (
                                          <CheckCheck className="h-3 w-3" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Action buttons - only show on hover for own messages */}
                            {isOwnMessage && !isEditing && (
                              <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex space-x-1 bg-white rounded-lg shadow-lg p-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(message)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteMessage(message.id)
                                    }
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Reply button - show for all messages */}
                            {!isEditing && (
                              <div className="absolute -left-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startReply(message)}
                                  className="h-6 w-6 p-0 bg-white rounded-lg shadow-lg"
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  {/* Reply context */}
                  {replyingToMessage && (
                    <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-900">
                            Replying to {replyingToMessage.sender.firstName}{" "}
                            {replyingToMessage.sender.lastName}
                          </p>
                          <p className="text-xs text-blue-700 truncate mt-1">
                            {replyingToMessage.content}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelReply}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Input
                      ref={messageInputRef}
                      placeholder={
                        replyingToMessage
                          ? "Type your reply..."
                          : "Type a message..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      className="flex-1 h-11 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      type="button"
                      className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-white">
                <div className="text-center p-8">
                  <div className="bg-white rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-700">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Chat View */}
        {selectedConversation && (
          <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobile Chat Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex items-center shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="mr-2 sm:mr-3 h-9 w-9 p-0"
              >
                ←
              </Button>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-blue-200 flex-shrink-0">
                  <AvatarImage
                    src={getImageUrl(
                      selectedConversation.user.profilePicture,
                      `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`
                    )}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold text-xs">
                    {selectedConversation.user.firstName[0]}
                    {selectedConversation.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                    {selectedConversation.user.firstName}{" "}
                    {selectedConversation.user.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedConversation.user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50/50 to-white custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">
                    No messages yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Start the conversation
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender.id === currentUser?._id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] sm:max-w-xs px-4 py-2.5 rounded-2xl shadow-sm ${
                        message.sender.id === currentUser?._id
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-1.5 ${
                          message.sender.id === currentUser?._id
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Message Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
              {replyingToMessage && (
                <div className="mb-3 p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-900">
                        Replying to {replyingToMessage.sender.firstName}
                      </p>
                      <p className="text-xs text-blue-700 truncate mt-0.5">
                        {replyingToMessage.content}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelReply}
                      className="text-blue-600 hover:text-blue-800 h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex space-x-2">
                <Input
                  ref={messageInputRef}
                  placeholder={
                    replyingToMessage
                      ? "Type your reply..."
                      : "Type a message..."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 h-11 text-sm border-gray-300 focus:border-blue-500"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                  type="button"
                  className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
