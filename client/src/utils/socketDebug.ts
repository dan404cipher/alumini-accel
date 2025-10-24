// Socket.IO Debug Utility
import { io } from "socket.io-client";
import { getAuthTokenOrNull } from "./auth";

export const debugSocketConnection = () => {
  console.log("🔍 Starting Socket.IO debug...");

  const token = getAuthTokenOrNull();
  console.log("🔑 Token found:", !!token);

  if (!token) {
    console.error("❌ No authentication token found!");
    console.log("💡 Make sure you're logged in first");
    return;
  }

  const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  console.log("🌐 Server URL:", serverUrl);

  const socket = io(serverUrl, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["polling"],
    forceNew: true,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket.IO connected successfully!");
    console.log("🆔 Socket ID:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket.IO disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket.IO connection error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("🔄 Socket.IO reconnected after", attemptNumber, "attempts");
  });

  // Test events
  socket.on("new_message", (message) => {
    console.log("📨 New message received:", message);
  });

  socket.on("new_notification", (notification) => {
    console.log("🔔 New notification received:", notification);
  });

  // Test room joining
  setTimeout(() => {
    if (socket.connected) {
      console.log("🏠 Testing room join...");
      socket.emit("join_conversation", "test-room");
    }
  }, 2000);

  return socket;
};

// Make it available in browser console
(window as any).debugSocketConnection = debugSocketConnection;
