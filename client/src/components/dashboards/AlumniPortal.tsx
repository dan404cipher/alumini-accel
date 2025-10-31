import React, { useState, useEffect } from "react";
import { getAuthTokenOrNull } from "@/utils/auth";
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
  UserCheck,
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  Hash,
  Activity,
  Bookmark,
  Star,
  Share2 as ShareIcon,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  tenantAPI,
  alumniAPI,
  communityAPI,
  eventAPI,
  jobAPI,
  newsAPI,
} from "@/lib/api";
import { useNavigate } from "react-router-dom";
import MentorshipActionMenu from "@/components/mentorship/MentorshipActionMenu";
import EditMentorshipDialog from "@/components/dialogs/EditMentorshipDialog";
import DeleteMentorshipDialog from "@/components/dialogs/DeleteMentorshipDialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

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
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalJobs: 0,
    totalCommunities: 0,
    totalMentorships: 0,
    totalDonations: 0,
    totalCampaigns: 0,
    myRegistrations: 0,
    myConnections: 0,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [myActivity, setMyActivity] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [featuredAlumni, setFeaturedAlumni] = useState<any[]>([]);

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
  const fetchRecentData = async () => {
    setLoading(true);
    try {
      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();
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

      // Fetch total events count
      const eventsCountResponse = await fetch(`${baseUrl}/events`, {
        headers,
      });
      if (eventsCountResponse.ok) {
        const eventsCountData = await eventsCountResponse.json();
        const totalEvents =
          eventsCountData.data?.pagination?.total ||
          eventsCountData.data?.events?.length ||
          0;
        setStats((prev) => ({ ...prev, totalEvents }));
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
      const galleriesResponse = await fetch(
        `${baseUrl}/gallery?limit=8&tenantId=${user?.tenantId || ""}`,
        {
          headers,
        }
      );
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
        const totalCommunities = Array.isArray(communitiesData.data)
          ? communitiesData.data.length
          : 0;
        setStats((prev) => ({ ...prev, totalCommunities }));
      }

      // Fetch recent mentorships
      const mentorshipsResponse = await fetch(
        `${baseUrl}/mentorship?limit=8&tenantId=${user?.tenantId || ""}`,
        { headers }
      );
      if (mentorshipsResponse.ok) {
        const mentorshipsData = await mentorshipsResponse.json();
        const mentorships = mentorshipsData.data?.mentorships || [];
        setRecentMentorships(mentorships);
        const totalMentorships =
          mentorshipsData.data?.pagination?.total || mentorships.length || 0;
        setStats((prev) => ({ ...prev, totalMentorships }));
      }

      // Fetch recent jobs
      const jobsResponse = await fetch(`${baseUrl}/jobs?limit=8`, {
        headers,
      });
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setRecentJobs(jobsData.data?.jobs || []);
      }

      // Fetch total jobs count
      const jobsCountResponse = await fetch(`${baseUrl}/jobs`, {
        headers,
      });
      if (jobsCountResponse.ok) {
        const jobsCountData = await jobsCountResponse.json();
        const totalJobs =
          jobsCountData.data?.pagination?.total ||
          jobsCountData.data?.jobs?.length ||
          0;
        setStats((prev) => ({ ...prev, totalJobs }));
      }

      // Fetch recent campaigns
      const campaignsResponse = await fetch(`${baseUrl}/campaigns?limit=8`, {
        headers,
      });
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        const campaigns =
          campaignsData.data?.campaigns || campaignsData.data || [];
        setRecentCampaigns(campaigns);
        const totalCampaigns = Array.isArray(campaigns) ? campaigns.length : 0;
        setStats((prev) => ({ ...prev, totalCampaigns }));
      }

      // Fetch total donations
      const donationsResponse = await fetch(`${baseUrl}/donations?limit=1`, {
        headers,
      });
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json();
        const totalDonations =
          donationsData.data?.pagination?.total ||
          donationsData.data?.donations?.length ||
          0;
        setStats((prev) => ({ ...prev, totalDonations }));
      }

      // Fetch my event registrations
      if (user?._id) {
        const myRegistrationsResponse = await fetch(
          `${baseUrl}/events?userId=${user._id}`,
          { headers }
        );
        if (myRegistrationsResponse.ok) {
          const myRegData = await myRegistrationsResponse.json();
          let myRegCount = 0;
          if (myRegData.data?.events) {
            myRegData.data.events.forEach((event: any) => {
              if (event.attendees?.some((a: any) => a.userId === user._id)) {
                myRegCount++;
              }
            });
          }
          setStats((prev) => ({ ...prev, myRegistrations: myRegCount }));
        }
      }

      // Fetch recent mentorship programs
      const mentorshipProgramsResponse = await fetch(
        `${baseUrl}/mentorship?limit=8&tenantId=${user?.tenantId || ""}`,
        {
          headers,
        }
      );
      if (mentorshipProgramsResponse.ok) {
        const mentorshipProgramsData = await mentorshipProgramsResponse.json();
        setRecentMentorshipPrograms(
          mentorshipProgramsData.data?.mentorships ||
            mentorshipProgramsData.data ||
            []
        );
      }

      // Fetch alumni list for sidebar
      try {
        const alumniResponse = (await alumniAPI.getAllUsersDirectory({
          limit: 10,
          tenantId: user?.tenantId,
          userType: "alumni",
        })) as any;
        if (alumniResponse.success && alumniResponse.data?.users) {
          setAlumniList(alumniResponse.data.users);
        }
      } catch (error) {
        console.error("Error fetching alumni list:", error);
      }

      // Fetch saved items (Events, Jobs, News)
      try {
        const [savedEventsRes, savedJobsRes, savedNewsRes] = await Promise.all([
          eventAPI.getSavedEvents().catch(() => ({
            success: false,
            data: { events: [] },
          })) as Promise<{ success: boolean; data?: { events?: any[] } }>,
          jobAPI.getSavedJobs({ page: 1, limit: 3 }).catch(() => ({
            success: false,
            data: { jobs: [] },
          })) as Promise<{
            success: boolean;
            data?: { jobs?: any[] };
          }>,
          newsAPI.getSavedNews({ page: 1, limit: 3 }).catch(() => ({
            success: false,
            data: { savedNews: [] },
          })) as Promise<{ success: boolean; data?: { savedNews?: any[] } }>,
        ]);

        const allSaved: any[] = [];

        // Process saved events
        if (savedEventsRes.success && savedEventsRes.data?.events) {
          savedEventsRes.data.events.forEach((event: any) => {
            if (event && event._id) {
              allSaved.push({
                _id: event._id,
                title: event.title || event.name || "Untitled Event",
                type: "event",
                savedAt: event.savedAt || event.createdAt || new Date(),
              });
            }
          });
        }

        // Process saved jobs
        if (savedJobsRes.success && savedJobsRes.data?.jobs) {
          savedJobsRes.data.jobs.forEach((job: any) => {
            if (job && job._id) {
              allSaved.push({
                _id: job._id,
                title: job.title || job.position || job.name || "Untitled Job",
                type: "job",
                savedAt: job.savedAt || job.createdAt || new Date(),
              });
            }
          });
        }

        // Process saved news (newsId is populated)
        if (savedNewsRes.success && savedNewsRes.data?.savedNews) {
          savedNewsRes.data.savedNews.forEach((savedNewsItem: any) => {
            // SavedNews document has newsId populated - handle null newsId (deleted news)
            const news = savedNewsItem.newsId;
            if (news && news._id) {
              allSaved.push({
                _id: news._id,
                title: news.title || news.name || "Untitled News",
                type: "news",
                savedAt:
                  savedNewsItem.createdAt || news.createdAt || new Date(),
              });
            }
          });
        }

        // Sort by saved date and limit to 5
        allSaved.sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
        setSavedItems(allSaved.slice(0, 5));

        // Generate activity feed from real user data
        const activities: any[] = [];

        // Add event registrations as activities
        if (recentEvents.length > 0 && user?._id) {
          recentEvents.forEach((event: any) => {
            if (event.attendees && Array.isArray(event.attendees)) {
              const userRegistration = event.attendees.find(
                (a: any) =>
                  a.userId === user._id ||
                  a.userId?.toString() === user._id?.toString()
              );
              if (userRegistration && userRegistration.registeredAt) {
                const regDate = new Date(userRegistration.registeredAt);
                const timeAgo = formatTimeAgo(regDate);
                activities.push({
                  id: `event-${event._id}`,
                  type: "event",
                  action: "registered for",
                  title: event.title || "an event",
                  time: timeAgo,
                  icon: Calendar,
                  link: `/events/${event._id}`,
                });
              }
            }
          });
        }

        // Add community memberships as activities
        if (recentCommunities.length > 0 && user?._id) {
          recentCommunities.slice(0, 3).forEach((community: any) => {
            // Check if user is a member (you might need to add this check)
            if (community.memberCount > 0) {
              const joinDate = community.createdAt
                ? new Date(community.createdAt)
                : new Date();
              const timeAgo = formatTimeAgo(joinDate);
              activities.push({
                id: `community-${community._id}`,
                type: "community",
                action: "joined",
                title: community.name || "a community",
                time: timeAgo,
                icon: Users,
                link: `/community/${community._id}`,
              });
            }
          });
        }

        // Add saved items as activities
        if (allSaved.length > 0) {
          allSaved.slice(0, 3).forEach((item: any, index: number) => {
            const savedDate = item.savedAt
              ? new Date(item.savedAt)
              : new Date();
            const timeAgo = formatTimeAgo(savedDate);
            let itemLink = "";
            if (item.type === "event") itemLink = `/events/${item._id}`;
            else if (item.type === "job") itemLink = `/jobs/${item._id}`;
            else if (item.type === "news") itemLink = `/news/${item._id}`;

            activities.push({
              id: `saved-${item._id || index}`,
              type: "saved",
              action: "saved",
              title: item.title || item.name || "an item",
              time: timeAgo,
              icon: Bookmark,
              link: itemLink,
            });
          });
        }

        // Sort by time (most recent first) and limit to 5
        activities.sort((a, b) => {
          const timeA = a.time || "";
          const timeB = b.time || "";
          return timeB.localeCompare(timeA);
        });
        setMyActivity(activities.slice(0, 5));
      } catch (error) {
        console.error("Error fetching saved items:", error);
      }

      // Fetch trending tags from communities (after communities are fetched)
      try {
        const topCommunitiesRes = (await communityAPI.getTopCommunities(5)) as {
          success: boolean;
          data?: any[];
        };
        if (
          topCommunitiesRes.success &&
          topCommunitiesRes.data &&
          Array.isArray(topCommunitiesRes.data) &&
          topCommunitiesRes.data.length > 0
        ) {
          const allTags: any[] = [];
          for (const community of topCommunitiesRes.data.slice(0, 3)) {
            try {
              const tagsResponse = (await communityAPI.getPopularTags(
                community._id,
                5
              )) as { success: boolean; data?: any[] };
              if (
                tagsResponse.success &&
                tagsResponse.data &&
                Array.isArray(tagsResponse.data)
              ) {
                allTags.push(...tagsResponse.data);
              }
            } catch (err) {
              // Continue if one fails
            }
          }
          // Remove duplicates and sort by count
          const uniqueTags = Array.from(
            new Map(allTags.map((tag) => [tag.tag || tag.name, tag])).values()
          );
          setTrendingTags(uniqueTags.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching trending tags:", error);
      }

      // Fetch featured alumni (mentors or top alumni)
      try {
        const mentorsResponse = (await alumniAPI.getMentors({ limit: 5 })) as {
          success: boolean;
          data?: { alumni?: any[] } | any[];
        };
        if (mentorsResponse.success) {
          if (
            mentorsResponse.data &&
            "alumni" in mentorsResponse.data &&
            Array.isArray(mentorsResponse.data.alumni)
          ) {
            setFeaturedAlumni(mentorsResponse.data.alumni);
          } else if (Array.isArray(mentorsResponse.data)) {
            setFeaturedAlumni(mentorsResponse.data);
          }
        }
      } catch (error) {
        // Fallback to top alumni
        try {
          const topAlumniResponse = (await alumniAPI.getAllUsersDirectory({
            limit: 5,
            tenantId: user?.tenantId,
            userType: "alumni",
          })) as { success: boolean; data?: { users?: any[] } };
          if (topAlumniResponse.success && topAlumniResponse.data?.users) {
            setFeaturedAlumni(topAlumniResponse.data.users);
          }
        } catch (err) {
          console.error("Error fetching featured alumni:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching recent data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    // Navigate to gallery page (gallery uses modal dialogs, not detail routes)
    navigate(`/gallery`);
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

  // Helper function to map events to calendar dates
  const getEventsByDate = () => {
    const eventsMap = new Map<string, any[]>();
    recentEvents.forEach((event) => {
      const eventDate = new Date(event.startDate || event.date);
      const dateKey = eventDate.toISOString().split("T")[0];
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)!.push(event);
    });
    return eventsMap;
  };

  // Calendar navigation handlers
  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  // Check if a date has events
  const dateHasEvents = (date: Date): boolean => {
    const eventsMap = getEventsByDate();
    const dateKey = date.toISOString().split("T")[0];
    return eventsMap.has(dateKey);
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): any[] => {
    const eventsMap = getEventsByDate();
    const dateKey = date.toISOString().split("T")[0];
    return eventsMap.get(dateKey) || [];
  };

  // Handle date click to navigate to first event or events page
  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;
    const eventsForDate = getEventsForDate(date);
    if (eventsForDate.length > 0) {
      // Navigate directly to the first event's detail page
      handleEventClick(eventsForDate[0]._id);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 lg:p-6 pt-16">
      <div className="w-full space-y-6">
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Events
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    Available events
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    My Registrations
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.myRegistrations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Events registered
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Jobs
                  </CardTitle>
                  <Briefcase className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    Job opportunities
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Communities
                  </CardTitle>
                  <Users className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalCommunities}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active communities
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mentorships
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalMentorships}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available programs
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Campaigns
                  </CardTitle>
                  <Target className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalCampaigns}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active campaigns
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-pink-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Donations
                  </CardTitle>
                  <HeartHandshake className="h-4 w-4 text-pink-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalDonations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total donations
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-cyan-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Connections
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.myConnections}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    My connections
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 70-30 Split Layout Starting from Recent Events */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Main Content Area - 70% */}
              <div className="lg:col-span-7 space-y-6">
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
                                  <span className="truncate">
                                    {event.location}
                                  </span>
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
                                  {news.author?.firstName}{" "}
                                  {news.author?.lastName}
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
                      <CardTitle className="text-lg">
                        Active Mentorships{" "}
                      </CardTitle>
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
                                  onEdit={() =>
                                    handleEditMentorship(mentorship)
                                  }
                                  onDelete={() =>
                                    handleDeleteMentorship(mentorship)
                                  }
                                />
                              </div>
                            </div>
                            <div
                              className="p-3 cursor-pointer"
                              onClick={() =>
                                handleMentorshipClick(mentorship._id)
                              }
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
                                    src={
                                      campaign.imageUrl || campaign.images[0]
                                    }
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
              {/* Sidebar - 30% */}
              <div className="lg:col-span-3 space-y-6">
                {/* Calendar View */}
                <div className="bg-white border rounded-lg">
                  <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Events Calendar
                      </h2>
                    </div>
                    <button
                      onClick={handleToday}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                    >
                      <span>Today</span>
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousMonth}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        {currentMonth.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextMonth}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <CalendarComponent
                      mode="single"
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      onDayClick={handleDateClick}
                      modifiers={{
                        hasEvents: (date) => dateHasEvents(date),
                      }}
                      modifiersClassNames={{
                        hasEvents:
                          "bg-blue-100 text-blue-700 font-semibold cursor-pointer hover:bg-blue-200",
                      }}
                      className="rounded-md w-full"
                      classNames={{
                        months: "flex flex-col space-y-0 w-full",
                        month: "space-y-0 w-full",
                        caption:
                          "flex justify-center pt-0 relative items-center mb-1 w-full",
                        caption_label: "hidden",
                        nav: "hidden",
                        nav_button: "hidden",
                        nav_button_previous: "hidden",
                        nav_button_next: "hidden",
                        table: "w-full border-collapse",
                        head_row: "flex w-full",
                        head_cell:
                          "text-muted-foreground rounded-md w-[calc(100%/7)] font-normal text-xs p-0 text-center",
                        row: "flex w-full mt-1",
                        cell: "h-7 w-[calc(100%/7)] text-center text-xs p-0 relative flex items-center justify-center",
                        day: "h-7 w-full p-0 font-normal aria-selected:opacity-100 text-xs cursor-pointer leading-none flex items-center justify-center",
                        day_today: "bg-blue-50 text-blue-900 font-semibold",
                      }}
                      components={{
                        IconLeft: () => null,
                        IconRight: () => null,
                      }}
                    />
                  </div>
                </div>

                {/* Alumni List */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        Alumni
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAll("alumni")}
                        className="h-7 text-xs"
                      >
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {alumniList.length > 0 ? (
                      <div className="space-y-3">
                        {alumniList.map((alumnus: any) => {
                          const displayName =
                            alumnus.name ||
                            `${alumnus.firstName || ""} ${
                              alumnus.lastName || ""
                            }`.trim() ||
                            "Alumni";
                          const profileImage =
                            alumnus.profileImage || alumnus.profilePicture;
                          const graduationYear =
                            alumnus.graduationYear || alumnus.batchYear;
                          const department = alumnus.department;

                          return (
                            <div
                              key={alumnus.id || alumnus._id}
                              onClick={() =>
                                navigate(`/alumni/${alumnus.id || alumnus._id}`)
                              }
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="flex-shrink-0">
                                {profileImage ? (
                                  <img
                                    src={profileImage}
                                    alt={displayName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {displayName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                  {graduationYear && (
                                    <span>Class of {graduationYear}</span>
                                  )}
                                  {graduationYear && department && (
                                    <span>•</span>
                                  )}
                                  {department && (
                                    <span className="truncate">
                                      {department}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No alumni found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trending Topics/Hashtags */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-base font-semibold">
                          Trending Topics
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {trendingTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {trendingTags
                          .slice(0, 8)
                          .map((tag: any, index: number) => (
                            <Badge
                              key={tag.tag || tag.name || index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors text-xs px-2 py-1"
                              onClick={() => {
                                // Navigate to communities with this tag
                                navigate(
                                  `/community?tag=${encodeURIComponent(
                                    tag.tag || tag.name
                                  )}`
                                );
                              }}
                            >
                              #{tag.tag || tag.name}
                              {tag.count && (
                                <span className="ml-1 text-xs opacity-70">
                                  ({tag.count})
                                </span>
                              )}
                            </Badge>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Hash className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No trending topics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* My Activity Feed */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-base font-semibold">
                          My Activity
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myActivity.length > 0 ? (
                      <div className="space-y-3">
                        {myActivity.map((activity) => {
                          const IconComponent = activity.icon || Activity;
                          return (
                            <div
                              key={activity.id}
                              onClick={() => {
                                if (activity.link) {
                                  navigate(activity.link);
                                }
                              }}
                              className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                                activity.link
                                  ? "hover:bg-gray-50 cursor-pointer"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <IconComponent className="h-4 w-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900">
                                  You{" "}
                                  <span className="font-medium">
                                    {activity.action}
                                  </span>{" "}
                                  <span
                                    className={`${
                                      activity.link
                                        ? "text-blue-600 hover:underline"
                                        : "text-blue-600"
                                    }`}
                                  >
                                    {activity.title}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {activity.time}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Activity className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bookmarked/Saved Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-base font-semibold">
                          Saved Items
                        </CardTitle>
                      </div>
                      {savedItems.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/saved")}
                          className="h-7 text-xs"
                        >
                          View All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {savedItems.length > 0 ? (
                      <div className="space-y-2">
                        {savedItems.slice(0, 5).map((item: any) => {
                          const getIcon = () => {
                            if (item.type === "event") return Calendar;
                            if (item.type === "job") return Briefcase;
                            if (item.type === "gallery") return ImageIcon;
                            return MessageSquare;
                          };
                          const IconComponent = getIcon();
                          const handleClick = () => {
                            if (item.type === "event")
                              navigate(`/events/${item._id}`);
                            else if (item.type === "job")
                              navigate(`/jobs/${item._id}`);
                            else if (item.type === "news")
                              navigate(`/news/${item._id}`);
                            // Gallery doesn't have detail pages - navigate to gallery page
                            else if (item.type === "gallery")
                              navigate(`/gallery`);
                          };
                          return (
                            <div
                              key={item._id}
                              onClick={handleClick}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <IconComponent className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600">
                                  {item.title || item.name}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {item.type === "gallery"
                                    ? "Gallery"
                                    : item.type}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Bookmark className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No saved items</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Featured Alumni/Spotlight */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-base font-semibold">
                          Featured Alumni
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {featuredAlumni.length > 0 ? (
                      <div className="space-y-2">
                        {featuredAlumni.slice(0, 5).map((alumnus: any) => {
                          const displayName =
                            alumnus.name ||
                            `${alumnus.firstName || ""} ${
                              alumnus.lastName || ""
                            }`.trim() ||
                            "Alumni";
                          const profileImage =
                            alumnus.profileImage || alumnus.profilePicture;
                          return (
                            <div
                              key={alumnus.id || alumnus._id}
                              onClick={() =>
                                navigate(`/alumni/${alumnus.id || alumnus._id}`)
                              }
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                            >
                              <div className="flex-shrink-0">
                                {profileImage ? (
                                  <img
                                    src={profileImage}
                                    alt={displayName}
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600">
                                  {displayName}
                                </p>
                                {(alumnus.currentRole || alumnus.company) && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {alumnus.currentRole || alumnus.company}
                                  </p>
                                )}
                              </div>
                              <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Star className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No featured alumni</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ShareIcon className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-base font-semibold">
                        Follow Us
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                      >
                        <Facebook className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-gray-700 group-hover:text-blue-600">
                          Facebook
                        </span>
                      </a>
                      <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-sky-50 cursor-pointer transition-colors group"
                      >
                        <Twitter className="h-4 w-4 text-sky-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-gray-700 group-hover:text-sky-600">
                          Twitter
                        </span>
                      </a>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                      >
                        <Linkedin className="h-4 w-4 text-blue-700 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-gray-700 group-hover:text-blue-700">
                          LinkedIn
                        </span>
                      </a>
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-pink-50 cursor-pointer transition-colors group"
                      >
                        <Instagram className="h-4 w-4 text-pink-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-gray-700 group-hover:text-pink-600">
                          Instagram
                        </span>
                      </a>
                      <a
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors group col-span-2"
                      >
                        <Youtube className="h-4 w-4 text-red-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-gray-700 group-hover:text-red-600">
                          YouTube
                        </span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
