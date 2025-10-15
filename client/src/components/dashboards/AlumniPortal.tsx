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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const AlumniPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collegeBanner, setCollegeBanner] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [recentGalleries, setRecentGalleries] = useState<any[]>([]);
  const [recentCommunities, setRecentCommunities] = useState<any[]>([]);
  const [recentMentorships, setRecentMentorships] = useState<any[]>([]);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          console.log("No banner found or error loading banner:", error);

          // Check localStorage as fallback
          try {
            const storedBanner = localStorage.getItem(
              `college_banner_${user.tenantId}`
            );
            if (storedBanner) {
              setCollegeBanner(storedBanner);
            }
          } catch (localStorageError) {
            console.log(
              "Error loading banner from localStorage:",
              localStorageError
            );
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
            console.log("No banner found or error loading banner:", error);

            // Check localStorage as fallback
            try {
              const storedBanner = localStorage.getItem(
                `college_banner_${user.tenantId}`
              );
              if (storedBanner) {
                setCollegeBanner(storedBanner);
              }
            } catch (localStorageError) {
              console.log(
                "Error loading banner from localStorage:",
                localStorageError
              );
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
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

        // Fetch recent events
        const eventsResponse = await fetch(`${baseUrl}/events?limit=3`, {
          headers,
        });
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setRecentEvents(eventsData.data?.events || []);
        }

        // Fetch recent news
        const newsResponse = await fetch(`${baseUrl}/news?limit=3`, {
          headers,
        });
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          setRecentNews(newsData.data?.news || []);
        }

        // Fetch recent galleries
        const galleriesResponse = await fetch(`${baseUrl}/gallery?limit=3`, {
          headers,
        });
        if (galleriesResponse.ok) {
          const galleriesData = await galleriesResponse.json();
          setRecentGalleries(galleriesData.data?.galleries || []);
        }

        // Fetch recent communities
        const communitiesResponse = await fetch(
          `${baseUrl}/communities?limit=3`,
          { headers }
        );
        if (communitiesResponse.ok) {
          const communitiesData = await communitiesResponse.json();
          setRecentCommunities(communitiesData.data?.communities || []);
        }

        // Fetch recent mentorships
        const mentorshipsResponse = await fetch(
          `${baseUrl}/mentorship?limit=3`,
          { headers }
        );
        if (mentorshipsResponse.ok) {
          const mentorshipsData = await mentorshipsResponse.json();
          setRecentMentorships(mentorshipsData.data?.mentorships || []);
        }

        // Fetch recent donations
        const donationsResponse = await fetch(`${baseUrl}/donations?limit=3`, {
          headers,
        });
        if (donationsResponse.ok) {
          const donationsData = await donationsResponse.json();
          setRecentDonations(donationsData.data?.donations || []);
        }
      } catch (error) {
        console.error("Error fetching recent data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentData();
  }, []);

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

  const handleDonationClick = (donationId: string) => {
    navigate(`/donations/${donationId}`);
  };

  const handleViewAll = (section: string) => {
    navigate(`/${section}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 pt-20">
      <div className="space-y-8">
        {/* College Banner */}
        {collegeBanner && (
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img
              src={collegeBanner}
              alt="College Banner"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="max-w-4xl">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Welcome to Your College Alumni Portal
                </h2>
                <p className="text-xl text-white/90 mb-6 max-w-2xl">
                  Connect with fellow alumni, discover opportunities, and stay
                  updated with college news
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alumni Dashboard</h1>
            <p className="text-muted-foreground">
              Stay connected with your alma mater
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <User className="w-4 h-4 mr-2" />
            Alumni
          </Badge>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Events */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Recent Events</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAll("events")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => handleEventClick(event._id)}
                      className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {event.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                          {event.location && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent events</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent News */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Recent News</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAll("news")}
                  className="text-green-600 hover:text-green-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentNews.length > 0 ? (
                  recentNews.map((news) => (
                    <div
                      key={news._id}
                      onClick={() => handleNewsClick(news._id)}
                      className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {news.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {news.content}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(news.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent news</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Gallery */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Recent Gallery</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAll("gallery")}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentGalleries.length > 0 ? (
                  recentGalleries.map((gallery) => (
                    <div
                      key={gallery._id}
                      onClick={() => handleGalleryClick(gallery._id)}
                      className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {gallery.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {gallery.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Eye className="h-3 w-3 mr-1" />
                            {gallery.images?.length || 0} photos
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent galleries</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Communities */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Recent Communities</CardTitle>
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
              <CardContent className="space-y-3">
                {recentCommunities.length > 0 ? (
                  recentCommunities.map((community) => (
                    <div
                      key={community._id}
                      onClick={() => handleCommunityClick(community._id)}
                      className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {community.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {community.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Users className="h-3 w-3 mr-1" />
                            {community.memberCount || 0} members
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent communities</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Mentorships */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">Recent Mentorships</CardTitle>
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
              <CardContent className="space-y-3">
                {recentMentorships.length > 0 ? (
                  recentMentorships.map((mentorship) => (
                    <div
                      key={mentorship._id}
                      onClick={() => handleMentorshipClick(mentorship._id)}
                      className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {mentorship.title || "Mentorship Request"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {mentorship.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {mentorship.status || "pending"}
                            </Badge>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent mentorships</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Donations */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg">Recent Donations</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAll("donations")}
                  className="text-red-600 hover:text-red-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentDonations.length > 0 ? (
                  recentDonations.map((donation) => (
                    <div
                      key={donation._id}
                      onClick={() => handleDonationClick(donation._id)}
                      className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {donation.campaign?.title || "Donation"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Amount: ${donation.amount}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent donations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniPortal;
