import express from "express";
import alumniController from "../controllers/alumniController";
import {
  validateAlumniProfile,
  validateAlumniProfileUpdate,
  validateAlumniSkillsInterests,
  validateId,
  validateRequest,
  addInternshipValidation,
  addResearchValidation,
  addCertificationValidation,
} from "../middleware/validation";
import {
  authenticateToken,
  requireAlumni,
  requireAdmin,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  uploadOptionalDocument,
  uploadMixedDocuments,
} from "../middleware/fileUpload";

const router = express.Router();

// @route   GET /api/v1/alumni/users
// @desc    Get all alumni directory
// @access  Public
router.get("/users", asyncHandler(alumniController.getAllUsersDirectory));

// @route   GET /api/v1/alumni/user/:id
// @desc    Get alumni by ID
// @access  Public
router.get("/user/:id", asyncHandler(alumniController.getUserById));

// @route   GET /api/v1/alumni/public
// @desc    Get public alumni directory data
// @access  Public
router.get("/public", asyncHandler(alumniController.getPublicAlumniDirectory));

// @route   GET /api/v1/alumni
// @desc    Get all alumni profiles
// @access  Private (Alumni or Admin)
router.get("/", authenticateToken, asyncHandler(alumniController.getAllAlumni));

// @route   GET /api/v1/alumni/mentors
// @desc    Get alumni mentors
// @access  Private
router.get(
  "/mentors",
  authenticateToken,
  asyncHandler(alumniController.getMentors)
);

// @route   GET /api/v1/alumni/:id
// @desc    Get alumni profile by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(alumniController.getAlumniById)
);

// @route   POST /api/v1/alumni/profile
// @desc    Create alumni profile
// @access  Private/Alumni
router.post(
  "/profile",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateAlumniProfile),
  asyncHandler(alumniController.createProfile)
);

// @route   PUT /api/v1/alumni/profile
// @desc    Update alumni profile
// @access  Private/Alumni
router.put(
  "/profile",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateAlumniProfileUpdate),
  asyncHandler(alumniController.updateProfile)
);

// @route   POST /api/v1/alumni/register-mentor
// @desc    Register as mentor
// @access  Private/Alumni
router.post(
  "/register-mentor",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.registerAsMentor)
);

// @route   PUT /api/v1/alumni/profile/skills-interests
// @desc    Update alumni skills and interests only
// @access  Private/Alumni
router.put(
  "/profile/skills-interests",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateAlumniSkillsInterests),
  asyncHandler(alumniController.updateSkillsInterests)
);

// @route   POST /api/v1/alumni/profile/projects
// @desc    Add project to alumni profile
// @access  Private/Alumni
router.post(
  "/profile/projects",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateAlumniSkillsInterests), // Reuse validation for now
  asyncHandler(alumniController.addProject)
);

// @route   PUT /api/v1/alumni/profile/projects/:projectId
// @desc    Update project in alumni profile
// @access  Private/Alumni
router.put(
  "/profile/projects/:projectId",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.updateProject)
);

// @route   DELETE /api/v1/alumni/profile/projects/:projectId
// @desc    Delete project from alumni profile
// @access  Private/Alumni
router.delete(
  "/profile/projects/:projectId",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.deleteProject)
);

// @route   POST /api/v1/alumni/profile/internships
// @desc    Add internship to alumni profile
// @access  Private/Alumni
router.post(
  "/profile/internships",
  authenticateToken,
  requireAlumni,
  uploadOptionalDocument("certificateFile"),
  ...validateRequest(addInternshipValidation),
  asyncHandler(alumniController.addInternship)
);

// @route   PUT /api/v1/alumni/profile/internships/:internshipId
// @desc    Update internship in alumni profile
// @access  Private/Alumni
router.put(
  "/profile/internships/:internshipId",
  authenticateToken,
  requireAlumni,
  uploadOptionalDocument("certificateFile"),
  ...validateRequest(addInternshipValidation),
  asyncHandler(alumniController.updateInternship)
);

