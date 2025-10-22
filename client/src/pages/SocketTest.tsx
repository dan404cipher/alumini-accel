import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import socketService from "@/services/socketService";

const SocketTestPage: React.FC = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] =
    useState<string>("disconnected");
  const [socketId, setSocketId] = useState<string>("");
  const [events, setEvents] = useState<
    Array<{ type: string; data: any; timestamp: string }>
  >([]);
  const [testMessage, setTestMessage] = useState("");

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
  }, []);

  const testConversationRoom = () => {
    const conversationId = `test_${user?.id}_${Date.now()}`;
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
    const conversationId = `test_${user?.id}_${Date.now()}`;
    socketService.startTyping(conversationId, user?.id || "");
    setTimeout(() => {
      socketService.stopTyping(conversationId, user?.id || "");
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
            🔌 Socket.IO Live Chat Test
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
          {/* Connection Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Connection Status</h3>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span
                  className={
                    connectionStatus === "connected"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {connectionStatus}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Socket ID: {socketId || "Not connected"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">User Info</h3>
              <p className="text-sm text-gray-600">ID: {user?.id}</p>
              <p className="text-sm text-gray-600">
                Name: {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testConversationRoom} variant="outline">
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
                  No events yet. Try sending a message or notification.
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

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              🧪 Testing Instructions
            </h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Open Messages page in another tab/window</li>
              <li>Start a conversation with another user</li>
              <li>Send messages and watch for real-time events</li>
              <li>Check notification dropdown for live updates</li>
              <li>Monitor this page for Socket.IO events</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocketTestPage;
