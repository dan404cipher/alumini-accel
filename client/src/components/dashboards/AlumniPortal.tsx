import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Building2,
  TrendingUp,
  Heart,
  Share2,
  Edit,
  Camera,
  Users,
  Briefcase,
  DollarSign,
  User,
  Plus,
  Upload,
  MessageSquare,
  Image as ImageIcon,
  ArrowRight,
  Clock,
  Eye,
  ExternalLink,
  Target,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import MentorshipActionMenu from "@/components/mentorship/MentorshipActionMenu";
import EditMentorshipDialog from "@/components/dialogs/EditMentorshipDialog";
import DeleteMentorshipDialog from "@/components/dialogs/DeleteMentorshipDialog";

const AlumniPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  const [collegeBanner, setCollegeBanner] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [recentGalleries, setRecentGalleries] = useState<any[]>([]);
  const [recentCommunities, setRecentCommunities] = useState<any[]>([]);
  const [recentMentorships, setRecentMentorships] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [recentMentorshipPrograms, setRecentMentorshipPrograms] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState<any>(null);

  // Load college banner
  useEffect(() => {
    const loadCollegeBanner = async () => {
      if (user?.tenantId) {
        try {
          const bannerResponse = await tenantAPI.getBanner(user.tenantId);
          if (typeof bannerResponse === "string") {
            setCollegeBanner(bannerResponse);
          }
        } catch (error) {
          // No banner found or error loading banner

          // Check localStorage as fallback
          try {
            const storedBanner = localStorage.getItem(
              `college_banner_${user.tenantId}`
            );
            if (storedBanner) {
              setCollegeBanner(storedBanner);
            }
          } catch (localStorageError) {
            // Error loading banner from localStorage
          }
        }
      }
    };

    loadCollegeBanner();
  }, [user?.tenantId]);

  // Listen for banner updates
  useEffect(() => {
    const handleBannerUpdate = () => {
      if (user?.tenantId) {
        const loadCollegeBanner = async () => {
          try {
            const bannerResponse = await tenantAPI.getBanner(user.tenantId);
            if (bannerResponse instanceof Blob) {
              const bannerUrl = URL.createObjectURL(bannerResponse);
              setCollegeBanner(bannerUrl);
            }
          } catch (error) {
            // No banner found or error loading banner

            // Check localStorage as fallback
            try {
              const storedBanner = localStorage.getItem(
                `college_banner_${user.tenantId}`
              );
              if (storedBanner) {
                setCollegeBanner(storedBanner);
              }
            } catch (localStorageError) {
              // Error loading banner from localStorage
            }
          }
        };
        loadCollegeBanner();
      }
    };

    window.addEventListener("collegeBannerUpdated", handleBannerUpdate);
    return () => {
      window.removeEventListener("collegeBannerUpdated", handleBannerUpdate);
    };
  }, [user?.tenantId]);

  // Fetch recent data
  useEffect(() => {
    const fetchRecentData = async () => {
      setLoading(true);
      try {
        // Check localStorage first (remember me), then sessionStorage
        let token = localStorage.getItem("token");
        if (!token) {
          token = sessionStorage.getItem("token");
        }
        if (!token) {
          throw new Error("Access token is required");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

        // Fetch recent events
        const eventsResponse = await fetch(`${baseUrl}/events?limit=8`, {
          headers,
        });
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setRecentEvents(eventsData.data?.events || []);
        }

        // Fetch recent news
        const newsResponse = await fetch(`${baseUrl}/news?limit=8`, {
          headers,
        });
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          setRecentNews(newsData.data?.news || []);
        }

        // Fetch recent galleries
        const galleriesResponse = await fetch(`${baseUrl}/gallery?limit=8`, {
          headers,
        });
        if (galleriesResponse.ok) {
          const galleriesData = await galleriesResponse.json();
          setRecentGalleries(galleriesData.data?.galleries || []);
        }

        // Fetch top communities
        const communitiesResponse = await fetch(
          `${baseUrl}/communities/top?limit=8`,
          { headers }
        );
        if (communitiesResponse.ok) {
          const communitiesData = await communitiesResponse.json();
          setRecentCommunities(communitiesData.data || []);
        }

        // Fetch recent mentorships
        const mentorshipsResponse = await fetch(
          `${baseUrl}/mentorship?limit=8`,
          { headers }
        );
        if (mentorshipsResponse.ok) {
          const mentorshipsData = await mentorshipsResponse.json();
          const mentorships = mentorshipsData.data?.mentorships || [];
          setRecentMentorships(mentorships);
        }

        // Fetch recent jobs
        const jobsResponse = await fetch(`${baseUrl}/jobs?limit=8`, {
          headers,
        });
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setRecentJobs(jobsData.data?.jobs || []);
        }

        // Fetch recent campaigns
        const campaignsResponse = await fetch(`${baseUrl}/campaigns?limit=8`, {
          headers,
        });
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          setRecentCampaigns(
            campaignsData.data?.campaigns || campaignsData.data || []
          );
        }

        // Fetch recent mentorship programs
        const mentorshipProgramsResponse = await fetch(
          `${baseUrl}/mentorship?limit=8`,
          {
            headers,
          }
        );
        if (mentorshipProgramsResponse.ok) {
          const mentorshipProgramsData =
            await mentorshipProgramsResponse.json();
          setRecentMentorshipPrograms(
            mentorshipProgramsData.data?.mentorships ||
              mentorshipProgramsData.data ||
              []
          );
        }
      } catch (error) {
        console.error("Error fetching recent data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentData();
  }, [user?.role]);

  // Navigation handlers
  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleNewsClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  const handleGalleryClick = (galleryId: string) => {
    navigate(`/gallery/${galleryId}`);
  };

  const handleCommunityClick = (communityId: string) => {
    navigate(`/community/${communityId}`);
  };

  const handleMentorshipClick = (mentorshipId: string) => {
    navigate(`/mentorship/${mentorshipId}`);
  };

  const handleEditMentorship = (mentorship: any) => {
    setSelectedMentorship(mentorship);
    setShowEditDialog(true);
  };

  const handleDeleteMentorship = (mentorship: any) => {
    setSelectedMentorship(mentorship);
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    // Refresh mentorships data
    fetchRecentData();
    setShowEditDialog(false);
    setSelectedMentorship(null);
  };

  const handleDeleteSuccess = () => {
    // Refresh mentorships data
    fetchRecentData();
    setShowDeleteDialog(false);
    setSelectedMentorship(null);
  };

  const handleJobClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleCampaignClick = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleMentorshipProgramClick = (programId: string) => {
    navigate(`/mentorship/${programId}`);
  };

  const handleViewAll = (section: string) => {
    navigate(`/${section}`);
  };

  return (
    <div className="min-h-screen bg-white p-6 lg:p-8 pt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* College Banner */}
        {collegeBanner && (
          <div className="relative overflow-hidden rounded-lg shadow-sm border">
            <img
              src={collegeBanner}
              alt="College Banner"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="max-w-4xl">
                <h2 className="text-3xl font-semibold text-white mb-2">
                  Alumni Portal
                </h2>
                <p className="text-lg text-white/90 max-w-2xl">
                  Connect with fellow alumni and stay updated with college news
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.firstName}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>Alumni Member</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="h-8 bg-gray-200 rounded w-8"></div>
                </div>
                <div className="flex space-x-4">
                  {[...Array(4)].map((_, j) => (
                    <div
                      key={j}
                      className="w-64 h-40 bg-gray-100 rounded border"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recent Events */}
            <div className="bg-white border rounded-lg">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Events
                  </h2>
                </div>
                <button
                  onClick={() => handleViewAll("events")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                {recentEvents.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentEvents.map((event) => (
                      <div
                        key={event._id}
                        onClick={() => handleEventClick(event._id)}
                        className="flex-shrink-0 w-64 bg-gray-50 border rounded-lg cursor-pointer"
                      >
                        <div className="relative">
                          {event.image ? (
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <Calendar className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="bg-white text-xs px-2 py-1 rounded text-gray-600">
                              {event.type || "Event"}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {event.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                          {event.location && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              {event.currentAttendees || 0} attendees
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent events</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent News */}
            <div className="bg-white border rounded-lg">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent News
                  </h2>
                </div>
                <button
                  onClick={() => handleViewAll("news")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                {recentNews.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentNews.map((news) => (
                      <div
                        key={news._id}
                        onClick={() => handleNewsClick(news._id)}
                        className="flex-shrink-0 w-64 bg-gray-50 border rounded-lg cursor-pointer"
                      >
                        <div className="relative">
                          {news.image ? (
                            <img
                              src={news.image}
                              alt={news.title}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <MessageSquare className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="bg-white text-xs px-2 py-1 rounded text-gray-600">
                              News
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {news.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {news.content}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-3">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(news.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              {news.author?.firstName} {news.author?.lastName}
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent news</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Gallery */}
            <div className="bg-white border rounded-lg">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <ImageIcon className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Gallery
                  </h2>
                </div>
                <button
                  onClick={() => handleViewAll("gallery")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                {recentGalleries.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentGalleries.map((gallery) => (
                      <div
                        key={gallery._id}
                        onClick={() => handleGalleryClick(gallery._id)}
                        className="flex-shrink-0 w-64 bg-gray-50 border rounded-lg cursor-pointer"
                      >
                        <div className="relative">
                          {gallery.images && gallery.images.length > 0 ? (
                            <img
                              src={gallery.images[0]}
                              alt={gallery.title}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="bg-white text-xs px-2 py-1 rounded text-gray-600">
                              Gallery
                            </span>
                          </div>
                          {gallery.images && gallery.images.length > 1 && (
                            <div className="absolute bottom-2 right-2">
                              <span className="bg-white text-xs px-2 py-1 rounded text-gray-600">
                                +{gallery.images.length - 1} more
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {gallery.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {gallery.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-3">
                            <Eye className="h-3 w-3 mr-1" />
                            {gallery.images?.length || 0} photos
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              {gallery.createdBy?.firstName}{" "}
                              {gallery.createdBy?.lastName}
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent galleries</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Communities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Top Communities</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAll("community")}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentCommunities.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentCommunities.map((community) => (
                      <div
                        key={community._id}
                        onClick={() => handleCommunityClick(community._id)}
                        className="flex-shrink-0 w-64 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="relative">
                          {community.logo ? (
                            <img
                              src={community.logo}
                              alt={community.name}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-t-lg flex items-center justify-center">
                              <Users className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs">
                              {community.type || "Community"}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm truncate group-hover:text-orange-600 transition-colors">
                            {community.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {community.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <Users className="h-3 w-3 mr-1" />
                            {community.memberCount || 0} members
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {community.category}
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-orange-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent communities</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Mentorships */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">Active Mentorships </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAll("mentorship")}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentMentorships.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentMentorships.map((mentorship) => (
                      <div
                        key={mentorship._id}
                        className="flex-shrink-0 w-64 bg-white rounded-lg border hover:shadow-md transition-all group relative"
                      >
                        <div className="relative">
                          {mentorship.mentor?.profilePicture ? (
                            <img
                              src={mentorship.mentor.profilePicture}
                              alt={mentorship.mentor?.firstName}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-t-lg flex items-center justify-center">
                              <User className="h-8 w-8 text-indigo-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant={
                                mentorship.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {mentorship.status || "pending"}
                            </Badge>
                          </div>
                          {/* Action Menu */}
                          <div className="absolute top-2 left-2">
                            <MentorshipActionMenu
                              mentorship={mentorship}
                              currentUser={user}
                              onEdit={() => handleEditMentorship(mentorship)}
                              onDelete={() =>
                                handleDeleteMentorship(mentorship)
                              }
                            />
                          </div>
                        </div>
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() => handleMentorshipClick(mentorship._id)}
                        >
                          <h4 className="font-medium text-sm truncate group-hover:text-indigo-600 transition-colors">
                            {mentorship.title || "Mentorship Request"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {mentorship.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <User className="h-3 w-3 mr-1" />
                            {mentorship.mentor?.firstName}{" "}
                            {mentorship.mentor?.lastName}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {mentorship.field || "General"}
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent mentorships</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <div className="bg-white border rounded-lg">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Active Jobs
                  </h2>
                </div>
                <button
                  onClick={() => handleViewAll("jobs")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                {recentJobs.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentJobs.map((job) => (
                      <div
                        key={job._id}
                        onClick={() => handleJobClick(job._id)}
                        className="flex-shrink-0 w-64 bg-gray-50 border rounded-lg cursor-pointer"
                      >
                        <div className="relative">
                          {job.company?.logo ? (
                            <img
                              src={job.company.logo}
                              alt={job.company.name}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <Briefcase className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="bg-white text-xs px-2 py-1 rounded text-gray-600">
                              {job.type || "Job"}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {job.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-3">
                            <Building2 className="h-3 w-3 mr-1" />
                            {job.company?.name || "Company"}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              {job.location || "Location"}
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent jobs</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white border rounded-lg">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Active Campaigns
                  </h2>
                </div>
                <button
                  onClick={() => handleViewAll("campaigns")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                {recentCampaigns.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentCampaigns.map((campaign) => {
                      return (
                        <div
                          key={campaign._id}
                          onClick={() => handleCampaignClick(campaign._id)}
                          className="flex-shrink-0 w-64 bg-gray-50 border rounded-lg cursor-pointer"
                        >
                          <div className="relative">
                            {campaign.imageUrl || campaign.images?.[0] ? (
                              <img
                                src={campaign.imageUrl || campaign.images[0]}
                                alt={campaign.title}
                                className="w-full h-32 object-cover rounded-t-lg"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                                <Target className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <span className="bg-white text-xs px-2 py-1 rounded text-gray-600">
                                Campaign
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {campaign.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {campaign.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-3">
                              <DollarSign className="h-3 w-3 mr-1" />$
                              {campaign.targetAmount || 0} goal
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500">
                                {campaign.status || "Active"}
                              </span>
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent campaigns</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Mentorship Programs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">
                    Recent Mentorship Programs
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAll("mentorship")}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentMentorshipPrograms.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentMentorshipPrograms.map((program) => (
                      <div
                        key={program._id}
                        onClick={() =>
                          handleMentorshipProgramClick(program._id)
                        }
                        className="flex-shrink-0 w-64 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="relative">
                          {program.mentor?.profilePicture ? (
                            <img
                              src={program.mentor.profilePicture}
                              alt={`${program.mentor?.firstName} ${program.mentor?.lastName}`}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-t-lg flex items-center justify-center">
                              <GraduationCap className="h-8 w-8 text-purple-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant={
                                program.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {program.domain || "Mentorship"}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm truncate group-hover:text-purple-600 transition-colors">
                            {program.domain || "Mentorship Program"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {program.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <User className="h-3 w-3 mr-1" />
                            {program.mentor?.firstName}{" "}
                            {program.mentor?.lastName}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {program.status || "Pending"}
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-purple-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No recent mentorship programs</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Mentorship Dialog */}
      <EditMentorshipDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        mentorship={selectedMentorship}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Mentorship Dialog */}
      <DeleteMentorshipDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        mentorship={selectedMentorship}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default AlumniPortal;