// @route   DELETE /api/v1/alumni/profile/internships/:internshipId
// @desc    Delete internship from alumni profile
// @access  Private/Alumni
router.delete(
  "/profile/internships/:internshipId",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.deleteInternship)
);

// @route   POST /api/v1/alumni/profile/research
// @desc    Add research work to alumni profile
// @access  Private/Alumni
router.post(
  "/profile/research",
  authenticateToken,
  requireAlumni,
  uploadMixedDocuments([
    { name: "publicationFile", maxCount: 1 },
    { name: "conferenceFile", maxCount: 1 },
  ]),
  ...validateRequest(addResearchValidation),
  asyncHandler(alumniController.addResearch)
);

// @route   PUT /api/v1/alumni/profile/research/:researchId
// @desc    Update research work in alumni profile
// @access  Private/Alumni
router.put(
  "/profile/research/:researchId",
  authenticateToken,
  requireAlumni,
  uploadMixedDocuments([
    { name: "publicationFile", maxCount: 1 },
    { name: "conferenceFile", maxCount: 1 },
  ]),
  ...validateRequest(addResearchValidation),
  asyncHandler(alumniController.updateResearch)
);

// @route   DELETE /api/v1/alumni/profile/research/:researchId
// @desc    Delete research work from alumni profile
// @access  Private/Alumni
router.delete(
  "/profile/research/:researchId",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.deleteResearch)
);

// @route   POST /api/v1/alumni/profile/certifications
// @desc    Add certification to alumni profile
// @access  Private/Alumni
router.post(
  "/profile/certifications",
  authenticateToken,
  requireAlumni,
  uploadOptionalDocument("credentialFile"),
  ...validateRequest(addCertificationValidation),
  asyncHandler(alumniController.addCertification)
);

// @route   PUT /api/v1/alumni/profile/certifications/:certificationId
// @desc    Update certification in alumni profile
// @access  Private/Alumni
router.put(
  "/profile/certifications/:certificationId",
  authenticateToken,
  requireAlumni,
  uploadOptionalDocument("credentialFile"),
  ...validateRequest(addCertificationValidation),
  asyncHandler(alumniController.updateCertification)
);

// @route   DELETE /api/v1/alumni/profile/certifications/:certificationId
// @desc    Delete certification from alumni profile
// @access  Private/Alumni
router.delete(
  "/profile/certifications/:certificationId",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.deleteCertification)
);

// @route   GET /api/v1/alumni/search
// @desc    Search alumni
// @access  Private
router.get(
  "/search",
  authenticateToken,
  asyncHandler(alumniController.searchAlumni)
);

// @route   GET /api/v1/alumni/batch/:year
// @desc    Get alumni by batch year
// @access  Private
router.get(
  "/batch/:year",
  authenticateToken,
  asyncHandler(alumniController.getAlumniByBatch)
);

// @route   GET /api/v1/alumni/hiring
// @desc    Get alumni who are hiring
// @access  Private
router.get(
  "/hiring",
  authenticateToken,
  asyncHandler(alumniController.getHiringAlumni)
);

// Career Timeline routes
// @route   POST /api/v1/alumni/profile/career-timeline
// @desc    Add career timeline item to alumni profile
// @access  Private/Alumni
router.post(
  "/profile/career-timeline",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.addCareerTimelineItem)
);

// @route   PUT /api/v1/alumni/profile/career-timeline/:itemId
// @desc    Update career timeline item in alumni profile
// @access  Private/Alumni
router.put(
  "/profile/career-timeline/:itemId",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.updateCareerTimelineItem)
);

// @route   DELETE /api/v1/alumni/profile/career-timeline/:itemId
// @desc    Delete career timeline item from alumni profile
// @access  Private/Alumni
router.delete(
  "/profile/career-timeline/:itemId",
  authenticateToken,
  requireAlumni,
  asyncHandler(alumniController.deleteCareerTimelineItem)
);

export default router;
