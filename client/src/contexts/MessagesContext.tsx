import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import socketService from "@/services/socketService";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  recipient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  content: string;
  messageType: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  replyTo?: any;
}

interface MessagesContextType {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageReadStatus: (messageId: string, isRead: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  markMessagesAsRead: (conversationId: string, userId: string) => void;
  startTyping: (conversationId: string, userId: string) => void;
  stopTyping: (conversationId: string, userId: string) => void;
  isTyping: { [userId: string]: boolean };
}

const MessagesContext = createContext<MessagesContextType | undefined>(
  undefined
);

interface MessagesProviderProps {
  children: ReactNode;
}

export const MessagesProvider: React.FC<MessagesProviderProps> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const { user } = useAuth();

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateMessageReadStatus = (messageId: string, isRead: boolean) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === messageId ? { ...msg, isRead } : msg))
    );
  };

  const joinConversation = (conversationId: string) => {
    socketService.joinConversation(conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socketService.leaveConversation(conversationId);
  };

  const markMessagesAsRead = (conversationId: string, userId: string) => {
    socketService.markMessagesAsRead(conversationId, userId);
  };

  const startTyping = (conversationId: string, userId: string) => {
    socketService.startTyping(conversationId, userId);
  };

  const stopTyping = (conversationId: string, userId: string) => {
    socketService.stopTyping(conversationId, userId);
  };

  // Set up socket event listeners for real-time message updates
  useEffect(() => {
    if (!user) return;

    // Wait for socket to be connected before setting up listeners
    const setupSocketListeners = (retries: number = 0, maxRetries: number = 10) => {
      if (socketService.isSocketConnected()) {
        // Listen for new messages
        socketService.on("new_message", (message: Message) => {
          addMessage(message);
        });

        // Listen for message read status updates
        socketService.on(
          "messages_read",
          (data: {
            conversationId: string;
            readBy: string;
            timestamp: Date;
          }) => {
            // Update read status for messages in this conversation
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.sender._id === data.readBy) {
                  return {
                    ...msg,
                    isRead: true,
                    readAt: data.timestamp.toISOString(),
                  };
                }
                return msg;
              })
            );
          }
        );

        // Listen for typing indicators
        socketService.on(
          "user_typing",
          (data: {
            userId: string;
            isTyping: boolean;
            conversationId: string;
          }) => {
            setIsTyping((prev) => ({
              ...prev,
              [data.userId]: data.isTyping,
            }));

            // Clear typing indicator after 3 seconds
            if (data.isTyping) {
              setTimeout(() => {
                setIsTyping((prev) => ({
                  ...prev,
                  [data.userId]: false,
                }));
              }, 3000);
            }
          }
        );
      } else if (retries < maxRetries) {
        setTimeout(() => setupSocketListeners(retries + 1, maxRetries), 1000);
      } else {
        console.error('MessagesContext: Failed to connect socket after max retries');
      }
    };

    // Start setting up listeners
    setupSocketListeners();

    // Cleanup listeners on unmount
    return () => {
      socketService.off("new_message");
      socketService.off("messages_read");
      socketService.off("user_typing");
    };
  }, [user]);

  const value: MessagesContextType = {
    messages,
    setMessages,
    addMessage,
    updateMessageReadStatus,
    joinConversation,
    leaveConversation,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    isTyping,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessagesContext = (): MessagesContextType => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error(
      "useMessagesContext must be used within a MessagesProvider"
    );
  }
  return context;
};
