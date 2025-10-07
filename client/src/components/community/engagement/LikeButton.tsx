import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  size?: "sm" | "default" | "lg";
  showCount?: boolean;
  className?: string;
  onLikeChange?: (likes: number, isLiked: boolean) => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  initialLikeCount,
  initialIsLiked,
  size = "sm",
  showCount = true,
  className,
  onLikeChange,
}) => {
  const { likeCount, isLiked, loading, toggleLike } = useLikes({
    postId,
    initialLikeCount,
    initialIsLiked,
  });

  const handleToggleLike = async () => {
    await toggleLike();
    onLikeChange?.(likeCount, isLiked);
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggleLike}
      disabled={loading}
      className={cn(
        "flex items-center gap-1 transition-all duration-200",
        isLiked && "text-red-500 hover:text-red-600",
        !isLiked && "text-gray-500 hover:text-red-500",
        className
      )}
    >
      <Heart
        className={cn(
          "transition-all duration-200",
          size === "sm" && "w-4 h-4",
          size === "default" && "w-5 h-5",
          size === "lg" && "w-6 h-6",
          isLiked && "fill-current",
          loading && "animate-pulse"
        )}
      />
      {showCount && likeCount > 0 && (
        <span className="text-xs font-medium">
          {likeCount > 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
        </span>
      )}
    </Button>
  );
};
