import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Share2,
  Copy,
  Mail,
  Linkedin,
  Twitter,
  ExternalLink,
  Check,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  maxAttendees?: number;
  currentAttendees?: number;
  price?: number;
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  speakers?: Array<{
    name: string;
    title: string;
    company: string;
  }>;
  tags?: string[];
  image?: string;
}

interface ShareEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

const ShareEventDialog = ({
  isOpen,
  onClose,
  event,
}: ShareEventDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  if (!event) return null;

  const eventUrl = `${window.location.origin}/events/${event._id}`;
  const eventTitle = event.title;
  const eventDate = new Date(event.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventTime = new Date(event.startDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format price
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null || price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  // Generate share text
  const generateShareText = (platform: string) => {
    const baseText = `Check out this event: ${eventTitle}`;
    const details = `\n📅 ${eventDate} at ${eventTime}\n📍 ${
      event.location
    }\n💰 ${formatPrice(event.price)}`;

    switch (platform) {
      case "twitter":
        return `${baseText}${details}\n\n${eventUrl}`;
      case "linkedin":
        return `${baseText}${details}\n\nJoin us for this exciting event! ${eventUrl}`;
      case "email":
        return `Hi,\n\nI thought you might be interested in this event:\n\n${eventTitle}\n${eventDate} at ${eventTime}\n${
          event.location
        }\n${formatPrice(event.price)}\n\n${
          event.description
        }\n\nRegister here: ${eventUrl}\n\nBest regards,\n${
          user?.firstName || "Alumni"
        }`;
      default:
        return `${baseText}${details}\n\n${eventUrl}`;
    }
  };

  // Copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Share via email
  const handleEmailShare = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const subject = `Event Invitation: ${eventTitle}`;
    const body = generateShareText("email");
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.open(mailtoUrl);
    toast({
      title: "Email Opened",
      description: "Email client opened with event details",
    });
  };

  // Share via social media
  const handleSocialShare = (platform: string) => {
    const text = generateShareText(platform);
    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          eventUrl
        )}&summary=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "width=600,height=400");
    toast({
      title: "Shared",
      description: `Event shared on ${platform}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Event
          </DialogTitle>
          <DialogDescription>
            Share this event with your network
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              {event.image && (
                <img
                  src={event.image}
                  alt={eventTitle}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{eventTitle}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Users className="w-3 h-3" />
                  <span>{formatPrice(event.price)}</span>
                </div>
              </div>
            </div>
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {event.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Link</label>
            <div className="flex gap-2">
              <Input value={eventUrl} readOnly className="flex-1" />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="px-3"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Email Share */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share via Email</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleEmailShare}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Social Media Share */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share on Social Media</label>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSocialShare("twitter")}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={() => handleSocialShare("linkedin")}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareEventDialog;
