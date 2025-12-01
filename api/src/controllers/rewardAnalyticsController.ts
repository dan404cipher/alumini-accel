import { Request, Response } from "express";
import rewardAnalyticsService from "../services/rewardAnalyticsService";
import { AuthenticatedRequest } from "../types";

const rewardAnalyticsController = {
  async getPointsDistribution(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        tenantId: req.tenantId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        category: req.query.category as string | undefined,
      };

      const data = await rewardAnalyticsService.getPointsDistribution(filters);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get points distribution",
      });
    }
  },

  async getTaskCompletion(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        tenantId: req.tenantId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        category: req.query.category as string | undefined,
      };

      const data = await rewardAnalyticsService.getTaskCompletionStats(filters);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get task completion stats",
      });
    }
  },

  async getRewardClaims(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        tenantId: req.tenantId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };

      const data = await rewardAnalyticsService.getRewardClaimsAnalytics(filters);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get reward claims",
      });
    }
  },

  async getDepartmentAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        tenantId: req.tenantId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        department: req.query.department as string | undefined,
      };

      const data = await rewardAnalyticsService.getDepartmentAnalytics(filters);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get department analytics",
      });
    }
  },

  async getAlumniActivity(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user?._id?.toString();
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const filters = {
        tenantId: req.tenantId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };

      const data = await rewardAnalyticsService.getAlumniActivityHistory(userId, filters);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get alumni activity",
      });
    }
  },

  async getRewardStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        tenantId: req.tenantId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };

      const data = await rewardAnalyticsService.getRewardStatistics(filters);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get reward statistics",
      });
    }
  },
};

export default rewardAnalyticsController;

