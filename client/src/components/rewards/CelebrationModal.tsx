import React from "react";
import { X, Crown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CelebrationModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  rewardName?: string;
  rewardType?: "badge" | "voucher" | "points" | "perk";
  voucherCode?: string;
  onShare?: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  open,
  onClose,
  title = "Congratulations!",
  description,
  rewardName,
  rewardType,
  voucherCode,
  onShare,
}) => {
  const getDescription = () => {
    if (description) return description;
    
    if (rewardType === "points") {
      return `You've successfully claimed your reward! Your points have been added to your account.`;
    } else if (rewardType === "voucher") {
      return voucherCode
        ? `Your voucher code is: ${voucherCode}. Please save this code and check your email for redemption details.`
        : `Your voucher has been redeemed. Check your email for the code.`;
    } else if (rewardType === "badge") {
      return `Badge "${rewardName}" has been added to your collection! Show off your achievement.`;
    } else if (rewardType === "perk") {
      return `Access to "${rewardName}" perk has been enabled! Enjoy your new benefits.`;
    }
    
    return rewardName
      ? `You've successfully claimed "${rewardName}"! Your reward is now available.`
      : `You've successfully claimed your reward! Your reward is now available.`;
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      const shareText = rewardName
        ? `I just claimed "${rewardName}"! 🎉`
        : `I just claimed a reward! 🎉`;
      
      if (navigator.share) {
        navigator.share({
          title: "Reward Claimed!",
          text: shareText,
        }).catch(() => {
          // Fallback to clipboard
          navigator.clipboard.writeText(shareText);
        });
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-md p-0 overflow-hidden",
          "bg-white rounded-3xl shadow-2xl",
          "border-0",
          "[&>button]:hidden", // Hide default close button, we have custom one
          "[&+div>div]:bg-yellow-400/90 [&+div>div]:backdrop-blur-sm" // Custom overlay
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-800" />
        </button>

        {/* Content */}
        <div className="relative p-8 pt-12 pb-6">
          {/* Confetti Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Red Starbursts */}
            <div className="absolute top-8 left-8 w-3 h-3 text-red-500 opacity-80">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
              </svg>
            </div>
            <div className="absolute top-12 right-12 w-2 h-2 text-red-500 opacity-60">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
              </svg>
            </div>
            
            {/* Orange Dots */}
            <div className="absolute top-16 left-16 w-2 h-2 bg-orange-400 rounded-full opacity-70" />
            <div className="absolute bottom-20 right-20 w-2.5 h-2.5 bg-orange-400 rounded-full opacity-60" />
            
            {/* Purple Diamonds */}
            <div className="absolute top-20 right-8 w-3 h-3 text-purple-500 opacity-70 transform rotate-45">
              <div className="w-full h-full bg-purple-500" />
            </div>
            <div className="absolute bottom-16 left-12 w-2.5 h-2.5 text-purple-400 opacity-60 transform rotate-45">
              <div className="w-full h-full bg-purple-400" />
            </div>
            
            {/* Yellow Diamonds */}
            <div className="absolute top-24 left-24 w-2 h-2 bg-yellow-400 opacity-70 transform rotate-45" />
            <div className="absolute bottom-24 right-16 w-2.5 h-2.5 bg-yellow-400 opacity-60 transform rotate-45" />
          </div>

          {/* Medal Icon */}
          <div className="relative flex justify-center mb-6">
            <div className="relative">
              {/* Golden Medal Circle */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                {/* Sunburst Effect */}
                <div className="absolute inset-0">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-1/2 w-1 h-6 bg-yellow-300 origin-bottom"
                      style={{
                        transform: `translateX(-50%) rotate(${i * 30}deg)`,
                        transformOrigin: "bottom center",
                      }}
                    />
                  ))}
                </div>
                
                {/* Crown Icon */}
                <div className="relative z-10">
                  <Crown className="w-12 h-12 text-white fill-white" />
                </div>
              </div>
              
              {/* Purple Ribbons */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-8 h-12 bg-gradient-to-b from-purple-500 to-purple-600 rounded-b-full transform -rotate-12" />
                <div className="w-8 h-12 bg-gradient-to-b from-purple-500 to-purple-600 rounded-b-full transform rotate-12" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {title}
          </h2>

          {/* Description */}
          <p className="text-center text-gray-600 text-sm leading-relaxed mb-6 px-2">
            {getDescription()}
          </p>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            className={cn(
              "w-full rounded-xl py-6 text-white font-semibold text-base",
              "bg-gradient-to-r from-orange-500 via-red-500 to-orange-600",
              "hover:from-orange-600 hover:via-red-600 hover:to-orange-700",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "flex items-center justify-center gap-2"
            )}
          >
            <Share2 className="w-5 h-5" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

