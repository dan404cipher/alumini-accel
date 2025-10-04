import { useState, useCallback } from "react";
import { engagementAPI } from "@/services/engagementAPI";
import { LikeResponse } from "@/components/community/engagement/types";

interface UseLikesProps {
  postId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
}

export const useLikes = ({
  postId,
  initialLikeCount,
  initialIsLiked,
}: UseLikesProps) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = useCallback(async () => {
    if (loading) return;

    // Optimistic update
    const previousLikeCount = likeCount;
    const previousIsLiked = isLiked;

    setLoading(true);
    setError(null);

    // Update UI immediately
    setIsLiked(!isLiked);
    setLikeCount((prev) => prev + (isLiked ? -1 : 1));

    try {
      const response: LikeResponse = await engagementAPI.toggleLike(postId);

      // Update with actual response
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (err: any) {
      // Rollback optimistic update on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);

      setError(err.response?.data?.message || "Failed to update like");
      console.error("Error toggling like:", err);
    } finally {
      setLoading(false);
    }
  }, [postId, likeCount, isLiked, loading]);

  const refreshLikes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await engagementAPI.getLikeCount(postId);
      setLikeCount(response.data.likeCount);
      setIsLiked(response.data.isLiked);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to refresh likes");
      console.error("Error refreshing likes:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  return {
    likeCount,
    isLiked,
    loading,
    error,
    toggleLike,
    refreshLikes,
  };
};
