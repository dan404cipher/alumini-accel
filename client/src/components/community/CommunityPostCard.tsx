import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageSquare,
  Share2,
  Eye,
  ThumbsUp,
  User,
  Calendar,
  Building,
  GraduationCap,
  Pin,
  Flag,
  Megaphone,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { CommunityPost } from "./types";
import { LikeButton, ShareButton, CommentSection } from "./engagement";
import { ActionMenu } from "./ActionMenu";
import EditPostModal from "./EditPostModal";
import { useAuth } from "@/contexts/AuthContext";
import { reportAPI , API_BASE_URL} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getAuthTokenOrNull } from "@/utils/auth";

interface CommunityPostCardProps {
  post: CommunityPost;
  isModerator?: boolean;
  isAdmin?: boolean;
}

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  isModerator = false,
  isAdmin = false,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  // Helper function to get auth token
  const getAuthToken = (): string => {
    const token = getAuthTokenOrNull();
    if (!token) {
      throw new Error("Access token is required");
    }
    return token;
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImageIndex === null || !post.mediaUrls) return;

    if (direction === "prev") {
      setSelectedImageIndex(
        selectedImageIndex > 0
          ? selectedImageIndex - 1
          : post.mediaUrls.length - 1
      );
    } else {
      setSelectedImageIndex(
        selectedImageIndex < post.mediaUrls.length - 1
          ? selectedImageIndex + 1
          : 0
      );
    }
  };

  const handleViewProfile = (userId: string) => {
    if (!userId) return;
    // Navigate to user profile page in same tab
    window.location.href = `/alumni-directory/${userId}`;
  };

  const downloadImage = () => {
    if (selectedImageIndex !== null && post.mediaUrls) {
      const link = document.createElement("a");
      link.href = post.mediaUrls[selectedImageIndex];
      link.download = `image-${selectedImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "announcement":
        return <Megaphone className="w-4 h-4" />;
      case "question":
        return <MessageSquare className="w-4 h-4" />;
      case "job":
        return <Building className="w-4 h-4" />;
      case "event":
        return <Calendar className="w-4 h-4" />;
      case "poll":
        return <ThumbsUp className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Action handlers
  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handlePostUpdated = () => {
    setShowEditModal(false);
    // Refresh the page to show updated post
    window.location.reload();
  };

  const handleDeletePost = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/community-posts/${post._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
        // Refresh the page or update the posts list
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleReportPost = async (reason: string, description: string) => {
    try {
      await reportAPI.createReport({
        entityId: post._id,
        entityType: "post",
        reason,
        description,
      });
    } catch (error) {
      console.error("Error reporting post:", error);
      toast({
        title: "Error",
        description: "Failed to report post",
        variant: "destructive",
      });
    }
  };

  const handleSharePost = () => {
    // The ShareButton component already handles sharing
    // This is just a fallback
    navigator.clipboard.writeText(
      `${window.location.origin}/community/post/${post._id}`
    );
    toast({
      title: "Success",
      description: "Post link copied to clipboard",
    });
  };

  // Check user permissions
  const isAuthor = user?._id === post.authorId?._id;
  const isGlobalAdmin =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "college_admin";
  const isHOD = user?.role === "hod";
  const isStaff = user?.role === "staff";

  // Use community-specific moderator/admin status from props
  const canEdit =
    isAuthor || isGlobalAdmin || isModerator || isAdmin || isHOD || isStaff;
  const canDelete =
    isAuthor || isGlobalAdmin || isModerator || isAdmin || isHOD || isStaff;
  const canReport = !isAuthor;
  const canShare = true;

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "announcement":
        return "bg-red-100 text-red-800";
      case "question":
        return "bg-blue-100 text-blue-800";
      case "job":
        return "bg-green-100 text-green-800";
      case "event":
        return "bg-purple-100 text-purple-800";
      case "poll":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="space-y-0">
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleViewProfile(post.author?._id || post.authorId)
                }
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all duration-200 cursor-pointer"
              >
                {post.author?.profilePicture ? (
                  <img
                    src={
                      post.author.profilePicture.startsWith("http")
                        ? post.author.profilePicture
                        : `${(
                            API_BASE_URL
                          ).replace("/api/v1", "")}${
                            post.author.profilePicture
                          }`
                    }
                    alt={`${post.author?.firstName || post.author?.firstName} ${
                      post.author?.lastName || post.author?.lastName
                    }`}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${
                          post.author?.firstName || post.author?.firstName || ""
                        } ${
                          post.author?.lastName || post.author?.lastName || ""
                        }`
                      )}&background=random&color=fff`;
                    }}
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${
                        post.author?.firstName || post.author?.firstName || ""
                      } ${post.author?.lastName || post.author?.lastName || ""}`
                    )}&background=random&color=fff`}
                    alt={`${post.author?.firstName || post.author?.firstName} ${
                      post.author?.lastName || post.author?.lastName
                    }`}
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleViewProfile(post.author?._id || post.authorId)
                    }
                    className="font-semibold text-gray-900 truncate hover:text-primary transition-colors duration-200 cursor-pointer"
                  >
                    {post.author?.firstName || post.author?.firstName}{" "}
                    {post.author?.lastName || post.author?.lastName}
                  </button>
                  {post.isPinned && <Pin className="w-4 h-4 text-blue-500" />}
                  {post.isAnnouncement && (
                    <Flag className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{formatTimeAgo(post.createdAt)}</span>
                  {post.author?.graduationYear && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {post.author.graduationYear}
                      </span>
                    </>
                  )}
                  {post.author?.currentCompany && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {post.author.currentCompany}
                      </span>
                    </>
                  )}
                  {post.author?.currentPosition && (
                    <>
                      <span>•</span>
                      <span>{post.author.currentPosition}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.category && (
                <Badge className={`${getCategoryColor(post.category)} text-xs`}>
                  {getCategoryIcon(post.category)}
                  <span className="ml-1">{post.category}</span>
                </Badge>
              )}
              {post.priority && (
                <Badge className={`${getPriorityColor(post.priority)} text-xs`}>
                  {post.priority}
                </Badge>
              )}
              <ActionMenu
                entityId={post._id}
                entityType="post"
                entityAuthorId={post.authorId}
                canEdit={canEdit}
                canDelete={canDelete}
                canReport={canReport}
                canShare={canShare}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onReport={handleReportPost}
                onShare={handleSharePost}
                size="sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Post Title */}
          {post.title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
          )}

          {/* Post Content */}
          {post.content && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {/* Media Images - Enhanced Design */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className={`${post.content ? "mt-4" : ""}`}>
              {post.mediaUrls.length === 1 ? (
                // Single image - larger display
                <div
                  className="relative group cursor-pointer"
                  onClick={() => openImageModal(0)}
                >
                  <img
                    src={post.mediaUrls[0]}
                    alt="Post image"
                    className="w-full h-64 sm:h-80 object-cover rounded-xl transition-transform group-hover:scale-[1.02] shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-xl flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    Click to view full size
                  </div>
                </div>
              ) : (
                // Multiple images - grid layout
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {post.mediaUrls.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => openImageModal(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-48 sm:h-56 object-cover rounded-lg transition-transform group-hover:scale-105 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        Click to expand
                      </div>
                      {post.mediaUrls.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            +{post.mediaUrls.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image-only post fallback content */}
          {post.mediaUrls &&
            post.mediaUrls.length > 0 &&
            !post.content &&
            !post.title && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 italic">
                  {post.mediaUrls.length === 1
                    ? "Shared an image"
                    : `Shared ${post.mediaUrls.length} images`}
                </p>
              </div>
            )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.viewCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LikeButton
                postId={post._id}
                initialLikeCount={post.likeCount || post.likes.length}
                initialIsLiked={post.isLiked || false}
                size="sm"
                showCount={true}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Comment
                {post.commentCount > 0 && (
                  <span className="ml-1 text-xs">{post.commentCount}</span>
                )}
              </Button>
              <ShareButton
                postId={post._id}
                postTitle={post.title}
                initialShareCount={post.shareCount || post.shares.length}
                size="sm"
                showCount={true}
              />
            </div>
          </div>
        </CardContent>

        {/* Image Modal */}
        {isModalOpen && selectedImageIndex !== null && post.mediaUrls && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Arrows */}
              {post.mediaUrls.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage("prev")}
                    className="absolute left-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => navigateImage("next")}
                    className="absolute right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Download Button */}
              <button
                onClick={downloadImage}
                className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Image Counter */}
              {post.mediaUrls.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {post.mediaUrls.length}
                </div>
              )}

              {/* Main Image */}
              <img
                src={post.mediaUrls[selectedImageIndex]}
                alt={`Post image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />

              {/* Click outside to close */}
              <div
                className="absolute inset-0 -z-10"
                onClick={closeImageModal}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post._id}
          initialComments={[]} // Will be populated by the component
          initialCommentCount={post.commentCount || post.comments.length}
          onCommentCountChange={(count) => {
            // Update the post's comment count in parent component if needed
            console.log("Comment count updated:", count);
          }}
          className="mt-2"
          isModerator={isModerator}
          isAdmin={isAdmin}
        />
      )}

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
};

export default CommunityPostCard;
