import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Trash2,
  Check,
  CheckCheck,
  Edit,
  Reply,
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
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMessageTab, setActiveMessageTab] = useState("inbox");
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

  // Handle URL-based tab switching
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/messages/inbox")) {
      setActiveMessageTab("inbox");
    } else if (path.includes("/messages/sent")) {
      setActiveMessageTab("sent");
    } else if (path.includes("/messages/drafts")) {
      setActiveMessageTab("drafts");
    } else {
      setActiveMessageTab("inbox");
    }
  }, [location.pathname]);

  // Cleanup socket connections on unmount
  useEffect(() => {
    return () => {
      if (selectedConversation && currentUser) {
        const conversationId = `${currentUser.id}_${selectedConversation.user.id}`;
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

        // Add message to socket messages for real-time update
        const newMessageData = response.data;
        setSocketMessages((prev) => [...prev, newMessageData]);

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
      const prevConversationId = `${currentUser?.id}_${selectedConversation.user.id}`;
      leaveConversation(prevConversationId);
    }

    setSelectedConversation(conversation);
    fetchMessages(conversation.user.id);

    // Join new conversation room for real-time updates
    const conversationId = `${currentUser?.id}_${conversation.user.id}`;
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
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Loading messages...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
        <div className="flex flex-1 bg-white rounded-lg shadow-lg overflow-hidden min-h-0">
          {/* Conversations List */}
          <div className="w-full lg:w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Messages</h2>

              {/* Message Tabs */}
              <Tabs
                value={activeMessageTab}
                onValueChange={(value) => {
                  setActiveMessageTab(value);
                  navigate(`/messages/${value}`);
                }}
                className="mb-4"
              ></Tabs>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No connected users yet</p>
                  <p className="text-sm mt-1">
                    Connect with other users to start messaging
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.user.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.user.id === conversation.user.id
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
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
                        <AvatarFallback>
                          {conversation.user.firstName[0]}
                          {conversation.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={(e) =>
                              handleProfileClick(e, conversation.user.id)
                            }
                          >
                            {conversation.user.firstName}{" "}
                            {conversation.user.lastName}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessage ? (
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            No messages yet - click to start conversation
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
          <div className="flex-1 flex-col hidden lg:flex">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      onClick={(e) =>
                        handleProfileClick(e, selectedConversation.user.id)
                      }
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getImageUrl(
                            selectedConversation.user.profilePicture,
                            `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`
                          )}
                        />
                        <AvatarFallback>
                          {selectedConversation.user.firstName[0]}
                          {selectedConversation.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium hover:text-blue-600 transition-colors">
                          {selectedConversation.user.firstName}{" "}
                          {selectedConversation.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.user.email}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  ref={messagesEndRef}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No messages yet. Start the conversation!</p>
                      <p className="text-sm mt-2">
                        You can now message{" "}
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
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 text-gray-900"
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
                <div className="p-4 border-t border-gray-200">
                  {/* Reply context */}
                  {replyingToMessage && (
                    <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Replying to {replyingToMessage.sender.firstName}{" "}
                            {replyingToMessage.sender.lastName}
                          </p>
                          <p className="text-xs text-blue-600 truncate">
                            {replyingToMessage.content}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelReply}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 className="h-4 w-4" />
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
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      type="button"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a conversation
                  </h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Chat View */}
        {selectedConversation && (
          <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobile Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="mr-3"
              >
                ← Back
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getImageUrl(
                      selectedConversation.user.profilePicture,
                      `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`
                    )}
                  />
                  <AvatarFallback>
                    {selectedConversation.user.firstName[0]}
                    {selectedConversation.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedConversation.user.firstName}{" "}
                    {selectedConversation.user.lastName}
                  </h3>
                </div>
              </div>
            </div>

            {/* Mobile Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender.id === currentUser?._id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender.id === currentUser?._id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender.id === currentUser?._id
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                  type="button"
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
