// Engagement system types
export interface Like {
  _id: string;
  postId: string;
  userId: string;
  createdAt: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  likes: string[];
  likeCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  replies?: Comment[];
  repliesCount?: number;
}

export interface Share {
  _id: string;
  postId: string;
  userId?: string;
  platform:
    | "internal"
    | "facebook"
    | "twitter"
    | "linkedin"
    | "copy_link"
    | "whatsapp"
    | "telegram";
  metadata?: any;
  createdAt: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface EngagementStats {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
}

export interface LikeResponse {
  success: boolean;
  data: {
    liked: boolean;
    likeCount: number;
  };
}

export interface CommentResponse {
  success: boolean;
  data: {
    comment: Comment;
    commentCount: number;
  };
}

export interface ShareResponse {
  success: boolean;
  data: {
    shareCount: number;
    platform: string;
  };
}

export interface ShareUrls {
  facebook: string;
  twitter: string;
  linkedin: string;
  whatsapp: string;
  telegram: string;
  copy_link: string;
}

export interface ShareUrlsResponse {
  success: boolean;
  data: {
    shareUrls: ShareUrls;
    postUrl: string;
    title: string;
    description: string;
    author: string;
  };
}

export interface EngagementState {
  likes: {
    count: number;
    isLiked: boolean;
    loading: boolean;
  };
  comments: {
    items: Comment[];
    count: number;
    loading: boolean;
    submitting: boolean;
  };
  shares: {
    count: number;
    loading: boolean;
  };
}
