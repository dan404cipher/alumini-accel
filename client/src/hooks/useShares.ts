import { useState, useCallback } from "react";
import { engagementAPI } from "@/services/engagementAPI";
import {
  ShareResponse,
  ShareUrlsResponse,
} from "@/components/community/engagement/types";

interface UseSharesProps {
  postId: string;
  initialShareCount: number;
}

export const useShares = ({ postId, initialShareCount }: UseSharesProps) => {
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrls, setShareUrls] = useState<ShareUrlsResponse["data"] | null>(
    null
  );

  const trackShare = useCallback(
    async (platform: string) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const response: ShareResponse = await engagementAPI.trackShare(
          postId,
          platform
        );
        setShareCount(response.data.shareCount);
        return response.data;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to track share");
        console.error("Error tracking share:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [postId, loading]
  );

  const getShareUrls = useCallback(async () => {
    try {
      const response: ShareUrlsResponse = await engagementAPI.getShareUrls(
        postId
      );
      setShareUrls(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to get share URLs");
      console.error("Error getting share URLs:", err);
      throw err;
    }
  }, [postId]);

  const refreshShareCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await engagementAPI.getShareCount(postId);
      setShareCount(response.data.shareCount);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to refresh share count");
      console.error("Error refreshing share count:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const shareToPlatform = useCallback(
    async (platform: string) => {
      try {
        // Get share URLs first
        const urls = await getShareUrls();

        // Track the share
        await trackShare(platform);

        // Open share URL
        if (urls.shareUrls[platform as keyof typeof urls.shareUrls]) {
          window.open(
            urls.shareUrls[platform as keyof typeof urls.shareUrls],
            "_blank"
          );
        }

        return true;
      } catch (err) {
        console.error("Error sharing to platform:", err);
        return false;
      }
    },
    [getShareUrls, trackShare]
  );

  const copyToClipboard = useCallback(async () => {
    try {
      const urls = await getShareUrls();
      await navigator.clipboard.writeText(urls.postUrl);

      // Track the share
      await trackShare("copy_link");

      return true;
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      return false;
    }
  }, [getShareUrls, trackShare]);

  return {
    shareCount,
    loading,
    error,
    shareUrls,
    trackShare,
    getShareUrls,
    refreshShareCount,
    shareToPlatform,
    copyToClipboard,
  };
};
