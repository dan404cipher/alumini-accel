import React, { useState, useEffect, useCallback, useRef } from "react";
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
import Pagination from "@/components/ui/Pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Microscope,
  Sparkles,
  Shield,
  Target,
  HandHeart,
  Telescope,
  Lightbulb,
  UserCheck,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { communityAPI } from "@/lib/api";

// Helper function to get auth token
const getAuthToken = (): string => {
  // Check localStorage first (remember me), then sessionStorage
  let token = localStorage.getItem("token");
  if (!token) {
    token = sessionStorage.getItem("token");
  }
  if (!token) {
    throw new Error("Access token is required");
  }
  return token;
};

// Interfaces for Community features
interface Community {
  _id: string;
  name: string;
  description: string;
  type: "open" | "closed" | "hidden";
  category:
    | "department"
    | "batch"
    | "interest"
    | "professional"
    | "location"
    | "academic_research"
    | "professional_career"
    | "entrepreneurship_startups"
    | "social_hobby"
    | "mentorship_guidance"
    | "events_meetups"
    | "community_support_volunteering"
    | "technology_deeptech"
    | "regional_chapter_based"
    | "other";
  banner?: string;
  logo?: string;
  coverImage?: string;
  isPublic: boolean;
  owner?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  admins?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }>;
  members?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }>;
  pendingRequests?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }>;
  invitedUsers?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  rules?: string[];
  tags: string[];
  externalLinks?: {
    website?: string;
    github?: string;
    slack?: string;
    discord?: string;
    other?: string;
  };
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
    profilePicture?: string;
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
  const [activeTab, setActiveTab] = useState("my-communities");

  // Debug active tab changes
  useEffect(() => {}, [activeTab]);
  const [communityActiveTab, setCommunityActiveTab] = useState("posts"); // Post when inside a community
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Joined communities state
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);

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
    coverImage: null as File | null,
    logo: null as File | null,
    invitedUsers: [] as string[],
    externalLinks: {
      website: "",
      github: "",
      slack: "",
      discord: "",
      other: "",
    },
  });

  // Form validation states
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
    category?: string;
    tags?: string;
    rules?: string;
    coverImage?: string;
    logo?: string;
    externalLinks?: {
      website?: string;
      github?: string;
      slack?: string;
      discord?: string;
      other?: string;
    };
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateField = (
    field: string,
    value: string | string[] | File | null
  ) => {
    switch (field) {
      case "name": {
        if (
          !value ||
          (typeof value === "string" && value.trim().length === 0)
        ) {
          return "Community name is required";
        }
        if (typeof value === "string") {
          if (value.trim().length < 3) {
            return "Community name must be at least 3 characters long";
          }
          if (value.trim().length > 100) {
            return "Community name cannot exceed 100 characters";
          }
          if (!/^[a-zA-Z0-9\s\-_&]+$/.test(value.trim())) {
            return "Community name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands";
          }
        }
        return "";
      }

      case "description": {
        if (
          !value ||
          (typeof value === "string" && value.trim().length === 0)
        ) {
          return "Community description is required";
        }
        if (typeof value === "string") {
          if (value.trim().length < 10) {
            return "Community description must be at least 10 characters long";
          }
          if (value.trim().length > 500) {
            return "Community description cannot exceed 500 characters";
          }
        }
        return "";
      }

      case "category": {
        if (
          !value ||
          (typeof value === "string" && value.trim().length === 0)
        ) {
          return "Please select a category";
        }
        const validCategories = [
          "department",
          "batch",
          "interest",
          "professional",
          "location",
          "academic_research",
          "professional_career",
          "entrepreneurship_startups",
          "social_hobby",
          "mentorship_guidance",
          "events_meetups",
          "community_support_volunteering",
          "technology_deeptech",
          "regional_chapter_based",
          "other",
        ];
        if (typeof value === "string" && !validCategories.includes(value)) {
          return "Please select a valid category";
        }
        return "";
      }

      case "tags":
        if (Array.isArray(value)) {
          if (value.length > 10) {
            return "Maximum 10 tags allowed";
          }
          for (const tag of value) {
            if (tag.length > 20) {
              return "Each tag cannot exceed 20 characters";
            }
            if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
              return "Tags can only contain letters, numbers, spaces, hyphens, and underscores";
            }
          }
        }
        return "";

      case "rules":
        if (Array.isArray(value)) {
          if (value.length > 15) {
            return "Maximum 15 rules allowed";
          }
          for (const rule of value) {
            if (rule.trim().length === 0) continue; // Skip empty rules
            if (rule.length > 200) {
              return "Each rule cannot exceed 200 characters";
            }
          }
        }
        return "";

      case "coverImage":
        if (value && value instanceof File) {
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (value.size > maxSize) {
            return "Cover image cannot exceed 5MB";
          }
          const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
          ];
          if (!validTypes.includes(value.type)) {
            return "Cover image must be JPEG, PNG, or WebP format";
          }
        }
        return "";

      case "logo":
        if (value && value instanceof File) {
          const maxSize = 2 * 1024 * 1024; // 2MB
          if (value.size > maxSize) {
            return "Logo cannot exceed 2MB";
          }
          const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/svg+xml",
          ];
          if (!validTypes.includes(value.type)) {
            return "Logo must be JPEG, PNG, WebP, or SVG format";
          }
        }
        return "";

      default:
        return "";
    }
  };

  const validateExternalLink = (url: string, fieldName: string) => {
    if (!url || url.trim().length === 0) return "";

    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return `${fieldName} must be a valid HTTP or HTTPS URL`;
      }
      return "";
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};

    // Validate required fields
    errors.name = validateField("name", communityForm.name);
    errors.description = validateField(
      "description",
      communityForm.description
    );
    errors.category = validateField("category", communityForm.category);

    // Validate optional fields
    errors.tags = validateField("tags", communityForm.tags);
    errors.rules = validateField("rules", communityForm.rules);
    errors.coverImage = validateField("coverImage", communityForm.coverImage);
    errors.logo = validateField("logo", communityForm.logo);

    // Validate external links
    if (communityForm.externalLinks) {
      errors.externalLinks = {};
      if (communityForm.externalLinks.website) {
        errors.externalLinks.website = validateExternalLink(
          communityForm.externalLinks.website,
          "Website"
        );
      }
      if (communityForm.externalLinks.github) {
        errors.externalLinks.github = validateExternalLink(
          communityForm.externalLinks.github,
          "GitHub"
        );
      }
      if (communityForm.externalLinks.slack) {
        errors.externalLinks.slack = validateExternalLink(
          communityForm.externalLinks.slack,
          "Slack"
        );
      }
      if (communityForm.externalLinks.discord) {
        errors.externalLinks.discord = validateExternalLink(
          communityForm.externalLinks.discord,
          "Discord"
        );
      }
      if (communityForm.externalLinks.other) {
        errors.externalLinks.other = validateExternalLink(
          communityForm.externalLinks.other,
          "Other link"
        );
      }
    }

    setFormErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some((error) =>
      typeof error === "string"
        ? error.length > 0
        : typeof error === "object" && error
        ? Object.values(error).some(
            (subError) => typeof subError === "string" && subError.length > 0
          )
        : false
    );

    return !hasErrors;
  };

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
  const [availableUsers, setAvailableUsers] = useState<
    Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>
  >([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Right sidebar data
  interface TopCommunity {
    id: string;
    name: string;
    memberCount: number;
    postCount: number;
    category: string;
    isPublic: boolean;
    coverImage: string | null;
    logo: string | null;
  }

  interface PopularTag {
    name: string;
    count: number;
    color: string;
  }

  const [topCommunities, setTopCommunities] = useState<TopCommunity[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [loadingSidebar, setLoadingSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);

  const categories = [
    { id: "all", name: "All Categories", icon: Globe },
    { id: "department", name: "Department", icon: Building },
    { id: "batch", name: "Batch", icon: GraduationCap },
    { id: "interest", name: "Interest", icon: Heart },
    // { id: "professional", name: "Professional", icon: Briefcase },
    { id: "location", name: "Location", icon: MapPin },
    { id: "academic_research", name: "Academic & Research", icon: Microscope },
    { id: "professional_career", name: "Professional & Career", icon: Target },
    {
      id: "entrepreneurship_startups",
      name: "Entrepreneurship",
      icon: Sparkles,
    },
    { id: "social_hobby", name: "Social & Hobby", icon: Heart },
    {
      id: "mentorship_guidance",
      name: "Mentorship & Guidance",
      icon: UserCheck,
    },
    { id: "events_meetups", name: "Events & Meetups", icon: Calendar },
    {
      id: "community_support_volunteering",
      name: "Community Support",
      icon: HandHeart,
    },
    {
      id: "technology_deeptech",
      name: "Technology & DeepTech",
      icon: Telescope,
    },
    {
      id: "regional_chapter_based",
      name: "Regional / Chapter-based",
      icon: MapPin,
    },
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
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities?${params}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Transform the data to ensure isPublic field is properly set
        const communitiesData = data.data as {
          communities: Community[];
          pagination?: { totalPages: number };
        };
        const transformedCommunities = communitiesData.communities.map(
          (community: Community & { type?: string }) => ({
            ...community,
            // Handle different possible field names from backend
            isPublic:
              community.isPublic !== undefined
                ? community.isPublic
                : community.type === "open",
          })
        );

        setCommunities(transformedCommunities);
        if (communitiesData.pagination) {
          setTotalPages(communitiesData.pagination.totalPages || 1);
        }
      } else {
        setError("Failed to fetch communities");
      }
    } catch (err) {
      setError("Failed to fetch communities");
      console.error("Error fetching communities:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const fetchCommunityPosts = useCallback(async (communityId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts/community/${communityId}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${communityId}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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
    if (activeTab === "communities" || activeTab === "my-communities") {
      fetchCommunities();
    }
  }, [activeTab, selectedCategory, searchQuery, fetchCommunities]);

  // Fetch sidebar data
  useEffect(() => {
    const fetchSidebarData = async () => {
      setLoadingSidebar(true);
      try {
        // Fetch real top communities
        const topCommunitiesResponse = await communityAPI.getTopCommunities(5);

        if (
          topCommunitiesResponse.success &&
          Array.isArray(topCommunitiesResponse.data)
        ) {
          const transformedCommunities = topCommunitiesResponse.data.map(
            (community: any) => ({
              id: community._id,
              name: community.name,
              memberCount: community.memberCount || 0,
              postCount: community.postCount || 0,
              category: community.category,
              isPublic: community.type === "open",
              coverImage: community.coverImage,
              logo: community.logo,
            })
          );
          setTopCommunities(transformedCommunities);
        } else {
          setTopCommunities([]);
        }

        // Mock popular tags for now (can be replaced with real API later)
        const mockPopularTags: PopularTag[] = [
          { name: "career", count: 156, color: "bg-blue-100 text-blue-800" },
          {
            name: "networking",
            count: 134,
            color: "bg-green-100 text-green-800",
          },
          {
            name: "technology",
            count: 98,
            color: "bg-purple-100 text-purple-800",
          },
          {
            name: "startup",
            count: 87,
            color: "bg-orange-100 text-orange-800",
          },
          { name: "mentorship", count: 76, color: "bg-pink-100 text-pink-800" },
          {
            name: "alumni",
            count: 234,
            color: "bg-indigo-100 text-indigo-800",
          },
          { name: "job", count: 189, color: "bg-red-100 text-red-800" },
          {
            name: "events",
            count: 112,
            color: "bg-yellow-100 text-yellow-800",
          },
          { name: "research", count: 65, color: "bg-teal-100 text-teal-800" },
          { name: "investment", count: 43, color: "bg-gray-100 text-gray-800" },
        ];

        setPopularTags(mockPopularTags);
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      } finally {
        setLoadingSidebar(false);
      }
    };

    fetchSidebarData();
  }, []);

  // File validation function
  const validateFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // File upload functions
  const uploadFile = async (file: File, type: "cover" | "logo") => {
    try {
      setUploadingFiles(true);
      const formData = new FormData();
      formData.append(type === "cover" ? "coverImage" : "logo", file);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/upload/community/${type}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFiles(false);
    }
  };

  // User search function
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setAvailableUsers([]);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.data.users || []);
      }
    } catch (error) {
      console.error("User search error:", error);
    }
  };

  // Handle file input changes
  const handleFileChange = (file: File | null, type: "cover" | "logo") => {
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload JPG, PNG, or WebP images only.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setCommunityForm((prev) => ({
        ...prev,
        [type === "cover" ? "coverImage" : "logo"]: file,
      }));
    }
  };

  // Add user to invited list
  const addInvitedUser = (user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    if (!communityForm.invitedUsers.includes(user._id)) {
      setCommunityForm((prev) => ({
        ...prev,
        invitedUsers: [...prev.invitedUsers, user._id],
      }));
    }
    setUserSearchQuery("");
    setAvailableUsers([]);
  };

  // Remove user from invited list
  const removeInvitedUser = (userId: string) => {
    setCommunityForm((prev) => ({
      ...prev,
      invitedUsers: prev.invitedUsers.filter((id) => id !== userId),
    }));
  };

  // Add rule
  const addRule = () => {
    setCommunityForm((prev) => ({
      ...prev,
      rules: [...prev.rules, ""],
    }));
  };

  // Update rule
  const updateRule = (index: number, value: string) => {
    setCommunityForm((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
    }));
  };

  // Remove rule
  const removeRule = (index: number) => {
    setCommunityForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  // Add tag
  const addTag = (tag: string) => {
    if (tag.trim() && !communityForm.tags.includes(tag.trim().toLowerCase())) {
      setCommunityForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim().toLowerCase()],
      }));
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setCommunityForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleCreateCommunity = async () => {
    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Validate form
      if (!validateForm()) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors below before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload files if they exist
      let coverImageUrl = null;
      let logoUrl = null;

      if (communityForm.coverImage) {
        coverImageUrl = await uploadFile(communityForm.coverImage, "cover");
        if (!coverImageUrl) return;
      }

      if (communityForm.logo) {
        logoUrl = await uploadFile(communityForm.logo, "logo");
        if (!logoUrl) return;
      }

      // Prepare request body - only include fields that have values
      const requestBody: {
        name: string;
        description: string;
        type: string;
        category?: string;
        tags: string[];
        rules: string[];
        externalLinks: Record<string, string>;
        invitedUsers: string[];
        coverImage?: string;
        logo?: string;
      } = {
        name: communityForm.name,
        description: communityForm.description,
        type: communityForm.isPublic ? "open" : "closed",
        tags: communityForm.tags,
        rules: communityForm.rules.filter((rule) => rule.trim()),
        externalLinks: Object.fromEntries(
          Object.entries(communityForm.externalLinks).filter(([_, value]) =>
            value.trim()
          )
        ),
        invitedUsers: communityForm.invitedUsers,
      };

      // Add category if it exists
      if (communityForm.category) {
        requestBody.category = communityForm.category;
      }

      // Only include coverImage and logo if they have values
      if (coverImageUrl) {
        requestBody.coverImage = coverImageUrl;
      }
      if (logoUrl) {
        requestBody.logo = logoUrl;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(requestBody),
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
          coverImage: null,
          logo: null,
          invitedUsers: [],
          externalLinks: {
            website: "",
            github: "",
            slack: "",
            discord: "",
            other: "",
          },
        });
        setFormErrors({});
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
      console.error("Error creating community:", err);
      toast({
        title: "Error",
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${communityId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${communityId}/leave`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
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
    navigate(`/community/${community._id}`);
  };

  const handleApproveJoinRequest = async (userId: string) => {
    if (!selectedCommunity) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ userId, communityId: selectedCommunity._id }),
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ userId, communityId: selectedCommunity._id }),
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/promote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ userId, communityId: selectedCommunity._id }),
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts/${postId}/pin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts/${postId}/announcement`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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

  const isUserMember = useCallback(
    (community: Community) => {
      if (!user || !community) return false;

      const isMember =
        community.members &&
        community.members.some((member) => member._id === user._id);

      return isMember;
    },
    [user]
  );

  // Filter joined communities
  const filterJoinedCommunities = useCallback(() => {
    if (!user) {
      setJoinedCommunities([]);
      return;
    }

    const joined = communities.filter((community) => {
      const isMember = isUserMember(community);
      return isMember;
    });

    setJoinedCommunities(joined);
  }, [communities, user, isUserMember]);

  // Update joined communities when communities change
  useEffect(() => {
    filterJoinedCommunities();
  }, [communities, filterJoinedCommunities]);

  const isUserAdmin = (community: Community) => {
    if (!user || !community) return false;
    return (
      (community.admins &&
        community.admins.some((admin) => admin._id === user._id)) ||
      (community.owner && community.owner._id === user._id)
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

                  {/* Quick Actions - Only show if user can create communities */}
                  {user?.role &&
                    ["super_admin", "college_admin", "hod", "staff"].includes(
                      user.role
                    ) && (
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
                            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Create a Community</DialogTitle>
                                <DialogDescription>
                                  Create a new community to connect with other
                                  alumni and share experiences.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    Basic Information
                                  </h3>
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
                                          <SelectItem value="batch">
                                            Batch
                                          </SelectItem>
                                          <SelectItem value="interest">
                                            Interest
                                          </SelectItem>
                                          <SelectItem value="professional">
                                            Professional
                                          </SelectItem>
                                          <SelectItem value="location">
                                            Location
                                          </SelectItem>
                                          <SelectItem value="academic_research">
                                            Academic & Research
                                          </SelectItem>
                                          <SelectItem value="professional_career">
                                            Professional & Career
                                          </SelectItem>
                                          <SelectItem value="entrepreneurship_startups">
                                            Entrepreneurship & Startups
                                          </SelectItem>
                                          <SelectItem value="social_hobby">
                                            Social & Hobby
                                          </SelectItem>
                                          <SelectItem value="mentorship_guidance">
                                            Mentorship & Guidance
                                          </SelectItem>
                                          <SelectItem value="events_meetups">
                                            Events & Meetups
                                          </SelectItem>
                                          <SelectItem value="community_support_volunteering">
                                            Community Support & Volunteering
                                          </SelectItem>
                                          <SelectItem value="technology_deeptech">
                                            Technology & DeepTech
                                          </SelectItem>
                                          <SelectItem value="regional_chapter_based">
                                            Regional / Chapter-based
                                          </SelectItem>
                                          <SelectItem value="other">
                                            Other
                                          </SelectItem>
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
                                </div>

                                {/* Media Upload */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    Media
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="cover-image">
                                        Cover Image
                                      </Label>
                                      <div className="mt-2">
                                        <Input
                                          id="cover-image"
                                          type="file"
                                          accept="image/jpeg,image/jpg,image/png,image/webp"
                                          onChange={(e) => {
                                            const file =
                                              e.target.files?.[0] || null;
                                            handleFileChange(file, "cover");
                                          }}
                                        />
                                        <p className="text-sm text-muted-foreground mt-1">
                                          JPG, PNG, WebP (max 5MB)
                                        </p>
                                        {communityForm.coverImage && (
                                          <div className="mt-2">
                                            <p className="text-sm text-green-600">
                                              Selected:{" "}
                                              {communityForm.coverImage.name}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="logo">Logo</Label>
                                      <div className="mt-2">
                                        <Input
                                          id="logo"
                                          type="file"
                                          accept="image/jpeg,image/jpg,image/png,image/webp"
                                          onChange={(e) => {
                                            const file =
                                              e.target.files?.[0] || null;
                                            handleFileChange(file, "logo");
                                          }}
                                        />
                                        <p className="text-sm text-muted-foreground mt-1">
                                          JPG, PNG, WebP (max 5MB)
                                        </p>
                                        {communityForm.logo && (
                                          <div className="mt-2">
                                            <p className="text-sm text-green-600">
                                              Selected:{" "}
                                              {communityForm.logo.name}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    Tags
                                  </h3>
                                  <div>
                                    <Label htmlFor="tags-input">Add Tags</Label>
                                    <div className="flex gap-2 mt-2">
                                      <Input
                                        id="tags-input"
                                        placeholder="Enter a tag..."
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            addTag(e.currentTarget.value);
                                            e.currentTarget.value = "";
                                          }
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                          const input = document.getElementById(
                                            "tags-input"
                                          ) as HTMLInputElement;
                                          if (input.value) {
                                            addTag(input.value);
                                            input.value = "";
                                          }
                                        }}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {communityForm.tags.map((tag, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                                        >
                                          {tag}
                                          <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="text-primary hover:text-primary/70"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Rules & Guidelines */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    Rules & Guidelines
                                  </h3>
                                  <div>
                                    <Label>Community Rules</Label>
                                    <div className="space-y-2 mt-2">
                                      {communityForm.rules.map(
                                        (rule, index) => (
                                          <div
                                            key={index}
                                            className="flex gap-2"
                                          >
                                            <Input
                                              placeholder={`Rule ${index + 1}`}
                                              value={rule}
                                              onChange={(e) =>
                                                updateRule(
                                                  index,
                                                  e.target.value
                                                )
                                              }
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => removeRule(index)}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        )
                                      )}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addRule}
                                        className="w-full"
                                      >
                                        Add Rule
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* External Links */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    External Links
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="website">Website</Label>
                                      <Input
                                        id="website"
                                        type="url"
                                        placeholder="https://example.com"
                                        value={
                                          communityForm.externalLinks.website
                                        }
                                        onChange={(e) =>
                                          setCommunityForm((prev) => ({
                                            ...prev,
                                            externalLinks: {
                                              ...prev.externalLinks,
                                              website: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="github">GitHub</Label>
                                      <Input
                                        id="github"
                                        type="url"
                                        placeholder="https://github.com/username"
                                        value={
                                          communityForm.externalLinks.github
                                        }
                                        onChange={(e) =>
                                          setCommunityForm((prev) => ({
                                            ...prev,
                                            externalLinks: {
                                              ...prev.externalLinks,
                                              github: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="slack">Slack</Label>
                                      <Input
                                        id="slack"
                                        type="url"
                                        placeholder="https://workspace.slack.com"
                                        value={
                                          communityForm.externalLinks.slack
                                        }
                                        onChange={(e) =>
                                          setCommunityForm((prev) => ({
                                            ...prev,
                                            externalLinks: {
                                              ...prev.externalLinks,
                                              slack: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="discord">Discord</Label>
                                      <Input
                                        id="discord"
                                        type="url"
                                        placeholder="https://discord.gg/invite"
                                        value={
                                          communityForm.externalLinks.discord
                                        }
                                        onChange={(e) =>
                                          setCommunityForm((prev) => ({
                                            ...prev,
                                            externalLinks: {
                                              ...prev.externalLinks,
                                              discord: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <Label htmlFor="other-link">
                                        Other Link
                                      </Label>
                                      <Input
                                        id="other-link"
                                        type="url"
                                        placeholder="https://example.com"
                                        value={
                                          communityForm.externalLinks.other
                                        }
                                        onChange={(e) =>
                                          setCommunityForm((prev) => ({
                                            ...prev,
                                            externalLinks: {
                                              ...prev.externalLinks,
                                              other: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Invite Users */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    Invite Users
                                  </h3>
                                  <div>
                                    <Label htmlFor="user-search">
                                      Search Users
                                    </Label>
                                    <div className="relative">
                                      <Input
                                        id="user-search"
                                        placeholder="Search by name or email..."
                                        value={userSearchQuery}
                                        onChange={(e) => {
                                          setUserSearchQuery(e.target.value);
                                          searchUsers(e.target.value);
                                        }}
                                      />
                                      {availableUsers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                          {availableUsers.map((user) => (
                                            <div
                                              key={user._id}
                                              className="p-2 hover:bg-gray-100 cursor-pointer"
                                              onClick={() =>
                                                addInvitedUser(user)
                                              }
                                            >
                                              <div className="font-medium">
                                                {user.firstName} {user.lastName}
                                              </div>
                                              <div className="text-sm text-gray-500">
                                                {user.email}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {communityForm.invitedUsers.length > 0 && (
                                      <div className="mt-2">
                                        <Label>Invited Users</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {communityForm.invitedUsers.map(
                                            (userId) => {
                                              const user = availableUsers.find(
                                                (u) => u._id === userId
                                              );
                                              return (
                                                <div
                                                  key={userId}
                                                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                                                >
                                                  {user
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : userId}
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      removeInvitedUser(userId)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800"
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-2 pt-4 border-t">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      setCommunityDialogOpen(false)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleCreateCommunity}
                                    disabled={uploadingFiles}
                                  >
                                    {uploadingFiles
                                      ? "Creating..."
                                      : "Create Community"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
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

              {/* Quick Actions - Only show if user can create communities */}
              {user?.role &&
                ["super_admin", "college_admin", "hod", "staff"].includes(
                  user.role
                ) && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-sm font-semibold">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setCommunityDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Community
                      </Button>
                    </div>
                  </div>
                )}
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

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3">
            <TabsTrigger
              value="communities"
              className="flex items-center gap-2"
            >
              <Users2 className="w-4 h-4" />
              Communities
            </TabsTrigger>
            <TabsTrigger
              value="my-communities"
              className="flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              My Communities
            </TabsTrigger>
            {selectedCommunity && (
              <TabsTrigger
                value="community"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {selectedCommunity.name}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities" className="space-y-6">
            {/* Joined Communities Section */}
            {joinedCommunities.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    Your Joined Communities
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("my-communities")}
                  >
                    View All
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {joinedCommunities.slice(0, 6).map((community) => {
                    const CategoryIcon = getCategoryIcon(community.category);
                    const isMember = isUserMember(community);
                    const isAdmin = isUserAdmin(community);

                    return (
                      <Card
                        key={community._id}
                        className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-blue-200 bg-blue-50/30"
                        onClick={() => handleViewCommunity(community)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0">
                              {community.logo ? (
                                <img
                                  src={community.logo}
                                  alt={`${community.name} logo`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <CategoryIcon className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {community.name}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {community.category?.replace(/_/g, " ")}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {isAdmin ? "Admin" : "Member"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {community.type || "Community"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {joinedCommunities.length > 6 && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("my-communities")}
                    >
                      View All {joinedCommunities.length} Joined Communities
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* All Communities Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-gray-600" />
                  All Communities
                </h2>
              </div>

              {communities.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <Users2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No communities yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Be the first to create a community!
                  </p>
                  {/* Only show Create Community button for College Admin, HOD, and Staff */}
                  {user?.role &&
                    ["super_admin", "college_admin", "hod", "staff"].includes(
                      user.role
                    ) && (
                      <Button onClick={() => setCommunityDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Community
                      </Button>
                    )}
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
                        className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                        onClick={() => handleViewCommunity(community)}
                      >
                        {/* Community Card Content */}
                        <CardContent className="p-6 pb-2">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                                {community.logo ? (
                                  <img
                                    src={community.logo}
                                    alt={`${community.name} logo`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <CategoryIcon className="w-6 h-6 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                  {community.name}
                                </h3>
                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                  {community.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <CategoryIcon className="w-3 h-3" />
                                  <span className="capitalize">
                                    {community.category}
                                  </span>
                                  <span>•</span>
                                  <span>{community.memberCount} members</span>
                                  {!community.isPublic && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-600">
                                        Private
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isMember && (
                                <Badge variant="secondary" className="text-xs">
                                  Member
                                </Badge>
                              )}
                              {isAdmin && (
                                <Badge variant="default" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Tags */}
                          {community.tags && community.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {community.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
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
                          )}

                          {/* Stats */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {community.postCount || 0} posts
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  Active{" "}
                                  {new Date(
                                    community.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </span>
                            </div>
                            <Button variant="outline" size="sm">
                              {isMember ? "View" : "Join"}
                            </Button>
                          </div>

                          {/* Moderator Tools - Only show for admins */}
                          {isAdmin && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Shield className="w-3 h-3" />
                                  <span>Moderator Tools</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-6 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Add manage community functionality
                                    }}
                                  >
                                    <Settings className="w-3 h-3 mr-1" />
                                    Manage
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Communities Tab */}
          <TabsContent value="my-communities" className="space-y-4">
            {joinedCommunities.length === 0 && !loading ? (
              <div className="text-center py-12">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No joined communities
                </h3>
                <p className="text-gray-500 mb-4">
                  You haven't joined any communities yet. Explore communities
                  and join the ones that interest you!
                </p>
                <Button onClick={() => setActiveTab("communities")}>
                  <Users2 className="w-4 h-4 mr-2" />
                  Browse Communities
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {joinedCommunities.map((community) => {
                  const CategoryIcon = getCategoryIcon(community.category);
                  const isMember = isUserMember(community);
                  const isAdmin = isUserAdmin(community);

                  return (
                    <Card
                      key={community._id}
                      className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                      onClick={() => handleViewCommunity(community)}
                    >
                      {/* Community Card Content */}
                      <CardContent className="p-6 pb-2">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                              {community.logo ? (
                                <img
                                  src={community.logo}
                                  alt={`${community.name} logo`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <CategoryIcon className="w-6 h-6 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                {community.name}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                {community.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {community.memberCount || 0} members
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>{community.postCount || 0} posts</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CategoryIcon className="w-3 h-3" />
                                  <span className="capitalize">
                                    {community.category.replace(/_/g, " ")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isAdmin && (
                              <Badge variant="secondary" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            {isMember && (
                              <Badge variant="default" className="text-xs">
                                Member
                              </Badge>
                            )}
                            <Badge
                              variant={
                                community.type === "open"
                                  ? "default"
                                  : community.type === "closed"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {community.type === "open"
                                ? "Public"
                                : community.type === "closed"
                                ? "Private"
                                : "Hidden"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-6"
              />
            )}
          </TabsContent>

          {/* Individual Community Page */}
          <TabsContent value="community" className="space-y-4">
            {selectedCommunity ? (
              <div>
                {/* Community Header with Cover Image */}
                {selectedCommunity.coverImage && (
                  <div className="mb-6">
                    <img
                      src={selectedCommunity.coverImage}
                      alt={`${selectedCommunity.name} cover`}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Back to Communities button */}
                <div className="mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("communities")}
                    className="mb-4"
                  >
                    ← Back to Communities
                  </Button>
                </div>

                {/* Community Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Discussions
                          </p>
                          <p className="text-2xl font-bold">
                            {selectedCommunity.postCount || "1,234"}
                          </p>
                        </div>
                        <MessageCircle className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Active Members
                          </p>
                          <p className="text-2xl font-bold">
                            {selectedCommunity.memberCount || 856}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Last Activity
                          </p>
                          <p className="text-lg font-semibold">2 minutes ago</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Internal Community Tabs */}
                <Tabs
                  value={communityActiveTab}
                  onValueChange={setCommunityActiveTab}
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                  </TabsList>

                  {/* Posts Tab Content */}
                  <TabsContent value="posts" className="space-y-4">
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Latest Discussions
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Scroll down to see community posts and discussions.
                      </p>
                    </div>
                  </TabsContent>

                  {/* About Tab Content */}
                  <TabsContent value="about" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Community Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Description
                          </h3>
                          <p className="text-gray-600">
                            {selectedCommunity.description}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Category
                          </h3>
                          <Badge variant="outline">
                            {selectedCommunity.category}
                          </Badge>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Tags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedCommunity.tags?.map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {selectedCommunity.externalLinks && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                              External Links
                            </h3>
                            <div className="space-y-2">
                              {selectedCommunity.externalLinks.website && (
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-gray-500" />
                                  <a
                                    href={
                                      selectedCommunity.externalLinks.website
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Website
                                  </a>
                                </div>
                              )}
                              {selectedCommunity.externalLinks.github && (
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-gray-500" />
                                  <a
                                    href={
                                      selectedCommunity.externalLinks.github
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    GitHub
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Member Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-2xl font-bold">
                              {selectedCommunity.memberCount || 856}
                            </p>
                            <p className="text-sm text-gray-600">
                              Total Members
                            </p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">
                              {selectedCommunity.postCount || "1,234"}
                            </p>
                            <p className="text-sm text-gray-600">Total Posts</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedCommunity.rules &&
                      selectedCommunity.rules.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5" />
                              Community Rules
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {selectedCommunity.rules.map((rule, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-gray-500">•</span>
                                  <span>{rule}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                  </TabsContent>

                  {/* Members Tab Content */}
                  <TabsContent value="members" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Community Members
                        </h3>
                        <span className="text-sm text-gray-500">
                          {selectedCommunity.memberCount || 856} members
                        </span>
                      </div>

                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Member List
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Member profiles and details would be displayed here.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Community
                </h3>
                <p className="text-gray-500 mb-4">
                  Choose a community from the Communities tab to view its
                  details and discussions.
                </p>
                <Button onClick={() => setActiveTab("communities")}>
                  Browse Communities
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Sidebar - Top Communities & Popular Tags */}
      <div className="block w-80 flex-shrink-0 bg-gray-50">
        <div className="sticky top-0 h-screen overflow-y-auto p-4 space-y-6">
          {/* Top Communities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Top Communities
              </CardTitle>
              <CardDescription>
                Most active communities this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSidebar ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-3 p-3 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topCommunities.length > 0 ? (
                <div className="space-y-4">
                  {topCommunities.map((community, index) => (
                    <div
                      key={community.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/community/${community.id}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {community.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{community.memberCount.toLocaleString()}</span>
                          <MessageCircle className="w-3 h-3" />
                          <span>{community.postCount}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {community.isPublic ? "Public" : "Private"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Communities Yet
                  </h3>
                  <p className="text-sm text-gray-600">
                    Communities will appear here once they're created.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Popular Tags
              </CardTitle>
              <CardDescription>
                Trending topics in the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSidebar ? (
                <div className="flex flex-wrap gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 bg-gray-200 rounded animate-pulse"
                      style={{ width: `${Math.random() * 60 + 40}px` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag, index) => (
                    <Badge
                      key={tag.name}
                      variant="secondary"
                      className={`${tag.color} hover:opacity-80 cursor-pointer transition-opacity text-xs`}
                      onClick={() => {
                        // TODO: Implement tag filtering
                      }}
                    >
                      #{tag.name}
                      <span className="ml-1 text-xs opacity-70">
                        ({tag.count})
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Total Communities
                  </span>
                  <span className="text-sm font-semibold">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Members</span>
                  <span className="text-sm font-semibold">2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Posts This Week</span>
                  <span className="text-sm font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Communities</span>
                  <span className="text-sm font-semibold">3</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shared Create Community Dialog - Triggered by all buttons */}
      <Dialog open={communityDialogOpen} onOpenChange={setCommunityDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a Community</DialogTitle>
            <DialogDescription>
              Create a new community to connect with other alumni and share
              experiences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div>
                <Label htmlFor="community-name-popup">Community Name *</Label>
                <Input
                  id="community-name-popup"
                  placeholder="Enter community name..."
                  value={communityForm.name}
                  onChange={(e) => {
                    setCommunityForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                    // Real-time validation
                    const error = validateField("name", e.target.value);
                    setFormErrors((prev) => ({ ...prev, name: error }));
                  }}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {communityForm.name.length}/100 characters
                </p>
              </div>
              <div>
                <Label htmlFor="community-description-popup">
                  Description *
                </Label>
                <Textarea
                  id="community-description-popup"
                  placeholder="Describe your community..."
                  rows={3}
                  value={communityForm.description}
                  onChange={(e) => {
                    setCommunityForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }));
                    // Real-time validation
                    const error = validateField("description", e.target.value);
                    setFormErrors((prev) => ({ ...prev, description: error }));
                  }}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {communityForm.description.length}/500 characters
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="community-category-popup">Category *</Label>
                  <Select
                    value={communityForm.category}
                    onValueChange={(value) => {
                      setCommunityForm((prev) => ({
                        ...prev,
                        category: value,
                      }));
                      // Real-time validation
                      const error = validateField("category", value);
                      setFormErrors((prev) => ({ ...prev, category: error }));
                    }}
                  >
                    <SelectTrigger
                      className={formErrors.category ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                      <SelectItem value="interest">Interest</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="academic_research">
                        Academic & Research
                      </SelectItem>
                      <SelectItem value="professional_career">
                        Professional & Career
                      </SelectItem>
                      <SelectItem value="entrepreneurship_startups">
                        Entrepreneurship & Startups
                      </SelectItem>
                      <SelectItem value="social_hobby">
                        Social & Hobby
                      </SelectItem>
                      <SelectItem value="mentorship_guidance">
                        Mentorship & Guidance
                      </SelectItem>
                      <SelectItem value="events_meetups">
                        Events & Meetups
                      </SelectItem>
                      <SelectItem value="community_support_volunteering">
                        Community Support & Volunteering
                      </SelectItem>
                      <SelectItem value="technology_deeptech">
                        Technology & DeepTech
                      </SelectItem>
                      <SelectItem value="regional_chapter_based">
                        Regional / Chapter-based
                      </SelectItem>
                      <SelectItem value="sports">
                        Sports & Recreation
                      </SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.category && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.category}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="community-visibility-popup">Visibility</Label>
                  <Select
                    value={communityForm.isPublic ? "public" : "private"}
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
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Media</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="community-cover">Cover Image</Label>
                  <Input
                    id="community-cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && validateFile(file)) {
                        setCommunityForm((prev) => ({
                          ...prev,
                          coverImage: file,
                        }));
                      }
                    }}
                  />
                  {communityForm.coverImage && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">
                        ✓ {communityForm.coverImage.name}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="community-logo">Logo</Label>
                  <Input
                    id="community-logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && validateFile(file)) {
                        setCommunityForm((prev) => ({
                          ...prev,
                          logo: file,
                        }));
                      }
                    }}
                  />
                  {communityForm.logo && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">
                        ✓ {communityForm.logo.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tags</h3>
              <div>
                <Label htmlFor="tags-input-popup">Add Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="tags-input-popup"
                    placeholder="Enter a tag..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const tagValue = e.currentTarget.value.trim();
                        if (tagValue) {
                          const error = validateField("tags", [
                            ...communityForm.tags,
                            tagValue,
                          ]);
                          if (!error) {
                            addTag(tagValue);
                            e.currentTarget.value = "";
                            setFormErrors((prev) => ({ ...prev, tags: "" }));
                          } else {
                            setFormErrors((prev) => ({ ...prev, tags: error }));
                          }
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById(
                        "tags-input-popup"
                      ) as HTMLInputElement;
                      if (input.value) {
                        const tagValue = input.value.trim();
                        const error = validateField("tags", [
                          ...communityForm.tags,
                          tagValue,
                        ]);
                        if (!error) {
                          addTag(tagValue);
                          input.value = "";
                          setFormErrors((prev) => ({ ...prev, tags: "" }));
                        } else {
                          setFormErrors((prev) => ({ ...prev, tags: error }));
                        }
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {formErrors.tags && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.tags}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {communityForm.tags.length}/10 tags (max 20 characters each)
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {communityForm.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-primary hover:text-primary/70"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rules & Guidelines */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Rules & Guidelines</h3>
              <div>
                <Label>Community Rules</Label>
                <div className="space-y-2 mt-2">
                  {communityForm.rules.map((rule, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Rule ${index + 1}`}
                        value={rule}
                        onChange={(e) => {
                          const newRules = [...communityForm.rules];
                          newRules[index] = e.target.value;
                          updateRule(index, e.target.value);
                          // Validate rules
                          const error = validateField("rules", newRules);
                          setFormErrors((prev) => ({ ...prev, rules: error }));
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRules = communityForm.rules.filter(
                            (_, i) => i !== index
                          );
                          removeRule(index);
                          // Validate rules after removal
                          const error = validateField("rules", newRules);
                          setFormErrors((prev) => ({ ...prev, rules: error }));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newRules = [...communityForm.rules, ""];
                      addRule();
                      // Validate rules after adding
                      const error = validateField("rules", newRules);
                      setFormErrors((prev) => ({ ...prev, rules: error }));
                    }}
                    className="w-full"
                  >
                    Add Rule
                  </Button>
                </div>
                {formErrors.rules && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.rules}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {communityForm.rules.filter((rule) => rule.trim()).length}/15
                  rules (max 200 characters each)
                </p>
              </div>
            </div>

            {/* External Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">External Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website-popup">Website</Label>
                  <Input
                    id="website-popup"
                    type="url"
                    placeholder="https://example.com"
                    value={communityForm.externalLinks.website}
                    onChange={(e) => {
                      setCommunityForm((prev) => ({
                        ...prev,
                        externalLinks: {
                          ...prev.externalLinks,
                          website: e.target.value,
                        },
                      }));
                      // Validate external link
                      const error = validateExternalLink(
                        e.target.value,
                        "Website"
                      );
                      setFormErrors((prev) => ({
                        ...prev,
                        externalLinks: {
                          ...prev.externalLinks,
                          website: error,
                        },
                      }));
                    }}
                    className={
                      formErrors.externalLinks?.website ? "border-red-500" : ""
                    }
                  />
                  {formErrors.externalLinks?.website && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.externalLinks.website}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="github-popup">GitHub</Label>
                  <Input
                    id="github-popup"
                    type="url"
                    placeholder="https://github.com/username"
                    value={communityForm.externalLinks.github}
                    onChange={(e) => {
                      setCommunityForm((prev) => ({
                        ...prev,
                        externalLinks: {
                          ...prev.externalLinks,
                          github: e.target.value,
                        },
                      }));
                      // Validate external link
                      const error = validateExternalLink(
                        e.target.value,
                        "GitHub"
                      );
                      setFormErrors((prev) => ({
                        ...prev,
                        externalLinks: {
                          ...prev.externalLinks,
                          github: error,
                        },
                      }));
                    }}
                    className={
                      formErrors.externalLinks?.github ? "border-red-500" : ""
                    }
                  />
                  {formErrors.externalLinks?.github && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.externalLinks.github}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="slack-popup">Slack</Label>
                  <Input
                    id="slack-popup"
                    type="url"
                    placeholder="https://workspace.slack.com"
                    value={communityForm.externalLinks.slack}
                    onChange={(e) =>
                      setCommunityForm((prev) => ({
                        ...prev,
                        externalLinks: {
                          ...prev.externalLinks,
                          slack: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="discord-popup">Discord</Label>
                  <Input
                    id="discord-popup"
                    type="url"
                    placeholder="https://discord.gg/invite"
                    value={communityForm.externalLinks.discord}
                    onChange={(e) =>
                      setCommunityForm((prev) => ({
                        ...prev,
                        externalLinks: {
                          ...prev.externalLinks,
                          discord: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="other-link-popup">Other Link</Label>
                  <Input
                    id="other-link-popup"
                    type="url"
                    placeholder="https://example.com"
                    value={communityForm.externalLinks.other}
                    onChange={(e) =>
                      setCommunityForm((prev) => ({
                        ...prev,
                        externalLinks: {
                          ...prev.externalLinks,
                          other: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Invite Users */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Invite Users</h3>
              <div>
                <Label htmlFor="user-search-popup">Search Users</Label>
                <div className="relative">
                  <Input
                    id="user-search-popup"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                  {availableUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <div
                          key={user._id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => addInvitedUser(user)}
                        >
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {communityForm.invitedUsers.length > 0 && (
                  <div className="mt-2">
                    <Label>Invited Users</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {communityForm.invitedUsers.map((userId) => {
                        const user = availableUsers.find(
                          (u) => u._id === userId
                        );
                        return (
                          <div
                            key={userId}
                            className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                          >
                            {user
                              ? `${user.firstName} ${user.lastName}`
                              : userId}
                            <button
                              type="button"
                              onClick={() => removeInvitedUser(userId)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCommunityDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCommunity}
                disabled={isSubmitting || uploadingFiles}
              >
                {isSubmitting || uploadingFiles
                  ? "Creating..."
                  : "Create Community"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityNew;
