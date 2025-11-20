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
  Menu,
  X,
  Maximize2,
  Newspaper,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

  // Fetch suggested news (after news is loaded)
  const {
    data: suggestedNewsResponse,
    isLoading: isLoadingSuggested,
    error: suggestedNewsError,
  } = useQuery({
    queryKey: ["suggestedNews", news?._id],
    queryFn: () =>
      newsAPI.getAllNews({
        limit: 10,
        page: 1,
      }),
    enabled: !!news?._id,
  });

  // Filter and prepare suggested news (exclude current news, prioritize recent)
  const allNews = ((suggestedNewsResponse?.data as { news?: News[] })?.news ||
    (suggestedNewsResponse?.data as News[]) ||
    []) as News[];
  const suggestedNews = allNews
    .filter((n: News) => n._id !== news?._id)
    .sort((a: News, b: News) => {
      // Sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

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
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 container mx-auto px-4 py-8 pt-24">
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
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 container mx-auto px-4 py-8 pt-24">
            <div className="text-center">
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
      </div>
    );
  }

  const imageUrl = getImageUrl(news.image);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Suggested News */}
        <aside
          className={`
            ${
              sidebarOpen
                ? "fixed inset-y-0 left-0 z-50"
                : "hidden lg:block lg:fixed lg:top-16 lg:left-0 lg:z-40"
            }
            top-16 w-[280px] sm:w-80 flex-shrink-0 bg-background ${
              sidebarOpen ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem)]"
            } border-r transition-transform duration-300 ease-in-out
          `}
        >
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            {/* Close button for mobile */}
            {sidebarOpen && (
              <div className="flex justify-end mb-4 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Suggested News
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Other news articles you might be interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSuggested ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-28 sm:h-32 bg-gray-200 rounded-lg"></div>
                        <div className="h-4 bg-gray-200 rounded mt-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded mt-1 w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : suggestedNewsError ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Newspaper className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Unable to load news</p>
                  </div>
                ) : suggestedNews.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {suggestedNews.map((suggestedItem: News) => (
                        <div
                          key={suggestedItem._id}
                          onClick={() => {
                            navigate(`/news/${suggestedItem._id}`);
                            setSidebarOpen(false);
                          }}
                          className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-blue-300"
                        >
                          {suggestedItem.image &&
                            getImageUrl(suggestedItem.image) && (
                              <div className="aspect-video overflow-hidden bg-gray-100">
                                <img
                                  src={getImageUrl(suggestedItem.image)!}
                                  alt={suggestedItem.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                          <div className="p-3">
                            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {suggestedItem.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(
                                  suggestedItem.createdAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Newspaper className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">
                      No suggested news at the moment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-80 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-24">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                <span>Suggested News</span>
              </Button>
            </div>

            {/* Back Button and Share Button */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 mt-10">
              <Button
                variant="ghost"
                onClick={() => navigate("/news")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to News</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Button variant="outline" onClick={handleShareNews}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* News Image */}
            {imageUrl && (
              <div className="mb-6 sm:mb-8 relative group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={news.title}
                    className="w-full h-full object-cover"
                    onClick={() => setIsImageModalOpen(true)}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <Maximize2 className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            )}

            {/* News Title and Meta Info */}
            <Card className="mb-4 sm:mb-6">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6">
                      {news.title}
                    </CardTitle>

                    {/* Author and Date Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-gray-500 mb-4">
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
            </Card>

            {/* News Summary */}
            <Card>
              <CardContent className="pt-6">
                <CardDescription className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                  {news.summary}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageUrl && (
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setIsImageModalOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              <img
                src={imageUrl}
                alt={news.title}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

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
  );
};

export default NewsDetail;
