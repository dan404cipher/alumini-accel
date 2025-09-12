import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Share2,
  Calendar,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { newsAPI } from "@/lib/api";
import CreateNewsDialog from "@/components/dialogs/CreateNewsDialog";
import EditNewsDialog from "@/components/dialogs/EditNewsDialog";
import DeleteNewsDialog from "@/components/dialogs/DeleteNewsDialog";
import ShareNewsDialog from "@/components/dialogs/ShareNewsDialog";

interface News {
  _id: string;
  title: string;
  summary: string;
  image?: string;
  isShared: boolean;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const NewsRoom = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreateNewsOpen, setIsCreateNewsOpen] = useState(false);
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
    queryKey: ["news"],
    queryFn: async () => {
      try {
        const response = await newsAPI.getAllNews();
        return response;
      } catch (error) {
        console.error("NewsRoom - Error:", error);
        throw error;
      }
    },
    enabled: !!user, // Only run query if user is authenticated
  });

  const news = newsResponse?.data?.news || [];

  // Check if user can manage news
  const canManageNews =
    user?.role === "super_admin" || user?.role === "coordinator";

  // Handle create news
  const handleCreateNews = () => {
    setIsCreateNewsOpen(true);
  };

  // Handle edit news
  const handleEditNews = (news: News) => {
    setSelectedNews(news);
    setIsEditNewsOpen(true);
  };

  // Handle delete news
  const handleDeleteNews = (news: News) => {
    setSelectedNews(news);
    setIsDeleteNewsOpen(true);
  };

  // Handle share news
  const handleShareNews = (news: News) => {
    setSelectedNews(news);
    setIsShareNewsOpen(true);
  };

  // Handle news created
  const handleNewsCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["news"] });
    setIsCreateNewsOpen(false);
  };

  // Handle news updated
  const handleNewsUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["news"] });
    setIsEditNewsOpen(false);
    setSelectedNews(null);
  };

  // Handle news deleted
  const handleNewsDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["news"] });
    setIsDeleteNewsOpen(false);
    setSelectedNews(null);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to get image URL
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null;

    // If it's a full URL, return as is
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // If it's a relative path (uploaded image), construct full URL
    if (image.startsWith("/") || image.startsWith("uploads/")) {
      const baseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
      ).replace("/api/v1", "");
      const fullUrl = `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
      return fullUrl;
    }

    return image;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600">Please log in to view news articles.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading News
          </h1>
          <p className="text-gray-600">
            There was an error loading the news. Please try again.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Check the browser console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">News Room</h1>
            <p className="text-gray-600 mt-2">
              Manage and share news articles with the alumni community
            </p>
          </div>
          {canManageNews && (
            <Button onClick={handleCreateNews} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Create News
            </Button>
          )}
        </div>

        {/* News Grid */}
        {news.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No news articles yet
            </h3>
            <p className="text-gray-600 mb-6">
              {canManageNews
                ? "Create your first news article to get started."
                : "Check back later for news updates."}
            </p>
            {canManageNews && (
              <Button onClick={handleCreateNews}>
                <Plus className="w-4 h-4 mr-2" />
                Create First News
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((newsItem) => (
              <Card
                key={newsItem._id}
                className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col"
              >
                {/* News Image */}
                {newsItem.image && getImageUrl(newsItem.image) && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={getImageUrl(newsItem.image)!}
                      alt={newsItem.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {newsItem.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {newsItem.author.firstName}{" "}
                            {newsItem.author.lastName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/news/${newsItem._id}`)}
                          className="flex-shrink-0"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareNews(newsItem)}
                          className="flex-shrink-0"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>

                      {canManageNews && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/news/${newsItem._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditNews(newsItem)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteNews(newsItem)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col">
                  <CardDescription className="line-clamp-3 mb-4 flex-1">
                    {newsItem.summary}
                  </CardDescription>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {formatDate(newsItem.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {newsItem.isShared ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 flex-shrink-0"
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          Shared
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex-shrink-0">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create News Dialog */}
        <CreateNewsDialog
          open={isCreateNewsOpen}
          onOpenChange={setIsCreateNewsOpen}
          onNewsCreated={handleNewsCreated}
        />

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
  );
};

export default NewsRoom;
