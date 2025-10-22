import { io } from "socket.io-client";

// Test Socket.IO connection
const testSocketConnection = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found, skipping socket test");
    return;
  }

  const socket = io("http://localhost:3000", {
    auth: {
      token: token,
    },
  });

  socket.on("connect", () => {
    console.log("✅ Socket.IO connected successfully:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket.IO disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket.IO connection error:", error);
  });

  // Test message events
  socket.on("new_message", (message) => {
    console.log("📨 New message received:", message);
  });

  socket.on("messages_read", (data) => {
    console.log("✅ Messages marked as read:", data);
  });

  // Test notification events
  socket.on("new_notification", (notification) => {
    console.log("🔔 New notification received:", notification);
  });

  socket.on("notification_update", (data) => {
    console.log("🔔 Notification update:", data);
  });

  socket.on("unread_count_update", (data) => {
    console.log("📊 Unread count update:", data);
  });

  socket.on("notification_count_update", (data) => {
    console.log("📊 Notification count update:", data);
  });

  // Test typing indicators
  socket.on("user_typing", (data) => {
    console.log("⌨️ User typing:", data);
  });

  return socket;
};

// Export for use in browser console
(window as any).testSocketConnection = testSocketConnection;

export default testSocketConnection;
