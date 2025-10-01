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

interface CommunityPostCardProps {
  post: CommunityPost;
}

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              {post.author?.profileImage ? (
                <img
                  src={post.author.profileImage}
                  alt={`${post.author.firstName} ${post.author.lastName}`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 truncate">
                  {post.author?.firstName} {post.author?.lastName}
                </h4>
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
              <Heart className="w-4 h-4" />
              {post.likes.length}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {post.comments.length}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              {post.shares.length}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.viewCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Heart className="w-4 h-4 mr-1" />
              Like
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <MessageSquare className="w-4 h-4 mr-1" />
              Comment
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
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
            <div className="absolute inset-0 -z-10" onClick={closeImageModal} />
          </div>
        </div>
      )}
    </Card>
  );
};

export default CommunityPostCard;
