import express from "express";
import {
  createFund,
  getAllFunds,
  getFundById,
  updateFund,
  deleteFund,
  getFundStats,
} from "../controllers/fundController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Fund routes
router.post("/", createFund);
router.get("/", getAllFunds);
router.get("/:id", getFundById);
router.put("/:id", updateFund);
router.delete("/:id", deleteFund);
router.get("/:id/stats", getFundStats);

export default router;

