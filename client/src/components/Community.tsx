import { useState, useEffect, useCallback } from "react";
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
  Search,
  X,
  Menu,
  Users2,
  MessageSquare,
  Mic,
  BarChart3,
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { communityAPI } from "@/lib/api";

// Interfaces for Community features
interface Discussion {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
    role: string;
    department?: string;
    graduationYear?: number;
  };
  category: string;
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  isPinned: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AMASession {
  id: string;
  title: string;
  description: string;
  host: {
    id: string;
    name: string;
    profileImage?: string;
    role: string;
    company?: string;
    department?: string;
    graduationYear?: number;
  };
  scheduledDate: string;
  duration: number; // in minutes
  maxParticipants: number;
  currentParticipants: number;
  status: "upcoming" | "live" | "completed";
  category: string;
  tags: string[];
  questions: number;
  createdAt: string;
}

interface CommunityPoll {
  id: string;
  question: string;
  description?: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  author: {
    id: string;
    name: string;
    profileImage?: string;
    role: string;
  };
  category: string;
  totalVotes: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState("discussions");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSortBy, setSelectedSortBy] = useState("recent");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form dialog states
  const [discussionDialogOpen, setDiscussionDialogOpen] = useState(false);
  const [amaDialogOpen, setAMADialogOpen] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);

  // Form states
  const [discussionForm, setDiscussionForm] = useState({
    title: "",
    content: "",
    category: "",
  });
  const [amaForm, setAMAForm] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    duration: 60,
    maxParticipants: 50,
    category: "",
  });
  const [pollForm, setPollForm] = useState({
    question: "",
    description: "",
    options: ["", ""],
    category: "",
  });

  // Real data from API
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  const [amaSessions, setAMASessions] = useState<AMASession[]>([]);

  const [polls, setPolls] = useState<CommunityPoll[]>([]);

  const categories = [
    { id: "all", name: "All Categories", icon: Globe },
    { id: "career", name: "Career", icon: Briefcase },
    { id: "technology", name: "Technology", icon: Zap },
    { id: "entrepreneurship", name: "Entrepreneurship", icon: TrendingUp },
    { id: "events", name: "Events", icon: Calendar },
    { id: "academic", name: "Academic", icon: BookOpen },
    { id: "networking", name: "Networking", icon: Users2 },
  ];

  const sortOptions = [
    { id: "recent", name: "Most Recent" },
    { id: "popular", name: "Most Popular" },
    { id: "trending", name: "Trending" },
    { id: "pinned", name: "Pinned" },
  ];

  // API Functions are now handled in the useEffect

  // Load data when component mounts or filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === "discussions") {
          const response = await communityAPI.getDiscussions({
            category: selectedCategory !== "all" ? selectedCategory : undefined,
            sortBy: selectedSortBy,
          });

          if (response.success) {
            setDiscussions(response.data.discussions);
          } else {
            setError("Failed to fetch discussions");
          }
        } else if (activeTab === "ama") {
          const response = await communityAPI.getAMASessions({
            category: selectedCategory !== "all" ? selectedCategory : undefined,
          });

          if (response.success) {
            setAMASessions(response.data.amaSessions);
          } else {
            setError("Failed to fetch AMA sessions");
          }
        } else if (activeTab === "polls") {
          const response = await communityAPI.getPolls({
            category: selectedCategory !== "all" ? selectedCategory : undefined,
            active: true,
          });

          if (response.success) {
            setPolls(response.data.polls);
          } else {
            setError("Failed to fetch polls");
          }
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, selectedCategory, selectedSortBy]);

  const handleCreateDiscussion = async () => {
    try {
      if (
        !discussionForm.title ||
        !discussionForm.content ||
        !discussionForm.category
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const response = await communityAPI.createDiscussion({
        title: discussionForm.title,
        content: discussionForm.content,
        category: discussionForm.category,
        tags: [],
      });

      if (response.success) {
        toast({
          title: "Discussion Created",
          description: "Your discussion has been created successfully!",
        });
        setDiscussionDialogOpen(false);
        setDiscussionForm({ title: "", content: "", category: "" });
        // Refresh the list by triggering useEffect
        setActiveTab(activeTab);
      } else {
        toast({
          title: "Error",
          description: "Failed to create discussion. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create discussion. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAMA = async () => {
    try {
      if (
        !amaForm.title ||
        !amaForm.description ||
        !amaForm.scheduledDate ||
        !amaForm.category
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const response = await communityAPI.createAMASession({
        title: amaForm.title,
        description: amaForm.description,
        scheduledDate: amaForm.scheduledDate,
        duration: amaForm.duration,
        maxParticipants: amaForm.maxParticipants,
        category: amaForm.category,
        tags: [],
      });

      if (response.success) {
        toast({
          title: "AMA Session Created",
          description: "Your AMA session has been created successfully!",
        });
        setAMADialogOpen(false);
        setAMAForm({
          title: "",
          description: "",
          scheduledDate: "",
          duration: 60,
          maxParticipants: 50,
          category: "",
        });
        // Refresh the list by triggering useEffect
        setActiveTab(activeTab);
      } else {
        toast({
          title: "Error",
          description: "Failed to create AMA session. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create AMA session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePoll = async () => {
    try {
      const validOptions = pollForm.options.filter((opt) => opt.trim() !== "");

      if (!pollForm.question || validOptions.length < 2 || !pollForm.category) {
        toast({
          title: "Missing Information",
          description:
            "Please fill in question, at least 2 options, and category.",
          variant: "destructive",
        });
        return;
      }

      const response = await communityAPI.createPoll({
        question: pollForm.question,
        description: pollForm.description || undefined,
        options: validOptions,
        category: pollForm.category,
      });

      if (response.success) {
        toast({
          title: "Poll Created",
          description: "Your poll has been created successfully!",
        });
        setPollDialogOpen(false);
        setPollForm({
          question: "",
          description: "",
          options: ["", ""],
          category: "",
        });
        // Refresh the list by triggering useEffect
        setActiveTab(activeTab);
      } else {
        toast({
          title: "Error",
          description: "Failed to create poll. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create poll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinAMA = async (sessionId: string) => {
    try {
      const response = await communityAPI.joinAMASession(sessionId);

      if (response.success) {
        toast({
          title: "Joined AMA Session",
          description: "You have successfully joined the AMA session!",
        });
        // Refresh the list by triggering useEffect
        setActiveTab(activeTab);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to join AMA session.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to join AMA session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    try {
      const response = await communityAPI.votePoll(pollId, optionId);

      if (response.success) {
        toast({
          title: "Vote Submitted",
          description: "Your vote has been recorded successfully!",
        });
        // Refresh the list by triggering useEffect
        setActiveTab(activeTab);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to submit vote.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper functions for poll options
  const addPollOption = () => {
    setPollForm((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removePollOption = (index: number) => {
    if (pollForm.options.length > 2) {
      setPollForm((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

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
                  <Users2 className="w-5 h-5 mr-2" />
                  Community Hub
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
              <CardDescription>
                Connect, discuss, and engage with alumni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Community */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Community</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search discussions, AMAs, polls..."
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
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Button
                        key={category.id}
                        variant={
                          selectedCategory === category.id ? "default" : "ghost"
                        }
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

              {/* Sort Options */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Sort By</h3>
                <Select
                  value={selectedSortBy}
                  onValueChange={setSelectedSortBy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort option" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <div className="space-y-2">
                  <Dialog
                    open={discussionDialogOpen}
                    onOpenChange={setDiscussionDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Start Discussion
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Start a Discussion</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sidebar-title">Title *</Label>
                          <Input
                            id="sidebar-title"
                            placeholder="Enter discussion title..."
                            value={discussionForm.title}
                            onChange={(e) =>
                              setDiscussionForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="sidebar-content">Content *</Label>
                          <Textarea
                            id="sidebar-content"
                            placeholder="What would you like to discuss?"
                            rows={4}
                            value={discussionForm.content}
                            onChange={(e) =>
                              setDiscussionForm((prev) => ({
                                ...prev,
                                content: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="sidebar-category">Category *</Label>
                          <Select
                            value={discussionForm.category}
                            onValueChange={(value) =>
                              setDiscussionForm((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="career">Career</SelectItem>
                              <SelectItem value="technology">
                                Technology
                              </SelectItem>
                              <SelectItem value="entrepreneurship">
                                Entrepreneurship
                              </SelectItem>
                              <SelectItem value="events">Events</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="networking">
                                Networking
                              </SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setDiscussionDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreateDiscussion}>
                            Create Discussion
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={amaDialogOpen} onOpenChange={setAMADialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Host AMA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Host an AMA Session</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sidebar-ama-title">Title *</Label>
                          <Input
                            id="sidebar-ama-title"
                            placeholder="Enter AMA session title..."
                            value={amaForm.title}
                            onChange={(e) =>
                              setAMAForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="sidebar-ama-description">
                            Description *
                          </Label>
                          <Textarea
                            id="sidebar-ama-description"
                            placeholder="Describe what this AMA session will cover..."
                            rows={3}
                            value={amaForm.description}
                            onChange={(e) =>
                              setAMAForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sidebar-ama-date">
                              Scheduled Date *
                            </Label>
                            <Input
                              id="sidebar-ama-date"
                              type="datetime-local"
                              value={amaForm.scheduledDate}
                              onChange={(e) =>
                                setAMAForm((prev) => ({
                                  ...prev,
                                  scheduledDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="sidebar-ama-duration">
                              Duration (minutes)
                            </Label>
                            <Input
                              id="sidebar-ama-duration"
                              type="number"
                              min="15"
                              max="180"
                              value={amaForm.duration}
                              onChange={(e) =>
                                setAMAForm((prev) => ({
                                  ...prev,
                                  duration: parseInt(e.target.value) || 60,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sidebar-ama-participants">
                              Max Participants
                            </Label>
                            <Input
                              id="sidebar-ama-participants"
                              type="number"
                              min="5"
                              max="100"
                              value={amaForm.maxParticipants}
                              onChange={(e) =>
                                setAMAForm((prev) => ({
                                  ...prev,
                                  maxParticipants:
                                    parseInt(e.target.value) || 50,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="sidebar-ama-category">
                              Category *
                            </Label>
                            <Select
                              value={amaForm.category}
                              onValueChange={(value) =>
                                setAMAForm((prev) => ({
                                  ...prev,
                                  category: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="career">Career</SelectItem>
                                <SelectItem value="technology">
                                  Technology
                                </SelectItem>
                                <SelectItem value="entrepreneurship">
                                  Entrepreneurship
                                </SelectItem>
                                <SelectItem value="events">Events</SelectItem>
                                <SelectItem value="academic">
                                  Academic
                                </SelectItem>
                                <SelectItem value="networking">
                                  Networking
                                </SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setAMADialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreateAMA}>
                            Create AMA Session
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={pollDialogOpen}
                    onOpenChange={setPollDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Create Poll
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Create a Poll</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sidebar-poll-question">
                            Question *
                          </Label>
                          <Input
                            id="sidebar-poll-question"
                            placeholder="What would you like to ask?"
                            value={pollForm.question}
                            onChange={(e) =>
                              setPollForm((prev) => ({
                                ...prev,
                                question: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="sidebar-poll-description">
                            Description (optional)
                          </Label>
                          <Textarea
                            id="sidebar-poll-description"
                            placeholder="Add more context to your poll..."
                            rows={2}
                            value={pollForm.description}
                            onChange={(e) =>
                              setPollForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Poll Options *</Label>
                          <div className="space-y-2">
                            {pollForm.options.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  placeholder={`Option ${index + 1}`}
                                  value={option}
                                  onChange={(e) =>
                                    updatePollOption(index, e.target.value)
                                  }
                                />
                                {pollForm.options.length > 2 && (
                                  <Button
                                    variant="outline"
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
                        </div>
                        <div>
                          <Label htmlFor="sidebar-poll-category">
                            Category *
                          </Label>
                          <Select
                            value={pollForm.category}
                            onValueChange={(value) =>
                              setPollForm((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="career">Career</SelectItem>
                              <SelectItem value="technology">
                                Technology
                              </SelectItem>
                              <SelectItem value="entrepreneurship">
                                Entrepreneurship
                              </SelectItem>
                              <SelectItem value="events">Events</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="networking">
                                Networking
                              </SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setPollDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreatePoll}>
                            Create Poll
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Community Stats */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Community Stats</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Active Discussions</span>
                    <span className="font-medium">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upcoming AMAs</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Polls</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Members</span>
                    <span className="font-medium">2.8K</span>
                  </div>
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
              <h1 className="text-2xl lg:text-3xl font-bold">Community</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Connect, discuss, and engage with our alumni community
              </p>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading community content...</p>
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
              value="discussions"
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="ama" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              AMA Sessions
            </TabsTrigger>
            <TabsTrigger value="polls" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Polls
            </TabsTrigger>
          </TabsList>

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="space-y-4">
            {discussions.length === 0 && !loading ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No discussions yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Be the first to start a discussion in the community!
                </p>
                <Dialog
                  open={discussionDialogOpen}
                  onOpenChange={setDiscussionDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Start Discussion
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Start a Discussion</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter discussion title..."
                          value={discussionForm.title}
                          onChange={(e) =>
                            setDiscussionForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                          id="content"
                          placeholder="What would you like to discuss?"
                          rows={4}
                          value={discussionForm.content}
                          onChange={(e) =>
                            setDiscussionForm((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={discussionForm.category}
                          onValueChange={(value) =>
                            setDiscussionForm((prev) => ({
                              ...prev,
                              category: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="career">Career</SelectItem>
                            <SelectItem value="technology">
                              Technology
                            </SelectItem>
                            <SelectItem value="entrepreneurship">
                              Entrepreneurship
                            </SelectItem>
                            <SelectItem value="events">Events</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="networking">
                              Networking
                            </SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setDiscussionDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateDiscussion}>
                          Create Discussion
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {discussions.map((discussion) => (
                  <Card
                    key={discussion.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <img
                            src={discussion.author.profileImage}
                            alt={discussion.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {discussion.title}
                              </h3>
                              {discussion.isPinned && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Pinned
                                </Badge>
                              )}
                              {discussion.isFeatured && (
                                <Badge variant="default" className="text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mb-2">
                              {discussion.content}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>by {discussion.author.name}</span>
                              <span>•</span>
                              <span>
                                {discussion.author.department}{" "}
                                {discussion.author.graduationYear}
                              </span>
                              <span>•</span>
                              <span>{formatDate(discussion.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <ThumbsUp className="w-4 h-4" />
                            {discussion.likes}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MessageCircle className="w-4 h-4" />
                            {discussion.replies}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Eye className="w-4 h-4" />
                            {discussion.views}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Reply
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AMA Sessions Tab */}
          <TabsContent value="ama" className="space-y-4">
            {amaSessions.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No AMA sessions yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Be the first to host an Ask Me Anything session!
                </p>
                <Dialog open={amaDialogOpen} onOpenChange={setAMADialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Host AMA Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Host an AMA Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ama-title">Title *</Label>
                        <Input
                          id="ama-title"
                          placeholder="Enter AMA session title..."
                          value={amaForm.title}
                          onChange={(e) =>
                            setAMAForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="ama-description">Description *</Label>
                        <Textarea
                          id="ama-description"
                          placeholder="Describe what this AMA session will cover..."
                          rows={3}
                          value={amaForm.description}
                          onChange={(e) =>
                            setAMAForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ama-date">Scheduled Date *</Label>
                          <Input
                            id="ama-date"
                            type="datetime-local"
                            value={amaForm.scheduledDate}
                            onChange={(e) =>
                              setAMAForm((prev) => ({
                                ...prev,
                                scheduledDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ama-duration">
                            Duration (minutes)
                          </Label>
                          <Input
                            id="ama-duration"
                            type="number"
                            min="15"
                            max="180"
                            value={amaForm.duration}
                            onChange={(e) =>
                              setAMAForm((prev) => ({
                                ...prev,
                                duration: parseInt(e.target.value) || 60,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ama-participants">
                            Max Participants
                          </Label>
                          <Input
                            id="ama-participants"
                            type="number"
                            min="5"
                            max="100"
                            value={amaForm.maxParticipants}
                            onChange={(e) =>
                              setAMAForm((prev) => ({
                                ...prev,
                                maxParticipants: parseInt(e.target.value) || 50,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ama-category">Category *</Label>
                          <Select
                            value={amaForm.category}
                            onValueChange={(value) =>
                              setAMAForm((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="career">Career</SelectItem>
                              <SelectItem value="technology">
                                Technology
                              </SelectItem>
                              <SelectItem value="entrepreneurship">
                                Entrepreneurship
                              </SelectItem>
                              <SelectItem value="events">Events</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="networking">
                                Networking
                              </SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setAMADialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateAMA}>
                          Create AMA Session
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {amaSessions.map((session) => (
                  <Card
                    key={session.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <img
                            src={session.host.profileImage}
                            alt={session.host.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {session.title}
                            </h3>
                            <p className="text-gray-600 mb-2">
                              {session.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              <span>Hosted by {session.host.name}</span>
                              <span>•</span>
                              <span>{session.host.company}</span>
                              <span>•</span>
                              <span>
                                {session.host.department}{" "}
                                {session.host.graduationYear}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(session.scheduledDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(session.scheduledDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users2 className="w-4 h-4" />
                                {session.currentParticipants}/
                                {session.maxParticipants}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            session.status === "upcoming"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MessageCircle className="w-4 h-4" />
                            {session.questions} questions
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {session.duration} min
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleJoinAMA(session.id)}
                          >
                            <Mic className="w-4 h-4 mr-1" />
                            Join Session
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Ask Question
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Polls Tab */}
          <TabsContent value="polls" className="space-y-4">
            {polls.length === 0 && !loading ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No polls yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Be the first to create a community poll!
                </p>
                <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Poll
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create a Poll</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="poll-question">Question *</Label>
                        <Input
                          id="poll-question"
                          placeholder="What would you like to ask?"
                          value={pollForm.question}
                          onChange={(e) =>
                            setPollForm((prev) => ({
                              ...prev,
                              question: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="poll-description">
                          Description (optional)
                        </Label>
                        <Textarea
                          id="poll-description"
                          placeholder="Add more context to your poll..."
                          rows={2}
                          value={pollForm.description}
                          onChange={(e) =>
                            setPollForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Poll Options *</Label>
                        <div className="space-y-2">
                          {pollForm.options.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) =>
                                  updatePollOption(index, e.target.value)
                                }
                              />
                              {pollForm.options.length > 2 && (
                                <Button
                                  variant="outline"
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
                      </div>
                      <div>
                        <Label htmlFor="poll-category">Category *</Label>
                        <Select
                          value={pollForm.category}
                          onValueChange={(value) =>
                            setPollForm((prev) => ({
                              ...prev,
                              category: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="career">Career</SelectItem>
                            <SelectItem value="technology">
                              Technology
                            </SelectItem>
                            <SelectItem value="entrepreneurship">
                              Entrepreneurship
                            </SelectItem>
                            <SelectItem value="events">Events</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="networking">
                              Networking
                            </SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setPollDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreatePoll}>Create Poll</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {polls.map((poll) => (
                  <Card
                    key={poll.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {poll.question}
                          </h3>
                          {poll.isActive && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        {poll.description && (
                          <p className="text-gray-600 mb-3">
                            {poll.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span>by {poll.author.name}</span>
                          <span>•</span>
                          <span>{formatDate(poll.createdAt)}</span>
                          <span>•</span>
                          <span>{poll.totalVotes} votes</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        {poll.options.map((option) => {
                          const percentage =
                            poll.totalVotes > 0
                              ? (option.votes / poll.totalVotes) * 100
                              : 0;
                          return (
                            <div key={option.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {option.text}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {option.votes} votes
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {poll.expiresAt && (
                            <span>Expires: {formatDate(poll.expiresAt)}</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVotePoll(poll.id, "1")}
                        >
                          Vote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
