import express from "express";
import eventController from "../controllers/eventController";
import {
  validateEvent,
  validateId,
  validateRequest,
} from "../middleware/validation";
import {
  authenticateToken,
  requireCoordinator,
  requireAlumni,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import multer from "multer";

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/events/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @route   GET /api/v1/events
// @desc    Get all events
// @access  Private
router.get("/", authenticateToken, asyncHandler(eventController.getAllEvents));

// @route   GET /api/v1/events/:id
// @desc    Get event by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(eventController.getEventById)
);

// @route   POST /api/v1/events
// @desc    Create event
// @access  Private/Coordinator
router.post(
  "/",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF,
    UserRole.ALUMNI
  ),
  ...validateRequest(validateEvent),
  asyncHandler(eventController.createEvent)
);

// @route   POST /api/v1/events/with-image
// @desc    Create event with image upload
// @access  Private/Coordinator
router.post(
  "/with-image",
  upload.single("image") as any,
  (req, res, next) => {
    console.log("=== MULTER MIDDLEWARE DEBUG ===");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request file:", req.file);
    console.log("Request files:", req.files);
    console.log("Content-Type:", req.get("Content-Type"));
    next();
  },
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF,
    UserRole.ALUMNI
  ),
  asyncHandler(eventController.createEventWithImage)
);

// @route   PUT /api/v1/events/:id
// @desc    Update event
// @access  Private/Coordinator
router.put(
  "/:id",
  authenticateToken,
  requireCoordinator,
  ...validateRequest([...validateId, ...validateEvent]),
  asyncHandler(eventController.updateEvent)
);

// @route   PUT /api/v1/events/:id/with-image
// @desc    Update event with image upload
// @access  Private/Coordinator
router.put(
  "/:id/with-image",
  upload.single("image") as any,
  authenticateToken,
  requireCoordinator,
  ...validateRequest(validateId),
  asyncHandler(eventController.updateEventWithImage)
);

// @route   DELETE /api/v1/events/:id
// @desc    Delete event
// @access  Private/Coordinator
router.delete(
  "/:id",
  authenticateToken,
  requireCoordinator,
  ...validateRequest(validateId),
  asyncHandler(eventController.deleteEvent)
);

// @route   POST /api/v1/events/:id/register
// @desc    Register for event
// @access  Private
router.post(
  "/:id/register",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(eventController.registerForEvent)
);

// @route   DELETE /api/v1/events/:id/unregister
// @desc    Unregister from event
// @access  Private
router.delete(
  "/:id/unregister",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(eventController.unregisterFromEvent)
);

// @route   POST /api/v1/events/:id/feedback
// @desc    Submit event feedback
// @access  Private
router.post(
  "/:id/feedback",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(eventController.submitFeedback)
);

// @route   GET /api/v1/events/upcoming
// @desc    Get upcoming events
// @access  Private
router.get(
  "/upcoming",
  authenticateToken,
  asyncHandler(eventController.getUpcomingEvents)
);

// @route   GET /api/v1/events/search
// @desc    Search events
// @access  Private
router.get(
  "/search",
  authenticateToken,
  asyncHandler(eventController.searchEvents)
);

export default router;
