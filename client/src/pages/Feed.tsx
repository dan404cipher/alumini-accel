import React, { useState, useEffect, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { postAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Pin,
  Star,
  Calendar,
  User,
  Tag,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  canPerformAction,
  getRoleDisplayName,
  getRoleColor,
} from "@/utils/rolePermissions";

const postSchema = z.object({
  title: z.string().min(1, "Post title is required"),
  content: z.string().min(1, "Post content is required"),
  type: z.string().min(1, "Post type is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
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
    role: string;
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

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "",
      category: "",
      tags: [],
    },
  });

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postAPI.getAllPosts({
        type: typeFilter !== "all" ? typeFilter : undefined,
      });

      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        response.data !== null &&
        "posts" in response.data
      ) {
        setPosts((response.data as { posts: Post[] }).posts);
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
  }, [typeFilter, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async (data: PostFormData) => {
    try {
      const postData = {
        title: data.title,
        content: data.content,
        type: data.type,
        category: data.category,
        tags: data.tags,
        isPublic: true,
        allowComments: true,
      };
      const response = await postAPI.createPost(postData);

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

  const handlePinPost = async (postId: string, pinned: boolean) => {
    try {
      const response = await postAPI.updatePost(postId, { pinned });
      if (response.success) {
        toast({
          title: "Success",
          description: `Post ${pinned ? "pinned" : "unpinned"} successfully`,
        });
        fetchPosts();
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const handleFeaturePost = async (postId: string, featured: boolean) => {
    try {
      const response = await postAPI.updatePost(postId, { featured });
      if (response.success) {
        toast({
          title: "Success",
          description: `Post ${
            featured ? "featured" : "unfeatured"
          } successfully`,
        });
        fetchPosts();
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const handleEditPost = (post: Post) => {
    // Set form values for editing
    form.reset({
      title: post.title,
      content: post.content,
      type: post.type,
      category: post.category || "",
      tags: post.tags,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const response = await postAPI.deletePost(postId);
        if (response.success) {
          toast({
            title: "Success",
            description: "Post deleted successfully",
          });
          fetchPosts();
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive",
        });
      }
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

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <>
        <Navigation activeTab="feed" onTabChange={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading feed...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation activeTab="feed" onTabChange={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alumni Feed</h1>
              <p className="text-gray-600">
                Stay connected with your alumni community
              </p>
              {user && (
                <div className="mt-2">
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
              )}
            </div>
            {user && hasPermission(user.role, "canCreatePosts") && (
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                    <DialogDescription>
                      Share an update, achievement, or help request with the
                      community
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleCreatePost)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Post Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter post title"
                                {...field}
                              />
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
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write your post content here..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
            )}
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

                {/* Post Management Actions */}
                {user && (
                  <div className="absolute top-2 right-2 z-10 flex space-x-1">
                    {/* Pin/Unpin Post */}
                    {hasPermission(user.role, "canPinPosts") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePinPost(post._id, !post.pinned)}
                        className="h-8 w-8 p-0"
                      >
                        <Pin
                          className={`w-4 h-4 ${
                            post.pinned ? "text-blue-600" : "text-gray-400"
                          }`}
                        />
                      </Button>
                    )}

                    {/* Feature/Unfeature Post */}
                    {hasPermission(user.role, "canFeaturePosts") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleFeaturePost(post._id, !post.featured)
                        }
                        className="h-8 w-8 p-0"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            post.featured ? "text-yellow-600" : "text-gray-400"
                          }`}
                        />
                      </Button>
                    )}

                    {/* Edit Post */}
                    {canPerformAction(
                      user.role,
                      "editPosts",
                      post.authorId.role,
                      post.authorId._id,
                      user._id
                    ) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </Button>
                    )}

                    {/* Delete Post */}
                    {canPerformAction(
                      user.role,
                      "deletePosts",
                      post.authorId.role,
                      post.authorId._id,
                      user._id
                    ) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post._id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}

                <CardHeader>
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
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
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
                    : "Be the first to share something with the community!"}
                </p>
                {!searchTerm &&
                  typeFilter === "all" &&
                  user &&
                  hasPermission(user.role, "canCreatePosts") && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Feed;
