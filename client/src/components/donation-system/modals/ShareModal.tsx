import React, { useState } from "react";
import {
  X,
  Copy,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Share2,
  Link,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  campaign: {
    title: string;
    description: string;
    imageUrl?: string;
    _id?: string;
  };
}

const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, campaign }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareUrl = `${window.location.origin}/donations?viewCampaign=${
    campaign._id || encodeURIComponent(campaign.title)
  }`;
  const shareText = `Check out this campaign: ${campaign.title}`;
  const shareDescription = campaign.description || "Help make a difference!";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Campaign link has been copied to your clipboard.",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const shareToSocial = (platform: string) => {
    let url = "";

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(
          shareText
        )}&body=${encodeURIComponent(`${shareDescription}\n\n${shareUrl}`)}`;
        break;
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  const shareViaNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: campaign.title,
          text: shareDescription,
          url: shareUrl,
        });
      } else {
        copyToClipboard();
      }
    } catch (error) {
      console.error("Native share failed:", error);
      copyToClipboard();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Share Campaign
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Campaign Preview */}
        <div className="p-6 border-b">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {campaign.imageUrl ? (
                <img
                  src={
                    campaign.imageUrl.startsWith("/uploads/")
                      ? `http://localhost:3000${campaign.imageUrl}`
                      : campaign.imageUrl
                  }
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {campaign.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {shareDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Native Share */}
            <button
              onClick={shareViaNative}
              className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Share</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={copyToClipboard}
              className={`flex items-center justify-center gap-3 p-4 border rounded-lg transition-colors ${
                copied
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Copy
                className={`w-5 h-5 ${
                  copied ? "text-green-600" : "text-gray-600"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  copied ? "text-green-700" : "text-gray-700"
                }`}
              >
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </button>

            {/* Email */}
            <button
              onClick={() => shareToSocial("email")}
              className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Email</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => shareToSocial("facebook")}
              className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Facebook
              </span>
            </button>

            {/* Twitter */}
            <button
              onClick={() => shareToSocial("twitter")}
              className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-gray-700">Twitter</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => shareToSocial("linkedin")}
              className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Linkedin className="w-5 h-5 text-blue-700" />
              <span className="text-sm font-medium text-gray-700">
                LinkedIn
              </span>
            </button>
          </div>

          {/* Link Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Share Link
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-xs text-gray-600 bg-white border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Help spread the word and make a difference!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
