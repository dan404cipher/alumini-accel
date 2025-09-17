import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { postAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Pin,
  Star,
  MoreHorizontal,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const postSchema = z.object({
  title: z.string().min(1, "Post title is required"),
  content: z.string().min(1, "Post content is required"),
  type: z.string().min(1, "Post type is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  allowComments: z.boolean().default(true),
  pinned: z.boolean().default(false),
  featured: z.boolean().default(false),
  visibility: z.string().default("public"),
  scheduledAt: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface Post {
  _id: string;
  title: string;
  content: string;
  type: string;
  category?: string;
  tags: string[];
  images: string[];
  documents: string[];
  isPublic: boolean;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  status: string;
  visibility: string;
  authorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  tenantId: {
    _id: string;
    name: string;
    domain: string;
    logo?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdAt: string;
  publishedAt?: string;
}

const FeedManagement: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "",
      category: "",
      tags: [],
      isPublic: true,
      allowComments: true,
      pinned: false,
      featured: false,
      visibility: "public",
      scheduledAt: "",
    },
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getAllPosts({
        type: typeFilter !== "all" ? typeFilter : undefined,
      });

      if (response.success) {
        setPosts(response.data.posts);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch posts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (data: PostFormData) => {
    try {
      const response = await postAPI.createPost(data);

      if (response.success) {
        toast({
          title: "Success",
          description: "Post created successfully",
        });
        setIsCreateDialogOpen(false);
        form.reset();
        fetchPosts();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await postAPI.deletePost(postId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
        fetchPosts();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const response = await postAPI.likePost(postId);
      if (response.success) {
        fetchPosts(); // Refresh to get updated like count
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      const response = await postAPI.sharePost(postId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Post shared successfully",
        });
        fetchPosts(); // Refresh to get updated share count
      }
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      announcement: "bg-blue-100 text-blue-800",
      update: "bg-green-100 text-green-800",
      achievement: "bg-yellow-100 text-yellow-800",
      help_request: "bg-orange-100 text-orange-800",
      event: "bg-purple-100 text-purple-800",
      job: "bg-indigo-100 text-indigo-800",
      general: "bg-gray-100 text-gray-800",
    };

    const colorClass =
      typeColors[type as keyof typeof typeColors] || typeColors.general;
    return <Badge className={colorClass}>{type.replace("_", " ")}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Draft" },
      published: { variant: "default" as const, label: "Published" },
      archived: { variant: "outline" as const, label: "Archived" },
      deleted: { variant: "destructive" as const, label: "Deleted" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feed Management</h2>
          <p className="text-gray-600">Manage posts and announcements</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Create a new post or announcement
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreatePost)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter post title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select post type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="announcement">
                                Announcement
                              </SelectItem>
                              <SelectItem value="update">Update</SelectItem>
                              <SelectItem value="achievement">
                                Achievement
                              </SelectItem>
                              <SelectItem value="help_request">
                                Help Request
                              </SelectItem>
                              <SelectItem value="event">Event</SelectItem>
                              <SelectItem value="job">Job</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter category" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Settings</h3>
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="alumni_only">
                                Alumni Only
                              </SelectItem>
                              <SelectItem value="staff_only">
                                Staff Only
                              </SelectItem>
                              <SelectItem value="admin_only">
                                Admin Only
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scheduledAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule Post (Optional)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Content</h3>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write your post content here..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Public Post
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Make this post visible to everyone
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="allowComments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Comments
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Allow users to comment on this post
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pinned"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Pin Post
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Pin this post to the top of the feed
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Featured Post
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Highlight this post as featured
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Post</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="achievement">Achievement</SelectItem>
            <SelectItem value="help_request">Help Request</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="job">Job</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <Card key={post._id} className="relative">
            {post.pinned && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-blue-100 text-blue-800">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              </div>
            )}
            {post.featured && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}

            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {post.authorId.profilePicture ? (
                      <img
                        src={post.authorId.profilePicture}
                        alt={`${post.authorId.firstName} ${post.authorId.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {post.authorId.firstName} {post.authorId.lastName}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {getTypeBadge(post.type)}
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedPost(post);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeletePost(post._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikePost(post._id)}
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      {post.engagement.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.engagement.comments}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSharePost(post._id)}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      {post.engagement.shares}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span>{post.engagement.views} views</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first post to get started"}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeedManagement;
