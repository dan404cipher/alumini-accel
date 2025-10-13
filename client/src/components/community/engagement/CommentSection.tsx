import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  Send,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Heart,
} from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { Comment } from "./types";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  initialCommentCount: number;
  onCommentCountChange?: (count: number) => void;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentCommentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  isEditing?: boolean;
  onEditSubmit?: (content: string) => void;
  onEditCancel?: () => void;
}

interface CommentItemState {
  editContent: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  isEditing = false,
  onEditSubmit,
  onEditCancel,
}) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // Update edit content when comment changes
  React.useEffect(() => {
    setEditContent(comment.content);
  }, [comment.content]);

  const isOwner = user?._id === comment.userId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEditSubmit?.(editContent.trim());
    } else {
      onEditCancel?.();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage
            src={
              comment.user.profilePicture
                ? comment.user.profilePicture.startsWith("http")
                  ? comment.user.profilePicture
                  : `${(
                      import.meta.env.VITE_API_BASE_URL ||
                      "http://localhost:3000/api/v1"
                    ).replace("/api/v1", "")}${comment.user.profilePicture}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${comment.user.firstName || ""} ${
                      comment.user.lastName || ""
                    }`
                  )}&background=random&color=fff`
            }
          />
          <AvatarFallback>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user.firstName} {comment.user.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                  placeholder="Edit your comment..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEditSubmit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={onEditCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <button
                onClick={() => onLike(comment._id)}
                className={cn(
                  "flex items-center gap-1 hover:text-red-500 transition-colors",
                  comment.likeCount > 0 && "text-red-500"
                )}
              >
                <Heart className="w-3 h-3" />
                {comment.likeCount > 0 && comment.likeCount}
              </button>

              <button
                onClick={() => onReply(comment._id)}
                className="hover:text-blue-500 transition-colors"
              >
                Reply
              </button>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(comment._id, comment.content)}
                    className="hover:text-blue-500 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment._id)}
                    className="hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}

              {hasReplies && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="hover:text-blue-500 transition-colors"
                >
                  {showReplies ? "Hide" : "Show"} {comment.repliesCount} replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showReplies && comment.replies && (
        <div className="ml-11 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  initialComments,
  initialCommentCount,
  onCommentCountChange,
  className,
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  const {
    comments,
    commentCount,
    loading,
    submitting,
    createComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    refreshComments,
  } = useComments({
    postId,
    initialComments,
    initialCommentCount,
  });

  // Load comments when component mounts
  React.useEffect(() => {
    if (commentCount > 0 && comments.length === 0) {
      refreshComments();
    }
  }, [commentCount, comments.length, refreshComments]);

  React.useEffect(() => {
    onCommentCountChange?.(commentCount);
  }, [commentCount, onCommentCountChange]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      await createComment(newComment.trim(), replyingTo || undefined);
      setNewComment("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
      setEditingComment(null);
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span className="font-medium">Comments ({commentCount})</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Comment Input */}
        {user && (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage
                src={
                  user.profilePicture
                    ? user.profilePicture.startsWith("http")
                      ? user.profilePicture
                      : `${(
                          import.meta.env.VITE_API_BASE_URL ||
                          "http://localhost:3000/api/v1"
                        ).replace("/api/v1", "")}${user.profilePicture}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${user.firstName || ""} ${user.lastName || ""}`
                      )}&background=random&color=fff`
                }
              />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  replyingTo ? "Write a reply..." : "Write a comment..."
                }
                className="min-h-[80px] resize-none"
                disabled={submitting}
              />

              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Replying to comment</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  {submitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {loading && comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onReply={setReplyingTo}
                onEdit={(id, content) => {
                  setEditingComment(id);
                }}
                onDelete={handleDeleteComment}
                onLike={toggleCommentLike}
                isEditing={editingComment === comment._id}
                onEditSubmit={(content) =>
                  handleEditComment(comment._id, content)
                }
                onEditCancel={() => setEditingComment(null)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
