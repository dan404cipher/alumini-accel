import express from "express";
import { authenticateToken as authenticate } from "../middleware/auth";
import { validateId } from "../middleware/validation";
import {
  createReport,
  getEntityReports,
  getPendingReports,
  getCommunityReports,
  updateReportStatus,
  getUserReports,
} from "../controllers/reportController";

const router = express.Router();

// Protected routes
router.use(authenticate);

// Report management
router.post("/", createReport);
router.get("/user", getUserReports);
router.get("/pending", getPendingReports);
router.get("/community/:communityId", getCommunityReports);
router.get("/entity/:entityId/:entityType", validateId, getEntityReports);
router.put("/:reportId", validateId, updateReportStatus);

export default router;
