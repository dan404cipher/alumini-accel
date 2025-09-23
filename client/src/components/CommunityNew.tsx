import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  X,
  Menu,
  Users2,
  Users,
  Plus,
  Heart,
  MessageCircle,
  Clock,
  Eye,
  ThumbsUp,
  Share2,
  Filter,
  Calendar,
  MapPin,
  GraduationCap,
  Building,
  Star,
  TrendingUp,
  BookOpen,
  Globe,
  Zap,
  Briefcase,
  UserPlus,
  Settings,
  Pin,
  Flag,
  MoreVertical,
  Trash2,
  Megaphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Interfaces for Community features
interface Community {
  _id: string;
  name: string;
  description: string;
  category:
    | "department"
    | "batch"
    | "interest"
    | "professional"
    | "location"
    | "other";
  banner?: string;
  logo?: string;
  isPublic: boolean;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  admins: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }>;
  members: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }>;
  pendingRequests: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }>;
  rules?: string[];
  tags: string[];
  memberCount: number;
  postCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommunityPost {
  _id: string;
  title?: string;
  content: string;
  type: "text" | "image" | "file" | "link" | "poll" | "event";
  attachments?: Array<{
    type: "image" | "file" | "link";
    url: string;
    filename?: string;
    size?: number;
  }>;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  likes: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
  comments: Array<{
    _id: string;
    content: string;
    author: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
  tags: string[];
  isPinned: boolean;
  isAnnouncement: boolean;
  createdAt: string;
  updatedAt: string;
}

const CommunityNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState("communities");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form dialog states
  const [communityDialogOpen, setCommunityDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);

  // Form states
  const [communityForm, setCommunityForm] = useState({
    name: "",
    description: "",
    category: "",
    isPublic: true,
    rules: [] as string[],
    tags: [] as string[],
  });

  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    type: "text" as "text" | "image" | "file" | "link" | "poll" | "event",
    tags: [] as string[],
    poll: {
      question: "",
      options: ["", ""],
      allowMultiple: false,
      expiresAt: "",
    },
    event: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      isOnline: false,
      maxAttendees: "",
    },
  });

  // Data states
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null
  );
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityDetails, setCommunityDetails] = useState<Community | null>(
    null
  );

  const categories = [
    { id: "all", name: "All Categories", icon: Globe },
    { id: "department", name: "Department", icon: Building },
    { id: "batch", name: "Batch", icon: GraduationCap },
    { id: "interest", name: "Interest", icon: Heart },
    { id: "professional", name: "Professional", icon: Briefcase },
    { id: "location", name: "Location", icon: MapPin },
    { id: "other", name: "Other", icon: Star },
  ];

  // API Functions
  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCommunities(data.data.communities);
      } else {
        setError("Failed to fetch communities");
      }
    } catch (err) {
      setError("Failed to fetch communities");
      console.error("Error fetching communities:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  const fetchCommunityPosts = useCallback(async (communityId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${communityId}/posts`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCommunityPosts(data.data.posts);
      } else {
        setError("Failed to fetch community posts");
      }
    } catch (err) {
      setError("Failed to fetch community posts");
      console.error("Error fetching community posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommunityDetails = useCallback(async (communityId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${communityId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCommunityDetails(data.data.community);
      } else {
        setError("Failed to fetch community details");
      }
    } catch (err) {
      setError("Failed to fetch community details");
      console.error("Error fetching community details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when component mounts or filters change
  useEffect(() => {
    if (activeTab === "communities") {
      fetchCommunities();
    }
  }, [activeTab, selectedCategory, searchQuery, fetchCommunities]);

  const handleCreateCommunity = async () => {
    try {
      if (
        !communityForm.name ||
        !communityForm.description ||
        !communityForm.category
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(communityForm),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Community Created",
          description: "Your community has been created successfully!",
        });
        setCommunityDialogOpen(false);
        setCommunityForm({
          name: "",
          description: "",
          category: "",
          isPublic: true,
          rules: [],
          tags: [],
        });
        fetchCommunities(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description:
            data.message || "Failed to create community. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${communityId}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchCommunities(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to join community.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to join community. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${communityId}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchCommunities(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to leave community.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to leave community. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!selectedCommunity) {
      toast({
        title: "Error",
        description: "Please select a community first.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!postForm.content) {
        toast({
          title: "Missing Information",
          description: "Please provide post content.",
          variant: "destructive",
        });
        return;
      }

      const postData: {
        title: string;
        content: string;
        type: string;
        tags: string[];
        poll?: {
          question: string;
          options: { text: string; votes: string[] }[];
          allowMultiple: boolean;
          expiresAt?: Date;
        };
        event?: {
          title: string;
          description: string;
          startDate: Date;
          endDate?: Date;
          location: string;
          isOnline: boolean;
          maxAttendees?: number;
          attendees: string[];
        };
      } = {
        title: postForm.title,
        content: postForm.content,
        type: postForm.type,
        tags: postForm.tags,
      };

      // Add poll data if it's a poll post
      if (postForm.type === "poll") {
        const validOptions = postForm.poll.options.filter(
          (opt) => opt.trim() !== ""
        );
        if (!postForm.poll.question || validOptions.length < 2) {
          toast({
            title: "Missing Information",
            description: "Please provide poll question and at least 2 options.",
            variant: "destructive",
          });
          return;
        }
        postData.poll = {
          question: postForm.poll.question,
          options: validOptions.map((opt) => ({ text: opt, votes: [] })),
          allowMultiple: postForm.poll.allowMultiple,
          expiresAt: postForm.poll.expiresAt
            ? new Date(postForm.poll.expiresAt)
            : undefined,
        };
      }

      // Add event data if it's an event post
      if (postForm.type === "event") {
        if (
          !postForm.event.title ||
          !postForm.event.description ||
          !postForm.event.startDate
        ) {
          toast({
            title: "Missing Information",
            description:
              "Please provide event title, description, and start date.",
            variant: "destructive",
          });
          return;
        }
        postData.event = {
          title: postForm.event.title,
          description: postForm.event.description,
          startDate: new Date(postForm.event.startDate),
          endDate: postForm.event.endDate
            ? new Date(postForm.event.endDate)
            : undefined,
          location: postForm.event.location,
          isOnline: postForm.event.isOnline,
          maxAttendees: postForm.event.maxAttendees
            ? parseInt(postForm.event.maxAttendees)
            : undefined,
          attendees: [],
        };
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${selectedCommunity._id}/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(postData),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Post Created",
          description: "Your post has been created successfully!",
        });
        setPostDialogOpen(false);
        setPostForm({
          title: "",
          content: "",
          type: "text",
          tags: [],
          poll: {
            question: "",
            options: ["", ""],
            allowMultiple: false,
            expiresAt: "",
          },
          event: {
            title: "",
            description: "",
            startDate: "",
            endDate: "",
            location: "",
            isOnline: false,
            maxAttendees: "",
          },
        });
        fetchCommunityPosts(selectedCommunity._id); // Refresh posts
      } else {
        toast({
          title: "Error",
          description:
            data.message || "Failed to create post. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewCommunity = (community: Community) => {
    setSelectedCommunity(community);
    setActiveTab("posts");
    fetchCommunityPosts(community._id);
    fetchCommunityDetails(community._id);
  };

  const handleApproveJoinRequest = async (userId: string) => {
    if (!selectedCommunity) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${selectedCommunity._id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Join request approved successfully!",
        });
        fetchCommunityDetails(selectedCommunity._id); // Refresh community details
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to approve join request.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve join request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedCommunity) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${selectedCommunity._id}/remove-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Member removed successfully!",
        });
        fetchCommunityDetails(selectedCommunity._id); // Refresh community details
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to remove member.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!selectedCommunity) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/${selectedCommunity._id}/promote-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Member promoted to admin successfully!",
        });
        fetchCommunityDetails(selectedCommunity._id); // Refresh community details
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to promote member.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to promote member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePostPin = async (postId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/posts/${postId}/pin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        if (selectedCommunity) {
          fetchCommunityPosts(selectedCommunity._id); // Refresh posts
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to toggle post pin.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to toggle post pin. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePostAnnouncement = async (postId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/posts/${postId}/announcement`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        if (selectedCommunity) {
          fetchCommunityPosts(selectedCommunity._id); // Refresh posts
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to toggle post announcement.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to toggle post announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Post deleted successfully!",
        });
        if (selectedCommunity) {
          fetchCommunityPosts(selectedCommunity._id); // Refresh posts
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete post.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper functions for poll options
  const addPollOption = () => {
    setPostForm((prev) => ({
      ...prev,
      poll: {
        ...prev.poll,
        options: [...prev.poll.options, ""],
      },
    }));
  };

  const removePollOption = (index: number) => {
    if (postForm.poll.options.length > 2) {
      setPostForm((prev) => ({
        ...prev,
        poll: {
          ...prev.poll,
          options: prev.poll.options.filter((_, i) => i !== index),
        },
      }));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPostForm((prev) => ({
      ...prev,
      poll: {
        ...prev.poll,
        options: prev.poll.options.map((opt, i) => (i === index ? value : opt)),
      },
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryIcon = (category: string) => {
    const categoryObj = categories.find((cat) => cat.id === category);
    return categoryObj ? categoryObj.icon : Globe;
  };

  const isUserMember = (community: Community) => {
    if (!user) return false;
    return community.members.some((member) => member._id === user._id);
  };

  const isUserAdmin = (community: Community) => {
    if (!user) return false;
    return (
      community.admins.some((admin) => admin._id === user._id) ||
      community.owner._id === user._id
    );
  };

  return (
    <div className="flex gap-6 h-screen w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-background shadow-xl">
            <div className="sticky top-0 h-screen overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Card className="h-fit">
                <CardContent className="p-6">
                  {/* Search */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-semibold">
                      Search Communities
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search communities..."
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

                  {/* Categories */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-semibold">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        const isActive = selectedCategory === category.id;

                        return (
                          <Button
                            key={category.id}
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.id)}
                            className="w-full justify-start"
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {category.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-sm font-semibold">Quick Actions</h3>
                    <div className="space-y-2">
                      <Dialog
                        open={communityDialogOpen}
                        onOpenChange={setCommunityDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full justify-start"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Community
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Create a Community</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="community-name">
                                Community Name *
                              </Label>
                              <Input
                                id="community-name"
                                placeholder="Enter community name..."
                                value={communityForm.name}
                                onChange={(e) =>
                                  setCommunityForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="community-description">
                                Description *
                              </Label>
                              <Textarea
                                id="community-description"
                                placeholder="Describe your community..."
                                rows={3}
                                value={communityForm.description}
                                onChange={(e) =>
                                  setCommunityForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="community-category">
                                  Category *
                                </Label>
                                <Select
                                  value={communityForm.category}
                                  onValueChange={(value) =>
                                    setCommunityForm((prev) => ({
                                      ...prev,
                                      category: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="department">
                                      Department
                                    </SelectItem>
                                    <SelectItem value="batch">Batch</SelectItem>
                                    <SelectItem value="interest">
                                      Interest
                                    </SelectItem>
                                    <SelectItem value="professional">
                                      Professional
                                    </SelectItem>
                                    <SelectItem value="location">
                                      Location
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="community-visibility">
                                  Visibility
                                </Label>
                                <Select
                                  value={
                                    communityForm.isPublic
                                      ? "public"
                                      : "private"
                                  }
                                  onValueChange={(value) =>
                                    setCommunityForm((prev) => ({
                                      ...prev,
                                      isPublic: value === "public",
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select visibility" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="public">
                                      Public
                                    </SelectItem>
                                    <SelectItem value="private">
                                      Private
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setCommunityDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleCreateCommunity}>
                                Create Community
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 flex-shrink-0 bg-background">
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <Card className="h-fit">
            <CardContent className="p-6">
              {/* Search */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold">Search Communities</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search communities..."
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

              {/* Categories */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;

                    return (
                      <Button
                        key={category.id}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="w-full justify-start"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {category.name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <div className="space-y-2">
                  <Dialog
                    open={communityDialogOpen}
                    onOpenChange={setCommunityDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Community
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Create a Community</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sidebar-community-name">
                            Community Name *
                          </Label>
                          <Input
                            id="sidebar-community-name"
                            placeholder="Enter community name..."
                            value={communityForm.name}
                            onChange={(e) =>
                              setCommunityForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="sidebar-community-description">
                            Description *
                          </Label>
                          <Textarea
                            id="sidebar-community-description"
                            placeholder="Describe your community..."
                            rows={3}
                            value={communityForm.description}
                            onChange={(e) =>
                              setCommunityForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sidebar-community-category">
                              Category *
                            </Label>
                            <Select
                              value={communityForm.category}
                              onValueChange={(value) =>
                                setCommunityForm((prev) => ({
                                  ...prev,
                                  category: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="department">
                                  Department
                                </SelectItem>
                                <SelectItem value="batch">Batch</SelectItem>
                                <SelectItem value="interest">
                                  Interest
                                </SelectItem>
                                <SelectItem value="professional">
                                  Professional
                                </SelectItem>
                                <SelectItem value="location">
                                  Location
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="sidebar-community-visibility">
                              Visibility
                            </Label>
                            <Select
                              value={
                                communityForm.isPublic ? "public" : "private"
                              }
                              onValueChange={(value) =>
                                setCommunityForm((prev) => ({
                                  ...prev,
                                  isPublic: value === "public",
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setCommunityDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreateCommunity}>
                            Create Community
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
              <h1 className="text-2xl lg:text-3xl font-bold">Communities</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Connect with alumni through shared interests, departments, and
                experiences
              </p>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading communities...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Community Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="communities"
              className="flex items-center gap-2"
            >
              <Users2 className="w-4 h-4" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities" className="space-y-4">
            {communities.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Users2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No communities yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Be the first to create a community!
                </p>
                <Dialog
                  open={communityDialogOpen}
                  onOpenChange={setCommunityDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Community
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create a Community</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="empty-title">Community Name *</Label>
                        <Input
                          id="empty-title"
                          placeholder="Enter community name..."
                          value={communityForm.name}
                          onChange={(e) =>
                            setCommunityForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="empty-description">Description *</Label>
                        <Textarea
                          id="empty-description"
                          placeholder="Describe your community..."
                          rows={3}
                          value={communityForm.description}
                          onChange={(e) =>
                            setCommunityForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="empty-category">Category *</Label>
                          <Select
                            value={communityForm.category}
                            onValueChange={(value) =>
                              setCommunityForm((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="department">
                                Department
                              </SelectItem>
                              <SelectItem value="batch">Batch</SelectItem>
                              <SelectItem value="interest">Interest</SelectItem>
                              <SelectItem value="professional">
                                Professional
                              </SelectItem>
                              <SelectItem value="location">Location</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="empty-visibility">Visibility</Label>
                          <Select
                            value={
                              communityForm.isPublic ? "public" : "private"
                            }
                            onValueChange={(value) =>
                              setCommunityForm((prev) => ({
                                ...prev,
                                isPublic: value === "public",
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setCommunityDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCommunity}>
                          Create Community
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {communities.map((community) => {
                  const CategoryIcon = getCategoryIcon(community.category);
                  const isMember = isUserMember(community);
                  const isAdmin = isUserAdmin(community);

                  return (
                    <Card
                      key={community._id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewCommunity(community)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <CategoryIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {community.name}
                                </h3>
                                <Badge
                                  variant={
                                    community.isPublic ? "default" : "secondary"
                                  }
                                >
                                  {community.isPublic ? "Public" : "Private"}
                                </Badge>
                                {isAdmin && (
                                  <Badge variant="outline" className="text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 mb-2">
                                {community.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                <span>
                                  by {community.owner.firstName}{" "}
                                  {community.owner.lastName}
                                </span>
                                <span>•</span>
                                <span>{formatDate(community.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users2 className="w-4 h-4" />
                                  {community.memberCount} members
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  {community.postCount} posts
                                </div>
                                <div className="flex items-center gap-1">
                                  <CategoryIcon className="w-4 h-4" />
                                  {community.category}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {community.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {community.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{community.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isMember ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveCommunity(community._id);
                                }}
                              >
                                Leave
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinCommunity(community._id);
                                }}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Join
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCommunity(community);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {selectedCommunity ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("communities")}
                    >
                      ← Back to Communities
                    </Button>
                    <Dialog
                      open={postDialogOpen}
                      onOpenChange={setPostDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create a Post</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Post Type Selection */}
                          <div>
                            <Label htmlFor="header-post-type">Post Type</Label>
                            <Select
                              value={postForm.type}
                              onValueChange={(
                                value:
                                  | "text"
                                  | "image"
                                  | "file"
                                  | "link"
                                  | "poll"
                                  | "event"
                              ) =>
                                setPostForm((prev) => ({
                                  ...prev,
                                  type: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select post type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text Post</SelectItem>
                                <SelectItem value="image">
                                  Image Post
                                </SelectItem>
                                <SelectItem value="file">File Post</SelectItem>
                                <SelectItem value="link">Link Post</SelectItem>
                                <SelectItem value="poll">Poll</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Post Title */}
                          <div>
                            <Label htmlFor="header-post-title">
                              Title (Optional)
                            </Label>
                            <Input
                              id="header-post-title"
                              placeholder="Enter post title..."
                              value={postForm.title}
                              onChange={(e) =>
                                setPostForm((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Post Content */}
                          <div>
                            <Label htmlFor="header-post-content">
                              Content *
                            </Label>
                            <Textarea
                              id="header-post-content"
                              placeholder="What's on your mind?"
                              rows={4}
                              value={postForm.content}
                              onChange={(e) =>
                                setPostForm((prev) => ({
                                  ...prev,
                                  content: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Poll Section */}
                          {postForm.type === "poll" && (
                            <div className="space-y-4 border rounded-lg p-4">
                              <h3 className="font-semibold">Poll Details</h3>
                              <div>
                                <Label htmlFor="header-poll-question">
                                  Poll Question *
                                </Label>
                                <Input
                                  id="header-poll-question"
                                  placeholder="What would you like to ask?"
                                  value={postForm.poll.question}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      poll: {
                                        ...prev.poll,
                                        question: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label>Poll Options *</Label>
                                {postForm.poll.options.map((option, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 mb-2"
                                  >
                                    <Input
                                      placeholder={`Option ${index + 1}`}
                                      value={option}
                                      onChange={(e) =>
                                        updatePollOption(index, e.target.value)
                                      }
                                    />
                                    {postForm.poll.options.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePollOption(index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addPollOption}
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="header-allow-multiple"
                                  checked={postForm.poll.allowMultiple}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      poll: {
                                        ...prev.poll,
                                        allowMultiple: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <Label htmlFor="header-allow-multiple">
                                  Allow multiple votes
                                </Label>
                              </div>
                              <div>
                                <Label htmlFor="header-poll-expires">
                                  Expires At (Optional)
                                </Label>
                                <Input
                                  id="header-poll-expires"
                                  type="datetime-local"
                                  value={postForm.poll.expiresAt}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      poll: {
                                        ...prev.poll,
                                        expiresAt: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          )}

                          {/* Event Section */}
                          {postForm.type === "event" && (
                            <div className="space-y-4 border rounded-lg p-4">
                              <h3 className="font-semibold">Event Details</h3>
                              <div>
                                <Label htmlFor="header-event-title">
                                  Event Title *
                                </Label>
                                <Input
                                  id="header-event-title"
                                  placeholder="Enter event title..."
                                  value={postForm.event.title}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        title: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="header-event-description">
                                  Event Description *
                                </Label>
                                <Textarea
                                  id="header-event-description"
                                  placeholder="Describe the event..."
                                  rows={3}
                                  value={postForm.event.description}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        description: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="header-event-start">
                                    Start Date *
                                  </Label>
                                  <Input
                                    id="header-event-start"
                                    type="datetime-local"
                                    value={postForm.event.startDate}
                                    onChange={(e) =>
                                      setPostForm((prev) => ({
                                        ...prev,
                                        event: {
                                          ...prev.event,
                                          startDate: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="header-event-end">
                                    End Date (Optional)
                                  </Label>
                                  <Input
                                    id="header-event-end"
                                    type="datetime-local"
                                    value={postForm.event.endDate}
                                    onChange={(e) =>
                                      setPostForm((prev) => ({
                                        ...prev,
                                        event: {
                                          ...prev.event,
                                          endDate: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="header-event-location">
                                  Location
                                </Label>
                                <Input
                                  id="header-event-location"
                                  placeholder="Enter event location..."
                                  value={postForm.event.location}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        location: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="header-is-online"
                                  checked={postForm.event.isOnline}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        isOnline: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <Label htmlFor="header-is-online">
                                  This is an online event
                                </Label>
                              </div>
                              <div>
                                <Label htmlFor="header-max-attendees">
                                  Max Attendees (Optional)
                                </Label>
                                <Input
                                  id="header-max-attendees"
                                  type="number"
                                  placeholder="Enter maximum number of attendees..."
                                  value={postForm.event.maxAttendees}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        maxAttendees: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setPostDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleCreatePost}>
                              Create Post
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      {React.createElement(
                        getCategoryIcon(selectedCommunity.category),
                        {
                          className: "w-6 h-6 text-white",
                        }
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {selectedCommunity.name}
                      </h2>
                      <p className="text-gray-600">
                        {selectedCommunity.description}
                      </p>
                    </div>
                  </div>
                </div>

                {communityPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Be the first to post in this community!
                    </p>
                    <Dialog
                      open={postDialogOpen}
                      onOpenChange={setPostDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create a Post</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Post Type Selection */}
                          <div>
                            <Label htmlFor="post-type">Post Type</Label>
                            <Select
                              value={postForm.type}
                              onValueChange={(
                                value:
                                  | "text"
                                  | "image"
                                  | "file"
                                  | "link"
                                  | "poll"
                                  | "event"
                              ) =>
                                setPostForm((prev) => ({
                                  ...prev,
                                  type: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select post type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text Post</SelectItem>
                                <SelectItem value="image">
                                  Image Post
                                </SelectItem>
                                <SelectItem value="file">File Post</SelectItem>
                                <SelectItem value="link">Link Post</SelectItem>
                                <SelectItem value="poll">Poll</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Post Title */}
                          <div>
                            <Label htmlFor="post-title">Title (Optional)</Label>
                            <Input
                              id="post-title"
                              placeholder="Enter post title..."
                              value={postForm.title}
                              onChange={(e) =>
                                setPostForm((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Post Content */}
                          <div>
                            <Label htmlFor="post-content">Content *</Label>
                            <Textarea
                              id="post-content"
                              placeholder="What's on your mind?"
                              rows={4}
                              value={postForm.content}
                              onChange={(e) =>
                                setPostForm((prev) => ({
                                  ...prev,
                                  content: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Poll Section */}
                          {postForm.type === "poll" && (
                            <div className="space-y-4 border rounded-lg p-4">
                              <h3 className="font-semibold">Poll Details</h3>
                              <div>
                                <Label htmlFor="poll-question">
                                  Poll Question *
                                </Label>
                                <Input
                                  id="poll-question"
                                  placeholder="What would you like to ask?"
                                  value={postForm.poll.question}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      poll: {
                                        ...prev.poll,
                                        question: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label>Poll Options *</Label>
                                {postForm.poll.options.map((option, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 mb-2"
                                  >
                                    <Input
                                      placeholder={`Option ${index + 1}`}
                                      value={option}
                                      onChange={(e) =>
                                        updatePollOption(index, e.target.value)
                                      }
                                    />
                                    {postForm.poll.options.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePollOption(index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addPollOption}
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="allow-multiple"
                                  checked={postForm.poll.allowMultiple}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      poll: {
                                        ...prev.poll,
                                        allowMultiple: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <Label htmlFor="allow-multiple">
                                  Allow multiple votes
                                </Label>
                              </div>
                              <div>
                                <Label htmlFor="poll-expires">
                                  Expires At (Optional)
                                </Label>
                                <Input
                                  id="poll-expires"
                                  type="datetime-local"
                                  value={postForm.poll.expiresAt}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      poll: {
                                        ...prev.poll,
                                        expiresAt: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          )}

                          {/* Event Section */}
                          {postForm.type === "event" && (
                            <div className="space-y-4 border rounded-lg p-4">
                              <h3 className="font-semibold">Event Details</h3>
                              <div>
                                <Label htmlFor="event-title">
                                  Event Title *
                                </Label>
                                <Input
                                  id="event-title"
                                  placeholder="Enter event title..."
                                  value={postForm.event.title}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        title: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="event-description">
                                  Event Description *
                                </Label>
                                <Textarea
                                  id="event-description"
                                  placeholder="Describe the event..."
                                  rows={3}
                                  value={postForm.event.description}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        description: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="event-start">
                                    Start Date *
                                  </Label>
                                  <Input
                                    id="event-start"
                                    type="datetime-local"
                                    value={postForm.event.startDate}
                                    onChange={(e) =>
                                      setPostForm((prev) => ({
                                        ...prev,
                                        event: {
                                          ...prev.event,
                                          startDate: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="event-end">
                                    End Date (Optional)
                                  </Label>
                                  <Input
                                    id="event-end"
                                    type="datetime-local"
                                    value={postForm.event.endDate}
                                    onChange={(e) =>
                                      setPostForm((prev) => ({
                                        ...prev,
                                        event: {
                                          ...prev.event,
                                          endDate: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="event-location">Location</Label>
                                <Input
                                  id="event-location"
                                  placeholder="Enter event location..."
                                  value={postForm.event.location}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        location: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="is-online"
                                  checked={postForm.event.isOnline}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        isOnline: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <Label htmlFor="is-online">
                                  This is an online event
                                </Label>
                              </div>
                              <div>
                                <Label htmlFor="max-attendees">
                                  Max Attendees (Optional)
                                </Label>
                                <Input
                                  id="max-attendees"
                                  type="number"
                                  placeholder="Enter maximum number of attendees..."
                                  value={postForm.event.maxAttendees}
                                  onChange={(e) =>
                                    setPostForm((prev) => ({
                                      ...prev,
                                      event: {
                                        ...prev.event,
                                        maxAttendees: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setPostDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleCreatePost}>
                              Create Post
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {communityPosts.map((post) => (
                      <Card
                        key={post._id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-3">
                              <img
                                src={
                                  post.author.profileImage ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${post.author.firstName} ${post.author.lastName}`
                                  )}&background=random`
                                }
                                alt={`${post.author.firstName} ${post.author.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">
                                    {post.title || "Post"}
                                  </h3>
                                  {post.isPinned && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      <Pin className="w-3 h-3 mr-1" />
                                      Pinned
                                    </Badge>
                                  )}
                                  {post.isAnnouncement && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      Announcement
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-2">
                                  {post.content}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>
                                    by {post.author.firstName}{" "}
                                    {post.author.lastName}
                                  </span>
                                  <span>•</span>
                                  <span>{formatDate(post.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <ThumbsUp className="w-4 h-4" />
                                {post.likes.length}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MessageCircle className="w-4 h-4" />
                                {post.comments.length}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Share2 className="w-4 h-4" />0
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                Like
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Comment
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="w-4 h-4" />
                              </Button>
                              {/* Moderation Controls */}
                              {selectedCommunity &&
                                isUserAdmin(selectedCommunity) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleTogglePostPin(post._id)
                                        }
                                      >
                                        <Pin className="w-4 h-4 mr-2" />
                                        {post.isPinned
                                          ? "Unpin Post"
                                          : "Pin Post"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleTogglePostAnnouncement(post._id)
                                        }
                                      >
                                        <Megaphone className="w-4 h-4 mr-2" />
                                        {post.isAnnouncement
                                          ? "Remove Announcement"
                                          : "Mark as Announcement"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeletePost(post._id)
                                        }
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Post
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Community
                </h3>
                <p className="text-gray-500 mb-4">
                  Choose a community from the Communities tab to view its posts.
                </p>
                <Button onClick={() => setActiveTab("communities")}>
                  Browse Communities
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            {selectedCommunity && communityDetails ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("communities")}
                    >
                      ← Back to Communities
                    </Button>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        {React.createElement(
                          getCategoryIcon(selectedCommunity.category),
                          {
                            className: "w-6 h-6 text-white",
                          }
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">
                          {selectedCommunity.name} - Members
                        </h2>
                        <p className="text-gray-600">
                          Manage community members and permissions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Requests */}
                {communityDetails.pendingRequests.length > 0 &&
                  isUserAdmin(communityDetails) && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5" />
                          Pending Join Requests (
                          {communityDetails.pendingRequests.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {communityDetails.pendingRequests.map((request) => (
                            <div
                              key={request._id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    request.profileImage ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      `${request.firstName} ${request.lastName}`
                                    )}&background=random`
                                  }
                                  alt={`${request.firstName} ${request.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <h4 className="font-medium">
                                    {request.firstName} {request.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Requested to join
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleApproveJoinRequest(request._id)
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveMember(request._id)
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Community Owner */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Community Owner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50">
                      <img
                        src={
                          communityDetails.owner.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            `${communityDetails.owner.firstName} ${communityDetails.owner.lastName}`
                          )}&background=random`
                        }
                        alt={`${communityDetails.owner.firstName} ${communityDetails.owner.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-lg">
                          {communityDetails.owner.firstName}{" "}
                          {communityDetails.owner.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">Community Owner</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Community Admins */}
                {communityDetails.admins.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-500" />
                        Community Admins ({communityDetails.admins.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {communityDetails.admins.map((admin) => (
                          <div
                            key={admin._id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  admin.profileImage ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${admin.firstName} ${admin.lastName}`
                                  )}&background=random`
                                }
                                alt={`${admin.firstName} ${admin.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-medium">
                                  {admin.firstName} {admin.lastName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Community Admin
                                </p>
                              </div>
                            </div>
                            {isUserAdmin(communityDetails) &&
                              admin._id !== communityDetails.owner._id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveMember(admin._id)}
                                >
                                  Remove Admin
                                </Button>
                              )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Community Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      Community Members ({communityDetails.members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {communityDetails.members.map((member) => {
                        const isAdmin = communityDetails.admins.some(
                          (admin) => admin._id === member._id
                        );
                        const isOwner =
                          communityDetails.owner._id === member._id;

                        if (isOwner || isAdmin) return null; // Skip owners and admins as they're shown above

                        return (
                          <div
                            key={member._id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  member.profileImage ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${member.firstName} ${member.lastName}`
                                  )}&background=random`
                                }
                                alt={`${member.firstName} ${member.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-medium">
                                  {member.firstName} {member.lastName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Community Member
                                </p>
                              </div>
                            </div>
                            {isUserAdmin(communityDetails) && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePromoteToAdmin(member._id)
                                  }
                                >
                                  Promote to Admin
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member._id)}
                                >
                                  Remove Member
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Community
                </h3>
                <p className="text-gray-500 mb-4">
                  Choose a community from the Communities tab to view its
                  members.
                </p>
                <Button onClick={() => setActiveTab("communities")}>
                  Browse Communities
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityNew;
