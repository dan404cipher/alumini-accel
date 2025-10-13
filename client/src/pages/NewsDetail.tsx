import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { newsAPI } from "@/lib/api";
import Navigation from "@/components/Navigation";
import EditNewsDialog from "@/components/dialogs/EditNewsDialog";
import DeleteNewsDialog from "@/components/dialogs/DeleteNewsDialog";
import ShareNewsDialog from "@/components/dialogs/ShareNewsDialog";

interface News {
  _id: string;
  title: string;
  summary: string;
  image?: string;
  isShared: boolean;
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("news");
  const [isEditNewsOpen, setIsEditNewsOpen] = useState(false);
  const [isDeleteNewsOpen, setIsDeleteNewsOpen] = useState(false);
  const [isShareNewsOpen, setIsShareNewsOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // Fetch news data
  const {
    data: newsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["news", id],
    queryFn: () => newsAPI.getNewsById(id!),
    enabled: !!id,
  });

  const news = newsResponse?.data?.news;

  // Set selected news for dialogs
  useEffect(() => {
    if (news) {
      setSelectedNews(news);
    }
  }, [news]);

  // Check if user can manage news
  const canManageNews =
    user?.role === "super_admin" || user?.role === "coordinator";

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get image URL
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null;

    // If it's a full URL, return as is
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // If it's a relative path (uploaded image), use proxy path
    if (image.startsWith("/") || image.startsWith("uploads/")) {
      // Ensure the image path starts with /uploads/ for proxy
      let imagePath = image;
      if (image.startsWith("uploads/")) {
        imagePath = `/${image}`;
      }
      return imagePath;
    }

    return image;
  };

  // Handle edit news
  const handleEditNews = () => {
    setIsEditNewsOpen(true);
  };

  // Handle delete news
  const handleDeleteNews = () => {
    setIsDeleteNewsOpen(true);
  };

  // Handle share news
  const handleShareNews = () => {
    setIsShareNewsOpen(true);
  };

  // Handle news updated
  const handleNewsUpdated = () => {
    setIsEditNewsOpen(false);
    setSelectedNews(null);
    // Refresh the page data
    window.location.reload();
  };

  // Handle news deleted
  const handleNewsDeleted = () => {
    setIsDeleteNewsOpen(false);
    setSelectedNews(null);
    // Navigate back to news list
    navigate("/news");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" style={{ overflowY: "auto" }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-background" style={{ overflowY: "auto" }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              News Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The news article you're looking for doesn't exist or has been
              removed.
            </p>
            <Button onClick={() => navigate("/news")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ overflowY: "auto" }}>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button and Share Button */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate("/news")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
            <Button variant="outline" onClick={handleShareNews}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* News Article */}
          <Card className="overflow-hidden">
            {/* News Image */}
            {news.image && getImageUrl(news.image) && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={getImageUrl(news.image)!}
                  alt={news.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-4">{news.title}</CardTitle>

                  {/* Author and Date Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>
                        {news.author?.firstName || "Unknown"}{" "}
                        {news.author?.lastName || "Author"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(news.createdAt)}</span>
                    </div>
                  </div>

                  {/* Share Status */}
                  <div className="flex items-center space-x-2 mb-4">
                    {news.isShared ? (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Shared with Community
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                </div>

                {/* Action Menu */}
                {canManageNews && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditNews}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteNews}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <CardDescription className="text-base leading-relaxed whitespace-pre-wrap">
                {news.summary}
              </CardDescription>
            </CardContent>
          </Card>

          {/* Edit News Dialog */}
          {selectedNews && (
            <EditNewsDialog
              open={isEditNewsOpen}
              onOpenChange={setIsEditNewsOpen}
              news={selectedNews}
              onNewsUpdated={handleNewsUpdated}
            />
          )}

          {/* Delete News Dialog */}
          {selectedNews && (
            <DeleteNewsDialog
              open={isDeleteNewsOpen}
              onOpenChange={setIsDeleteNewsOpen}
              news={selectedNews}
              onNewsDeleted={handleNewsDeleted}
            />
          )}

          {/* Share News Dialog */}
          {selectedNews && (
            <ShareNewsDialog
              open={isShareNewsOpen}
              onOpenChange={setIsShareNewsOpen}
              news={selectedNews}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
