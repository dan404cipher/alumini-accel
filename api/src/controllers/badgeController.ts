import { Request, Response } from "express";
import Badge from "../models/Badge";
import { AuthenticatedRequest } from "../types";

const badgeController = {
  async list(req: Request, res: Response) {
    try {
      const query: Record<string, unknown> = {};

      if (typeof req.query.isActive === "string") {
        query.isActive = req.query.isActive === "true";
      }

      if (typeof req.query.category === "string" && req.query.category.trim()) {
        query["category"] = req.query.category.trim();
      }

      const badges = await Badge.find(query).sort({ name: 1 });

      return res.json({
        success: true,
        data: { badges },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to load badges",
      });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        name,
        description,
        category,
        icon,
        color,
        points,
        isActive,
        isRare,
        criteria,
      } = req.body || {};

      if (!name?.trim() || !description?.trim() || !category || !icon?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name, description, category, and icon are required.",
        });
      }

      const badge = await Badge.create({
        name: name.trim(),
        description: description.trim(),
        category,
        icon,
        color: color || "#3B82F6",
        points: typeof points === "number" ? points : 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
        isRare: Boolean(isRare),
        criteria: {
          type: criteria?.type || "manual",
          value:
            typeof criteria?.value === "number" ? criteria.value : 0,
          description:
            criteria?.description?.trim() || description.trim(),
        },
      });

      return res.status(201).json({
        success: true,
        message: "Badge created successfully",
        data: { badge },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create badge",
      });
    }
  },
};

export default badgeController;


