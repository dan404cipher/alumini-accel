import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import socketService from "@/services/socketService";

const SocketDebugPage: React.FC = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] =
    useState<string>("disconnected");
  const [socketId, setSocketId] = useState<string>("");
  const [events, setEvents] = useState<
    Array<{ type: string; data: any; timestamp: string }>
  >([]);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      const status = socketService.getConnectionState();
      setConnectionStatus(status);
      setSocketId(socketService.getSocketId() || "");
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    // Listen for test events
    const addEvent = (type: string, data: any) => {
      setEvents((prev) => [
        ...prev.slice(-9),
        {
          type,
          data,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    };

    // Set up all event listeners
    socketService.on("new_message", (data) => addEvent("📨 New Message", data));
    socketService.on("messages_read", (data) =>
      addEvent("✅ Messages Read", data)
    );
    socketService.on("user_typing", (data) => addEvent("⌨️ User Typing", data));
    socketService.on("new_notification", (data) =>
      addEvent("🔔 New Notification", data)
    );
    socketService.on("notification_update", (data) =>
      addEvent("🔔 Notification Update", data)
    );
    socketService.on("unread_count_update", (data) =>
      addEvent("📊 Unread Count", data)
    );
    socketService.on("notification_count_update", (data) =>
      addEvent("📊 Notification Count", data)
    );

    // Debug info
    setDebugInfo({
      user: user
        ? {
            id: user._id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
          }
        : null,
      serverUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
      hasToken:
        !!localStorage.getItem("token") || !!sessionStorage.getItem("token"),
    });

    return () => {
      clearInterval(interval);
      socketService.off("new_message");
      socketService.off("messages_read");
      socketService.off("user_typing");
      socketService.off("new_notification");
      socketService.off("notification_update");
      socketService.off("unread_count_update");
      socketService.off("notification_count_update");
    };
  }, [user]);

  const testConnection = () => {
    console.log("🔍 Testing Socket.IO connection...");
    console.log("Debug info:", debugInfo);

    // Force reconnection
    socketService.disconnectSocket();
    setTimeout(() => {
      socketService.connectSocket();
    }, 1000);
  };

  const testRoomJoin = () => {
    const conversationId = `test_${user?._id}_${Date.now()}`;
    socketService.joinConversation(conversationId);
    setEvents((prev) => [
      ...prev,
      {
        type: "🏠 Joined Room",
        data: { conversationId },
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const testTyping = () => {
    const conversationId = `test_${user?._id}_${Date.now()}`;
    socketService.startTyping(conversationId, user?._id || "");
    setTimeout(() => {
      socketService.stopTyping(conversationId, user?._id || "");
    }, 2000);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔌 Socket.IO Debug & Test
            <Badge
              variant={
                connectionStatus === "connected" ? "default" : "destructive"
              }
            >
              {connectionStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">🔍 Debug Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Connection Status:</strong> {connectionStatus}
                </p>
                <p>
                  <strong>Socket ID:</strong> {socketId || "Not connected"}
                </p>
                <p>
                  <strong>Server URL:</strong> {debugInfo.serverUrl}
                </p>
              </div>
              <div>
                <p>
                  <strong>User ID:</strong>{" "}
                  {debugInfo.user?.id || "Not logged in"}
                </p>
                <p>
                  <strong>User Email:</strong>{" "}
                  {debugInfo.user?.email || "Not logged in"}
                </p>
                <p>
                  <strong>Has Token:</strong>{" "}
                  {debugInfo.hasToken ? "✅ Yes" : "❌ No"}
                </p>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testConnection} variant="outline">
              🔄 Test Connection
            </Button>
            <Button onClick={testRoomJoin} variant="outline">
              🏠 Test Join Room
            </Button>
            <Button onClick={testTyping} variant="outline">
              ⌨️ Test Typing
            </Button>
            <Button onClick={clearEvents} variant="outline">
              🗑️ Clear Events
            </Button>
          </div>

          {/* Real-time Events */}
          <div>
            <h3 className="font-semibold mb-2">
              Real-time Events ({events.length})
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No events yet. Try the test buttons above or send a
                  message/notification.
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-blue-500 pl-2"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{event.type}</span>
                        <span className="text-gray-500">{event.timestamp}</span>
                      </div>
                      <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              🛠️ Troubleshooting
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Make sure you're logged in (check Has Token above)</li>
              <li>Check browser console for any error messages</li>
              <li>Verify backend server is running on port 3000</li>
              <li>Check if firewall is blocking WebSocket connections</li>
              <li>Try refreshing the page if connection fails</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocketDebugPage;
