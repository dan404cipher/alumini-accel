import { Request, Response } from "express";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { logger } from "@/utils/logger";
import { asyncHandler } from "@/middleware/errorHandler";

// @desc    Get all posts (feed)
// @route   GET /api/v1/posts
// @access  Private
export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as string;
  const category = req.query.category as string;
  const featured = req.query.featured as string;
  const tenantId = req.user?.tenantId;

  const query: any = {
    status: "published",
    tenantId: tenantId,
  };

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  if (featured === "true") {
    query.featured = true;
  }

  const skip = (page - 1) * limit;

  const posts = await Post.find(query)
    .populate("authorId", "firstName lastName email profilePicture")
    .populate("tenantId", "name domain logo")
    .select("-__v")
    .sort({ pinned: -1, featured: -1, publishedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(query);

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    },
  });
});

// @desc    Get post by ID
// @route   GET /api/v1/posts/:id
// @access  Private
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id)
    .populate("authorId", "firstName lastName email profilePicture")
    .populate("tenantId", "name domain logo")
    .select("-__v");

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Check tenant access
  if (
    req.user?.role !== "super_admin" &&
    post.tenantId.toString() !== req.user?.tenantId?.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  // Increment view count manually
  post.engagement.views += 1;
  await post.save();

  // Get comments
  const comments = await Comment.find({
    postId: post._id,
    status: "active",
  })
    .populate("authorId", "firstName lastName email profilePicture")
    .populate("parentId")
    .select("-__v")
    .sort({ createdAt: 1 })
    .limit(50);

  return res.json({
    success: true,
    data: {
      post,
      comments,
    },
  });
});

// @desc    Create new post
// @route   POST /api/v1/posts
// @access  Private/Admin/HOD/Staff/Alumni
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    content,
    type,
    category,
    tags,
    images,
    documents,
    isPublic,
    allowComments,
    pinned,
    featured,
    visibility,
    targetAudience,
    scheduledAt,
  } = req.body;

  const post = new Post({
    title,
    content,
    tenantId: req.user?.tenantId,
    authorId: req.user?.id,
    type,
    category,
    tags: tags || [],
    images: images || [],
    documents: documents || [],
    isPublic: isPublic ?? true,
    allowComments: allowComments ?? true,
    pinned: pinned ?? false,
    featured: featured ?? false,
    visibility: visibility || "public",
    targetAudience: {
      roles: targetAudience?.roles || [],
      batches: targetAudience?.batches || [],
      departments: targetAudience?.departments || [],
    },
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  });

  await post.save();

  const populatedPost = await Post.findById(post._id)
    .populate("authorId", "firstName lastName email profilePicture")
    .populate("tenantId", "name domain logo")
    .select("-__v");

  return res.status(201).json({
    success: true,
    message: "Post created successfully",
    data: populatedPost,
  });
});

// @desc    Update post
// @route   PUT /api/v1/posts/:id
// @access  Private/Admin/HOD/Staff (or post author)
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Check access
  const isAuthor = post.authorId.toString() === req.user?.id?.toString();
  const isAdmin = [
    "super_admin",
    "admin",
    "college_admin",
    "hod",
    "staff",
  ].includes(req.user?.role);

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  const {
    title,
    content,
    type,
    category,
    tags,
    images,
    documents,
    isPublic,
    allowComments,
    pinned,
    featured,
    visibility,
    targetAudience,
    scheduledAt,
    status,
  } = req.body;

  // Update fields
  if (title) post.title = title;
  if (content) post.content = content;
  if (type) post.type = type;
  if (category !== undefined) post.category = category;
  if (tags) post.tags = tags;
  if (images) post.images = images;
  if (documents) post.documents = documents;
  if (isPublic !== undefined) post.isPublic = isPublic;
  if (allowComments !== undefined) post.allowComments = allowComments;
  if (pinned !== undefined) post.pinned = pinned;
  if (featured !== undefined) post.featured = featured;
  if (visibility) post.visibility = visibility;
  if (targetAudience)
    post.targetAudience = { ...post.targetAudience, ...targetAudience };
  if (scheduledAt) post.scheduledAt = new Date(scheduledAt);
  if (status) post.status = status;

  await post.save();

  const populatedPost = await Post.findById(post._id)
    .populate("authorId", "firstName lastName email profilePicture")
    .populate("tenantId", "name domain logo")
    .select("-__v");

  return res.json({
    success: true,
    message: "Post updated successfully",
    data: populatedPost,
  });
});

// @desc    Delete post
// @route   DELETE /api/v1/posts/:id
// @access  Private/Admin/HOD/Staff (or post author)
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Check access
  const isAuthor = post.authorId.toString() === req.user?.id?.toString();
  const isAdmin = [
    "super_admin",
    "admin",
    "college_admin",
    "hod",
    "staff",
  ].includes(req.user?.role);

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  await Post.findByIdAndDelete(req.params.id);

  return res.json({
    success: true,
    message: "Post deleted successfully",
  });
});

// @desc    Like post
// @route   POST /api/v1/posts/:id/like
// @access  Private
export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Increment likes manually
  post.engagement.likes += 1;
  await post.save();

  return res.json({
    success: true,
    message: "Post liked successfully",
    data: { likes: post.engagement.likes },
  });
});

// @desc    Share post
// @route   POST /api/v1/posts/:id/share
// @access  Private
export const sharePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Increment shares manually
  post.engagement.shares += 1;
  await post.save();

  return res.json({
    success: true,
    message: "Post shared successfully",
    data: { shares: post.engagement.shares },
  });
});

export default {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  sharePost,
};
