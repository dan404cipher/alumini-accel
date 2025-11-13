import { Request, Response } from "express";
import JobApplication from "../models/JobApplication";
import JobPost from "../models/JobPost";
import User from "../models/User";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types";

// Apply for a job
export const applyForJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || req.user?._id;
    const tenantId = req.user?.tenantId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    // Check if job exists and is active
    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Allow applying to both active and pending jobs
    if (job.status !== "active" && job.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Job post is not available for applications. Only active or pending jobs can accept applications.",
      });
    }

    // Prevent users from applying to their own jobs
    if (job.postedBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own job post",
      });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      jobId: new mongoose.Types.ObjectId(jobId),
      applicantId: new mongoose.Types.ObjectId(userId),
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Validate required fields
    if (
      !req.body.skills ||
      !Array.isArray(req.body.skills) ||
      req.body.skills.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one skill is required",
      });
    }

    if (!req.body.experience || req.body.experience.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Experience description is required",
      });
    }

    if (
      !req.body.contactDetails ||
      !req.body.contactDetails.name ||
      !req.body.contactDetails.email ||
      !req.body.contactDetails.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Contact details (name, email, phone) are required",
      });
    }

    // Create new application
    const application = new JobApplication({
      jobId: new mongoose.Types.ObjectId(jobId),
      applicantId: new mongoose.Types.ObjectId(userId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
      resume: req.body.resume,
      skills: req.body.skills,
      experience: req.body.experience,
      contactDetails: {
        name: req.body.contactDetails.name,
        email: req.body.contactDetails.email,
        phone: req.body.contactDetails.phone,
      },
      message: req.body.message || "",
      status: "Applied",
    });

    await application.save();

    // Also add the application to the JobPost's applications array
    const jobPost = await JobPost.findById(jobId);
    if (jobPost) {
      // Check if application already exists in the job's applications array
      const existingApplication = jobPost.applications.find(
        (app: any) => app.applicantId.toString() === userId
      );

      if (!existingApplication) {
        jobPost.applications.push({
          applicantId: userId,
          appliedAt: new Date(),
          status: "pending",
          resume: req.body.resume,
          coverLetter: req.body.message,
        });
        await jobPost.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        _id: application._id,
        jobId: application.jobId,
        applicantId: application.applicantId,
        status: application.status,
        appliedAt: application.appliedAt,
      },
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get applications for a specific job (for job poster)
export const getJobApplications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || req.user?._id;
    const tenantId = req.user?.tenantId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    // Check if user owns the job post
    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    if (job.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view applications for your own job posts",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const applications = await JobApplication.find({
      jobId: new mongoose.Types.ObjectId(jobId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    })
      .populate({
        path: "applicantId",
        select:
          "firstName lastName email profilePicture currentCompany currentPosition",
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await JobApplication.countDocuments({
      jobId: new mongoose.Types.ObjectId(jobId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    return res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: {
        applications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting job applications:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user's applications (for applicant)
export const getUserApplications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const tenantId = req.user?.tenantId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const applications = await JobApplication.find({
      applicantId: new mongoose.Types.ObjectId(userId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    })
      .populate({
        path: "jobId",
        select: "title company position location type",
        populate: {
          path: "postedBy",
          select: "firstName lastName email",
        },
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await JobApplication.countDocuments({
      applicantId: new mongoose.Types.ObjectId(userId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    return res.status(200).json({
      success: true,
      message: "User applications retrieved successfully",
      data: {
        applications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting user applications:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update application status (for job poster)
export const updateApplicationStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewNotes } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const validStatuses = ["Applied", "Shortlisted", "Rejected", "Hired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: Applied, Shortlisted, Rejected, Hired",
      });
    }

    // Find application and verify ownership
    const application = await JobApplication.findById(applicationId).populate({
      path: "jobId",
      select: "postedBy",
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user owns the job post
    const jobPost = application.jobId as any;
    if (jobPost.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update applications for your own job posts",
      });
    }

    // Update application status
    application.status = status;
    application.reviewedBy = new mongoose.Types.ObjectId(userId);
    application.reviewedAt = new Date();
    if (reviewNotes) {
      application.reviewNotes = reviewNotes;
    }

    await application.save();

    // Populate updated application
    await application.populate([
      {
        path: "applicantId",
        select: "firstName lastName email profilePicture",
      },
      {
        path: "jobId",
        select: "title company position",
      },
      {
        path: "reviewedBy",
        select: "firstName lastName",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get application details
export const getApplicationDetails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await JobApplication.findById(applicationId)
      .populate({
        path: "jobId",
        select: "title company position location type description postedBy",
        populate: {
          path: "postedBy",
          select: "firstName lastName email",
        },
      })
      .populate({
        path: "applicantId",
        select: "firstName lastName email profilePicture",
      })
      .populate({
        path: "reviewedBy",
        select: "firstName lastName",
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is either the applicant or the job poster
    const applicant = application.applicantId as any;
    const jobPost = application.jobId as any;
    const isApplicant = applicant._id.toString() === userId.toString();
    const isJobPoster = jobPost.postedBy._id.toString() === userId.toString();

    if (!isApplicant && !isJobPoster) {
      return res.status(403).json({
        success: false,
        message:
          "You can only view your own applications or applications for your job posts",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application details retrieved successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error getting application details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete application (for applicant)
export const deleteApplication = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the applicant
    if (application.applicantId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own applications",
      });
    }

    await JobApplication.findByIdAndDelete(applicationId);

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
