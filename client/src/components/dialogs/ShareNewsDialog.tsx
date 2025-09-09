import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Copy,
  Check,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
} from "lucide-react";

interface News {
  _id: string;
  title: string;
  summary: string;
  image?: string;
  isShared: boolean;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ShareNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: News | null;
}

export const ShareNewsDialog = ({
  open,
  onOpenChange,
  news,
}: ShareNewsDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!news) return null;

  // Generate share URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/news/${news._id}`;

  // Generate share text
  const shareText = `${news.title}\n\n${news.summary.substring(0, 200)}${
    news.summary.length > 200 ? "..." : ""
  }\n\nRead more: ${shareUrl}`;

  // Copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "News link has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy share text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({
        title: "Text Copied",
        description: "Share text has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Social media sharing
  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(news.title);
    const encodedText = encodeURIComponent(news.summary.substring(0, 200));

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "mail":
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0ARead more: ${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Share News Article
          </DialogTitle>
          <DialogDescription>
            Share "{news.title}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* News Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{news.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3">
              {news.summary.substring(0, 150)}...
            </p>
            <p className="text-xs text-gray-500 mt-2">
              By {news.author.firstName} {news.author.lastName}
            </p>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="shareUrl">Share Link</Label>
            <div className="flex space-x-2">
              <Input
                id="shareUrl"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Text */}
          <div className="space-y-2">
            <Label htmlFor="shareText">Share Text</Label>
            <div className="space-y-2">
              <Textarea
                id="shareText"
                value={shareText}
                readOnly
                className="min-h-[100px] text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Share Text
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSocialShare("twitter")}
                className="flex items-center justify-center"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare("facebook")}
                className="flex items-center justify-center"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare("linkedin")}
                className="flex items-center justify-center"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare("mail")}
                className="flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareNewsDialog;
