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

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
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

      const badge = await Badge.findById(id);
      if (!badge) {
        return res.status(404).json({
          success: false,
          message: "Badge not found",
        });
      }

      // Update fields if provided
      if (name?.trim()) badge.name = name.trim();
      if (description?.trim()) badge.description = description.trim();
      if (category) badge.category = category;
      if (icon?.trim()) badge.icon = icon.trim();
      if (color) badge.color = color;
      if (typeof points === "number") badge.points = points;
      if (typeof isActive === "boolean") badge.isActive = isActive;
      if (typeof isRare === "boolean") badge.isRare = isRare;
      if (criteria) {
        badge.criteria = {
          type: criteria.type || badge.criteria.type,
          value: typeof criteria.value === "number" ? criteria.value : badge.criteria.value,
          description: criteria.description?.trim() || badge.criteria.description,
        };
      }

      await badge.save();

      return res.json({
        success: true,
        message: "Badge updated successfully",
        data: { badge },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update badge",
      });
    }
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const badge = await Badge.findById(id);
      if (!badge) {
        return res.status(404).json({
          success: false,
          message: "Badge not found",
        });
      }

      // Check if badge is being used in any rewards
      const { Reward } = await import("../models/Reward");
      const rewardsUsingBadge = await Reward.find({
        $or: [
          { badge: id },
          { "tasks.badge": id },
        ],
      });

      if (rewardsUsingBadge.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete badge. It is being used in ${rewardsUsingBadge.length} reward(s).`,
        });
      }

      await Badge.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: "Badge deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete badge",
      });
    }
  },
};

export default badgeController;


