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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Filter,
  X,
  Menu,
  Bookmark,
  TrendingUp,
  Globe,
  Newspaper,
  Clock,
  Tag,
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
  author?: {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch news data
  const {
    data: newsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["news", user?.tenantId],
    queryFn: async () => {
      try {
        const response = await newsAPI.getAllNews({
          tenantId: user?.tenantId,
        });
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
    user?.role === "super_admin" ||
    user?.role === "coordinator" ||
    user?.role === "college_admin" ||
    user?.role === "hod" ||
    user?.role === "staff" ||
    user?.role === "alumni";

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
    queryClient.invalidateQueries({ queryKey: ["news", user?.tenantId] });
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
    <div className="flex gap-6 h-screen w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"}
        w-80 flex-shrink-0 bg-background
      `}
      >
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  News Room
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Stay updated with latest news</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search News */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search News</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search news articles, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Filters</h3>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="alumni">Alumni News</SelectItem>
                      <SelectItem value="career">Career Updates</SelectItem>
                      <SelectItem value="events">Event Updates</SelectItem>
                      <SelectItem value="achievements">Achievements</SelectItem>
                      <SelectItem value="announcements">
                        Announcements
                      </SelectItem>
                      <SelectItem value="industry">Industry News</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select
                    value={selectedDateRange}
                    onValueChange={setSelectedDateRange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(searchQuery ||
                  (selectedCategory && selectedCategory !== "all") ||
                  (selectedStatus && selectedStatus !== "all") ||
                  (selectedDateRange && selectedDateRange !== "all")) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedStatus("all");
                      setSelectedDateRange("all");
                    }}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <div className="space-y-2">
                  {canManageNews && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsCreateNewsOpen(true)}
                      className="w-full justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create News
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Saved Articles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending News
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Global News
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 p-4 lg:p-6 overflow-y-auto h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">News Room</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Stay updated with latest news • {news.length} articles
              </p>
            </div>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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

                <CardHeader className="pb-3 p-4 lg:p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base lg:text-lg line-clamp-2 mb-2">
                          {newsItem.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
                          <User className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                          <span className="truncate">
                            {newsItem.author?.firstName || "Unknown"}{" "}
                            {newsItem.author?.lastName || "Author"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/news/${newsItem._id}`)}
                          className="flex-shrink-0 text-xs lg:text-sm"
                        >
                          <Eye className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareNews(newsItem)}
                          className="flex-shrink-0 text-xs lg:text-sm"
                        >
                          <Share2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
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

                <CardContent className="pt-0 flex-1 flex flex-col p-4 lg:p-6">
                  <CardDescription className="line-clamp-3 mb-4 flex-1 text-xs lg:text-sm">
                    {newsItem.summary}
                  </CardDescription>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-auto">
                    <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
                      <Calendar className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {formatDate(newsItem.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {newsItem.isShared ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 flex-shrink-0 text-xs"
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          Shared
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 text-xs"
                        >
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
      </div>

      {/* Dialogs */}
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
  );
};

export default NewsRoom;
