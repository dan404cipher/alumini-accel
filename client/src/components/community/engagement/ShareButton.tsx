import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Send,
  Copy,
  Check,
  ExternalLink,
  X,
} from "lucide-react";
import { useShares } from "@/hooks/useShares";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  postId: string;
  postTitle: string;
  initialShareCount: number;
  size?: "sm" | "default" | "lg";
  showCount?: boolean;
  className?: string;
  onShare?: (platform: string) => void;
}

const SharePlatformButton: React.FC<{
  platform: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}> = ({ platform, icon, label, onClick, loading }) => {
  const getPlatformStyles = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
      case "twitter":
        return "border-gray-200 hover:border-sky-300 hover:bg-sky-50";
      case "linkedin":
        return "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
      case "whatsapp":
        return "border-green-200 hover:border-green-400 hover:bg-green-50";
      case "telegram":
        return "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
      default:
        return "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200",
        "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        getPlatformStyles(platform)
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-gray-900 text-sm">{label}</div>
        <div className="text-xs text-gray-500 capitalize">{platform}</div>
      </div>
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  );
};

export const ShareButton: React.FC<ShareButtonProps> = ({
  postId,
  postTitle,
  initialShareCount,
  size = "sm",
  showCount = true,
  className,
  onShare,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrls, setShareUrls] = useState<any>(null);

  const { shareCount, loading, shareToPlatform, copyToClipboard } = useShares({
    postId,
    initialShareCount,
  });

  const handleShare = async (platform: string) => {
    try {
      const success = await shareToPlatform(platform);
      if (success) {
        onShare?.(platform);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      const success = await copyToClipboard();
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleOpenDialog = async () => {
    setIsOpen(true);
    // Load share URLs when dialog opens
    if (!shareUrls) {
      try {
        const { engagementAPI } = await import("@/services/engagementAPI");
        const response = await engagementAPI.getShareUrls(postId);
        setShareUrls(response.data);
      } catch (error) {
        console.error("Failed to load share URLs:", error);
      }
    }
  };

  const platforms = [
    {
      id: "facebook",
      icon: (
        <div className="w-5 h-5 flex items-center justify-center text-blue-600 font-bold text-sm">
          f
        </div>
      ),
      label: "Facebook",
    },
    {
      id: "twitter",
      icon: (
        <div className="w-5 h-5 flex items-center justify-center text-sky-500">
          🐦
        </div>
      ),
      label: "Twitter",
    },
    {
      id: "linkedin",
      icon: (
        <div className="w-5 h-5 flex items-center justify-center text-blue-700 font-bold text-xs">
          in
        </div>
      ),
      label: "LinkedIn",
    },
    {
      id: "whatsapp",
      icon: (
        <div className="w-5 h-5 flex items-center justify-center text-green-500">
          💬
        </div>
      ),
      label: "WhatsApp",
    },
    {
      id: "telegram",
      icon: (
        <div className="w-5 h-5 flex items-center justify-center text-blue-500">
          ✈️
        </div>
      ),
      label: "Telegram",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          onClick={handleOpenDialog}
          className={cn(
            "flex items-center gap-1 transition-all duration-200",
            "text-gray-500 hover:text-blue-500",
            className
          )}
        >
          <Share2
            className={cn(
              "transition-all duration-200",
              size === "sm" && "w-4 h-4",
              size === "default" && "w-5 h-5",
              size === "lg" && "w-6 h-6",
              loading && "animate-pulse"
            )}
          />
          {showCount && shareCount > 0 && (
            <span className="text-xs font-medium">
              {shareCount > 1000
                ? `${(shareCount / 1000).toFixed(1)}k`
                : shareCount}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Share Post
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Post Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {postTitle}
              </h3>
              <p className="text-xs text-gray-500">Community Post</p>
            </div>

            {/* Share Platforms */}
            <div className="space-y-2">
              {platforms.map((platform) => (
                <SharePlatformButton
                  key={platform.id}
                  platform={platform.id}
                  icon={platform.icon}
                  label={platform.label}
                  onClick={() => handleShare(platform.id)}
                  loading={loading}
                />
              ))}
            </div>

            {/* Copy Link */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">
                Or copy link
              </div>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrls?.postUrl || ""}
                  readOnly
                  className="flex-1 bg-gray-50 border-gray-200 text-sm"
                  placeholder={shareUrls ? "Link ready to copy" : "Generating link..."}
                />
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant="outline"
                  disabled={!shareUrls?.postUrl}
                  className={cn(
                    "px-3 py-2 h-auto border-gray-200 hover:bg-gray-50 transition-all",
                    copied && "bg-green-50 border-green-200 text-green-700",
                    !shareUrls?.postUrl && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 font-medium">
                  Link copied to clipboard!
                </p>
              )}
              {!shareUrls && (
                <p className="text-xs text-gray-500">
                  Loading share link...
                </p>
              )}
            </div>

            {/* Share Count */}
            {shareCount > 0 && (
              <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
                {shareCount} {shareCount === 1 ? "share" : "shares"}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
