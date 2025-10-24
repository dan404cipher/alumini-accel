// Simple Socket Test Utility
// Run this in your browser console to test socket functionality

const testSocketConnection = () => {
  console.log("🧪 Starting Socket.IO Test...");

  // Check if socket service is available
  if (typeof window !== "undefined" && window.socketService) {
    console.log("✅ Socket service found");
    console.log(
      "🔍 Connection status:",
      window.socketService.getConnectionState()
    );
    console.log("🆔 Socket ID:", window.socketService.getSocketId());
  } else {
    console.log("❌ Socket service not found on window");
  }

  // Test sending a message via API
  const testMessage = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found");
        return;
      }

      console.log("📤 Testing socket message emission...");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/v1/messages/test-socket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: "68fb2a8b4ca7936db1e01094_test_recipient",
          message: "Test message from browser console",
        }),
      });

      const result = await response.json();
      console.log("📤 Test message result:", result);
    } catch (error) {
      console.error("❌ Error testing message:", error);
    }
  };

  // Test checking socket rooms
  const testRooms = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found");
        return;
      }

      console.log("🏠 Checking socket rooms...");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/v1/messages/test-rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("🏠 Socket rooms:", result);
    } catch (error) {
      console.error("❌ Error checking rooms:", error);
    }
  };

  // Run tests
  testMessage();
  testRooms();
};

// Make it available globally
window.testSocketConnection = testSocketConnection;

console.log(
  "🧪 Socket test utility loaded. Run testSocketConnection() to test."
);
