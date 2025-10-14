import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Clock,
  Check,
  X,
  Shield,
  MessageSquare,
} from "lucide-react";
import { connectionAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectionButtonProps {
  userId: string;
  userName: string;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

interface ConnectionStatus {
  exists: boolean;
  connection: {
    _id: string;
    status: string;
    type: string;
    requester: string;
    recipient: string;
  } | null;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const ConnectionButton = ({
  userId,
  userName,
  className = "",
  variant = "default",
  size = "default",
}: ConnectionButtonProps) => {
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestType, setRequestType] = useState("connection");
  const { user } = useAuth();
  const { toast } = useToast();

  const checkConnectionStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await connectionAPI.checkConnectionStatus(userId);

      if (response.success && response.data) {
        const data = response.data as ConnectionStatus;
        if (data.connection) {
          setConnectionStatus(data.connection.status);
          setConnectionId(data.connection._id);
        } else {
          // Only set to null if we don't already have a pending status
          if (connectionStatus !== "pending") {
            setConnectionStatus(null);
            setConnectionId(null);
          }
        }
      } else {
        // Only set to null if we don't already have a pending status
        if (connectionStatus !== "pending") {
          setConnectionStatus(null);
          setConnectionId(null);
        }
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      // Only set to null if we don't already have a pending status
      if (connectionStatus !== "pending") {
        setConnectionStatus(null);
        setConnectionId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, connectionStatus]);

  useEffect(() => {
    if (user?._id && userId) {
      checkConnectionStatus();
    }
  }, [userId, user?._id, checkConnectionStatus]);

  // Don't show button for own profile
  if (user?._id === userId || user?._id?.toString() === userId?.toString()) {
    return null;
  }

  // Don't show button if user is not authenticated
  if (!user || !user._id) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={true}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Login to Connect
      </Button>
    );
  }

  const handleSendRequest = async () => {
    // Prevent double-clicks
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await connectionAPI.sendConnectionRequest({
        recipientId: userId,
        type: requestType,
        message: requestMessage.trim(),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Connection request sent to ${userName}`,
        });
        setShowRequestDialog(false);
        setRequestMessage("");
        // Set status directly to avoid race conditions with checkConnectionStatus
        setConnectionStatus("pending");
        setConnectionId((response.data as { _id: string })._id);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send connection request",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Send connection request error:", error);
      toast({
        title: "Error",
        description:
          (error as ApiError)?.response?.data?.message ||
          "Failed to send connection request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connectionId) return;

    setLoading(true);
    try {
      const response = await connectionAPI.acceptConnection(connectionId);
      if (response.success) {
        toast({
          title: "Success",
          description: `You are now connected with ${userName}`,
        });
        setConnectionStatus("accepted");
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error as ApiError)?.response?.data?.message ||
          "Failed to accept connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!connectionId) return;

    setLoading(true);
    try {
      const response = await connectionAPI.rejectConnection(connectionId);
      if (response.success) {
        toast({
          title: "Success",
          description: `Connection request from ${userName} rejected`,
        });
        setConnectionStatus("rejected");
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error as ApiError)?.response?.data?.message ||
          "Failed to reject connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConnection = async () => {
    if (!connectionId) {
      return;
    }

    setLoading(true);
    try {
      const response = await connectionAPI.cancelConnection(connectionId);
      if (response.success) {
        toast({
          title: "Success",
          description: `Connection request to ${userName} cancelled`,
        });
        setConnectionStatus(null);
        setConnectionId(null);
      }
    } catch (error: unknown) {
      console.error("Error cancelling connection:", error);
      toast({
        title: "Error",
        description:
          (error as ApiError)?.response?.data?.message ||
          "Failed to cancel connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!connectionId) return;

    setLoading(true);
    try {
      const response = await connectionAPI.removeConnection(connectionId);
      if (response.success) {
        toast({
          title: "Success",
          description: `Connection with ${userName} removed`,
        });
        setConnectionStatus(null);
        setConnectionId(null);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error as ApiError)?.response?.data?.message ||
          "Failed to remove connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!connectionId) return;

    setLoading(true);
    try {
      const response = await connectionAPI.blockUser(connectionId);
      if (response.success) {
        toast({
          title: "Success",
          description: `${userName} has been blocked`,
        });
        setConnectionStatus("blocked");
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error as ApiError)?.response?.data?.message ||
          "Failed to block user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    if (!connectionStatus) {
      return (
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              disabled={loading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Connect
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Connection Request</DialogTitle>
              <DialogDescription>
                Send a connection request to {userName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Connection Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connection">
                      General Connection
                    </SelectItem>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {requestMessage.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSendRequest} disabled={loading}>
                {loading ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    // Handle different connection statuses
    if (connectionStatus === "pending") {
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelConnection}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      );
    }

    if (connectionStatus === "accepted") {
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="flex items-center">
            <UserCheck className="w-3 h-3 mr-1" />
            Connected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveConnection}
            disabled={loading}
          >
            <UserMinus className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>
      );
    }

    if (connectionStatus === "rejected") {
      return (
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              disabled={loading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Connect Again
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Connection Request</DialogTitle>
              <DialogDescription>
                Send a connection request to {userName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Connection Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connection">
                      General Connection
                    </SelectItem>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {requestMessage.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSendRequest} disabled={loading}>
                {loading ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (connectionStatus === "blocked") {
      return (
        <Badge variant="destructive" className="flex items-center">
          <Shield className="w-3 h-3 mr-1" />
          Blocked
        </Badge>
      );
    }

    // Default case - show connect button with dialog
    return (
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            disabled={loading}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Connection Request</DialogTitle>
            <DialogDescription>
              Send a connection request to {userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Connection Type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connection">General Connection</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                  <SelectItem value="collaboration">Collaboration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {requestMessage.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSendRequest} disabled={loading}>
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return renderButton();
};

export default ConnectionButton;
