import { useState, useCallback } from "react";
import { engagementAPI } from "@/services/engagementAPI";
import {
  Comment,
  CommentResponse,
} from "@/components/community/engagement/types";

interface UseCommentsProps {
  postId: string;
  initialComments: Comment[];
  initialCommentCount: number;
}

export const useComments = ({
  postId,
  initialComments,
  initialCommentCount,
}: UseCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createComment = useCallback(
    async (content: string, parentCommentId?: string) => {
      if (submitting || !content.trim()) return;

      setSubmitting(true);
      setError(null);

      try {
        const response: CommentResponse = await engagementAPI.createComment(
          postId,
          content.trim(),
          parentCommentId
        );

        const newComment = response.data.comment;

        if (parentCommentId) {
          // Add reply to parent comment
          setComments((prev) =>
            prev.map((comment) =>
              comment._id === parentCommentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), newComment],
                  }
                : comment
            )
          );
        } else {
          // Add new top-level comment
          setComments((prev) => [newComment, ...prev]);
        }

        setCommentCount(response.data.commentCount);
        return newComment;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to create comment");
        console.error("Error creating comment:", err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [postId, submitting]
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      if (submitting || !content.trim()) return;

      setSubmitting(true);
      setError(null);

      try {
        const response: CommentResponse = await engagementAPI.updateComment(
          commentId,
          content.trim()
        );
        const updatedComment = response.data.comment;

        // Update comment in state
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId ? updatedComment : comment
          )
        );

        return updatedComment;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to update comment");
        console.error("Error updating comment:", err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [submitting]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (submitting) return;

      setSubmitting(true);
      setError(null);

      try {
        await engagementAPI.deleteComment(commentId);

        // Remove comment from state
        setComments((prev) =>
          prev.filter((comment) => comment._id !== commentId)
        );
        setCommentCount((prev) => prev - 1);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete comment");
        console.error("Error deleting comment:", err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [submitting]
  );

  const toggleCommentLike = useCallback(async (commentId: string) => {
    try {
      const response = await engagementAPI.toggleCommentLike(commentId);

      // Update comment like status in state
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? { ...comment, likeCount: response.data.likeCount }
            : comment
        )
      );

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update comment like");
      console.error("Error toggling comment like:", err);
      throw err;
    }
  }, []);

  const refreshComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await engagementAPI.getComments(postId);
      setComments(response.data.comments);
      setCommentCount(response.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to refresh comments");
      console.error("Error refreshing comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const loadMoreComments = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const response = await engagementAPI.getComments(postId, page);
        setComments((prev) => [...prev, ...response.data.comments]);
        return response.data.comments.length > 0;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load more comments");
        console.error("Error loading more comments:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  const loadReplies = useCallback(
    async (commentId: string, page: number = 1) => {
      try {
        const response = await engagementAPI.getReplies(commentId, page);

        // Update comment with replies
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? { ...comment, replies: response.data.replies }
              : comment
          )
        );

        return response.data.replies;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load replies");
        console.error("Error loading replies:", err);
        throw err;
      }
    },
    []
  );

  return {
    comments,
    commentCount,
    loading,
    submitting,
    error,
    createComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    refreshComments,
    loadMoreComments,
    loadReplies,
  };
};
