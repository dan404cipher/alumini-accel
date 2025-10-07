import { apiClient } from "./apiClient";
import {
  LikeResponse,
  CommentResponse,
  ShareResponse,
  ShareUrlsResponse,
  Comment,
  Like,
} from "@/components/community/engagement/types";

export const engagementAPI = {
  // Like operations
  async toggleLike(postId: string): Promise<LikeResponse> {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data;
  },

  async getLikeCount(postId: string) {
    const response = await apiClient.get(`/posts/${postId}/likes`);
    return response.data;
  },

  async getLikesWithUsers(
    postId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const response = await apiClient.get(`/posts/${postId}/likes/users`, {
      params: { page, limit },
    });
    return response.data;
  },

  async getUserLikedPosts(page: number = 1, limit: number = 10) {
    const response = await apiClient.get("/users/me/liked-posts", {
      params: { page, limit },
    });
    return response.data;
  },

  // Comment operations
  async getComments(postId: string, page: number = 1, limit: number = 10) {
    const response = await apiClient.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  },

  async createComment(
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<CommentResponse> {
    const response = await apiClient.post(`/posts/${postId}/comments`, {
      content,
      parentCommentId,
    });
    return response.data;
  },

  async updateComment(
    commentId: string,
    content: string
  ): Promise<CommentResponse> {
    const response = await apiClient.put(`/comments/${commentId}`, {
      content,
    });
    return response.data;
  },

  async deleteComment(commentId: string) {
    const response = await apiClient.delete(`/comments/${commentId}`);
    return response.data;
  },

  async getReplies(commentId: string, page: number = 1, limit: number = 5) {
    const response = await apiClient.get(`/comments/${commentId}/replies`, {
      params: { page, limit },
    });
    return response.data;
  },

  async toggleCommentLike(commentId: string) {
    const response = await apiClient.post(`/comments/${commentId}/like`);
    return response.data;
  },

  // Share operations
  async trackShare(postId: string, platform: string): Promise<ShareResponse> {
    const response = await apiClient.post(`/posts/${postId}/share`, {
      platform,
    });
    return response.data;
  },

  async getShareCount(postId: string) {
    const response = await apiClient.get(`/posts/${postId}/shares`);
    return response.data;
  },

  async getShareAnalytics(postId: string) {
    const response = await apiClient.get(`/posts/${postId}/shares/analytics`);
    return response.data;
  },

  async getShareUrls(postId: string): Promise<ShareUrlsResponse> {
    const response = await apiClient.get(`/posts/${postId}/share-urls`);
    return response.data;
  },

  async getTrendingPosts(timeRange: string = "week", limit: number = 10) {
    const response = await apiClient.get("/shares/trending", {
      params: { timeRange, limit },
    });
    return response.data;
  },

  async getUserSharedPosts(page: number = 1, limit: number = 10) {
    const response = await apiClient.get("/users/me/shared-posts", {
      params: { page, limit },
    });
    return response.data;
  },
};
