import { Request, Response } from "express";
import leaderboardService from "../services/leaderboardService";
import { AuthenticatedRequest } from "../types";

const leaderboardController = {
  async getLeaderboard(req: AuthenticatedRequest, res: Response) {
    try {
      const type = (req.query.type as string) || "points";
      const filters = {
        tenantId: req.tenantId,
        department: req.query.department as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        period: (req.query.period as "all" | "month" | "year") || "all",
      };

      let data;

      switch (type) {
        case "points":
          data = await leaderboardService.getPointsLeaderboard(filters);
          break;
        case "mentors":
          data = await leaderboardService.getMentorsLeaderboard(filters);
          break;
        case "donors":
          data = await leaderboardService.getDonorsLeaderboard(filters);
          break;
        case "volunteers":
          data = await leaderboardService.getVolunteersLeaderboard(filters);
          break;
        case "departments":
          data = await leaderboardService.getDepartmentLeaderboard(filters);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid leaderboard type. Must be: points, mentors, donors, volunteers, or departments",
          });
      }

      return res.json({
        success: true,
        data: {
          type,
          leaderboard: data,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get leaderboard",
      });
    }
  },
};

export default leaderboardController;

