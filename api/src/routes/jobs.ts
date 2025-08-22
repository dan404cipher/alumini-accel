import express from 'express';
import jobController from '@/controllers/jobController';
import { validateJobPost, validateId } from '@/middleware/validation';
import { authenticateToken, requireAlumni } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// @route   GET /api/v1/jobs
// @desc    Get all job posts
// @access  Private
router.get('/', authenticateToken, asyncHandler(jobController.getAllJobs));

// @route   GET /api/v1/jobs/:id
// @desc    Get job post by ID
// @access  Private
router.get('/:id', authenticateToken, validateId, asyncHandler(jobController.getJobById));

// @route   POST /api/v1/jobs
// @desc    Create job post
// @access  Private/Alumni
router.post('/', authenticateToken, requireAlumni, validateJobPost, asyncHandler(jobController.createJob));

// @route   PUT /api/v1/jobs/:id
// @desc    Update job post
// @access  Private/Alumni
router.put('/:id', authenticateToken, requireAlumni, validateId, validateJobPost, asyncHandler(jobController.updateJob));

// @route   DELETE /api/v1/jobs/:id
// @desc    Delete job post
// @access  Private/Alumni
router.delete('/:id', authenticateToken, requireAlumni, validateId, asyncHandler(jobController.deleteJob));

// @route   POST /api/v1/jobs/:id/apply
// @desc    Apply for job
// @access  Private
router.post('/:id/apply', authenticateToken, validateId, asyncHandler(jobController.applyForJob));

// @route   GET /api/v1/jobs/search
// @desc    Search jobs
// @access  Private
router.get('/search', authenticateToken, asyncHandler(jobController.searchJobs));

// @route   GET /api/v1/jobs/company/:company
// @desc    Get jobs by company
// @access  Private
router.get('/company/:company', authenticateToken, asyncHandler(jobController.getJobsByCompany));

// @route   GET /api/v1/jobs/location/:location
// @desc    Get jobs by location
// @access  Private
router.get('/location/:location', authenticateToken, asyncHandler(jobController.getJobsByLocation));

// @route   GET /api/v1/jobs/type/:type
// @desc    Get jobs by type
// @access  Private
router.get('/type/:type', authenticateToken, asyncHandler(jobController.getJobsByType));

export default router; 