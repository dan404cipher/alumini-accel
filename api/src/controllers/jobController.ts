import { Request, Response } from "express";
import mongoose from "mongoose";
import JobPost from "../models/JobPost";
import User from "../models/User";
import { logger } from "../utils/logger";
import { JobPostStatus } from "../types";

// Helper function to transform job object, replacing ObjectId strings with category names
const transformJob = (job: any) => {
  const jobObj = job.toObject ? job.toObject() : job;

  // Replace type ObjectId with category name if it exists
  if (jobObj.customJobType && jobObj.customJobType.name) {
    jobObj.type = jobObj.customJobType.name;
  }

  // Replace experience ObjectId with category name if it exists
  if (jobObj.customExperience && jobObj.customExperience.name) {
    jobObj.experience = jobObj.customExperience.name;
  }

  // Replace industry ObjectId with category name if it exists
  if (jobObj.customIndustry && jobObj.customIndustry.name) {
    jobObj.industry = jobObj.customIndustry.name;
  }

  return jobObj;
};

// Get all job posts
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only show jobs from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    // Only show ACTIVE jobs to non-admin users (alumni, students)
    // Admins (super_admin, college_admin, hod, staff) can see both ACTIVE and PENDING
    const isAdmin =
      req.user?.role === "super_admin" ||
      req.user?.role === "college_admin" ||
      req.user?.role === "hod" ||
      req.user?.role === "staff";

    if (isAdmin) {
      // Admins can see both ACTIVE and PENDING jobs
      filter.status = { $in: [JobPostStatus.ACTIVE, JobPostStatus.PENDING] };
    } else {
      // Non-admin users (alumni, students) can only see ACTIVE jobs
      filter.status = JobPostStatus.ACTIVE;
    }

    // Apply filters
    if (req.query.company)
      filter.company = { $regex: req.query.company, $options: "i" };
    if (req.query.location)
      filter.location = { $regex: req.query.location, $options: "i" };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.experience) filter.experience = req.query.experience;
    if (req.query.industry) filter.industry = req.query.industry;
    if (req.query.remote) filter.remote = req.query.remote === "true";

    const jobs = await JobPost.find(filter)
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .populate({
        path: "applications.applicantId",
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments(filter);

    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = jobs.map(transformJob);

    return res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get all jobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

// Get job post by ID
export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await JobPost.findById(req.params.id)
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .populate({
        path: "applications.applicantId",
        select: "firstName lastName email",
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Transform job to replace ObjectId strings with category names
    const transformedJob = transformJob(job);

    return res.json({
      success: true,
      data: { job: transformedJob },
    });
  } catch (error) {
    logger.error("Get job by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
};

// Create job post
export const createJob = async (req: Request, res: Response) => {
  try {
    const {
      company,
      title,
      position,
      location,
      type,
      experience,
      industry,
      remote,
      salary,
      numberOfVacancies,
      description,
      requirements,
      benefits,
      tags,
      deadline,
      contactEmail,
      companyWebsite,
      applicationUrl,
    } = req.body;

    // Check if type is a custom category (ObjectId) or default enum
    const isCustomType = type && mongoose.Types.ObjectId.isValid(type);

    // Check if experience is a custom category (ObjectId) or default enum
    const isCustomExperience =
      experience && mongoose.Types.ObjectId.isValid(experience);

    // Check if industry is a custom category (ObjectId) or default enum
    const isCustomIndustry =
      industry && mongoose.Types.ObjectId.isValid(industry);

    const jobData: any = {
      postedBy: req.user.id,
      tenantId: req.user.tenantId,
      company,
      title: title || position,
      position: position || title,
      location,
      type: type, // Keep as string/ObjectId string, Mongoose validation will handle it
      experience: experience || "mid",
      industry: industry || "technology",
      remote: remote || false,
      salary,
      numberOfVacancies: numberOfVacancies || 1,
      description,
      requirements: requirements || [],
      benefits: benefits || [],
      tags: tags || [],
      deadline: deadline ? new Date(deadline) : undefined,
      contactEmail,
      companyWebsite,
      applicationUrl,
      status: JobPostStatus.PENDING,
    };

    // Set custom fields only if using ObjectIds (convert to ObjectId for these fields)
    if (isCustomType) {
      jobData.customJobType = new mongoose.Types.ObjectId(type);
    }
    if (isCustomExperience) {
      jobData.customExperience = new mongoose.Types.ObjectId(experience);
    }
    if (isCustomIndustry) {
      jobData.customIndustry = new mongoose.Types.ObjectId(industry);
    }

    const job = new JobPost(jobData);

    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job post created successfully",
      data: { job },
    });
  } catch (error) {
    logger.error("Create job error:", error);
    // Log the full error for debugging
    if (error instanceof Error) {
      logger.error("Error message:", error.message);
      logger.error("Error stack:", error.stack);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create job post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update job post
export const updateJob = async (req: Request, res: Response) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Check if user can update this job post
    // Allow: job poster, super_admin, or admin roles (college_admin, hod, staff) from same tenant
    const isCreator = job.postedBy.toString() === req.user.id;
    const isSuperAdmin = req.user.role === "super_admin";
    const isAdmin =
      req.user.role === "college_admin" ||
      req.user.role === "hod" ||
      req.user.role === "staff";
    const isSameTenant =
      job.tenantId.toString() === req.user.tenantId?.toString();

    if (!isCreator && !isSuperAdmin && (!isAdmin || !isSameTenant)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job post",
      });
    }

    const {
      company,
      position,
      location,
      type,
      experience,
      industry,
      remote,
      salary,
      description,
      requirements,
      benefits,
      tags,
      deadline,
      status,
    } = req.body;

    // Update fields if provided
    if (company !== undefined) job.company = company;
    if (position !== undefined) job.position = position;
    if (location !== undefined) job.location = location;
    if (type !== undefined) {
      const isCustomType = type && mongoose.Types.ObjectId.isValid(type);
      job.type = type; // Keep as string/ObjectId string, Mongoose will handle conversion
      if (isCustomType) {
        (job as any).customJobType = new mongoose.Types.ObjectId(type);
      } else {
        (job as any).customJobType = undefined;
      }
    }
    if (experience !== undefined) {
      const isCustomExperience =
        experience && mongoose.Types.ObjectId.isValid(experience);
      job.experience = experience;
      if (isCustomExperience) {
        (job as any).customExperience = new mongoose.Types.ObjectId(experience);
      } else {
        (job as any).customExperience = undefined;
      }
    }
    if (industry !== undefined) {
      const isCustomIndustry =
        industry && mongoose.Types.ObjectId.isValid(industry);
      job.industry = industry;
      if (isCustomIndustry) {
        (job as any).customIndustry = new mongoose.Types.ObjectId(industry);
      } else {
        (job as any).customIndustry = undefined;
      }
    }
    if (remote !== undefined) job.remote = remote;
    if (salary !== undefined) job.salary = salary;
    if (description !== undefined) job.description = description;
    if (requirements !== undefined) job.requirements = requirements;
    if (benefits !== undefined) job.benefits = benefits;
    if (tags !== undefined) job.tags = tags;
    if (deadline !== undefined)
      job.deadline = deadline ? new Date(deadline) : undefined;
    if (status !== undefined) job.status = status;

    await job.save();

    return res.json({
      success: true,
      message: "Job post updated successfully",
      data: { job },
    });
  } catch (error) {
    logger.error("Update job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update job post",
    });
  }
};

// Delete job post
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Check if user can delete this job post
    // Allow: job poster, super_admin, or admin roles (college_admin, hod, staff) from same tenant
    const isCreator = job.postedBy.toString() === req.user.id;
    const isSuperAdmin = req.user.role === "super_admin";
    const isAdmin =
      req.user.role === "college_admin" ||
      req.user.role === "hod" ||
      req.user.role === "staff";
    const isSameTenant =
      job.tenantId.toString() === req.user.tenantId?.toString();

    if (!isCreator && !isSuperAdmin && (!isAdmin || !isSameTenant)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job post",
      });
    }

    await JobPost.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Job post deleted successfully",
    });
  } catch (error) {
    logger.error("Delete job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete job post",
    });
  }
};

// Apply for job
export const applyForJob = async (req: Request, res: Response) => {
  try {
    const { resume, coverLetter } = req.body;

    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Allow applying to active or pending jobs
    if (
      job.status !== JobPostStatus.ACTIVE &&
      job.status !== JobPostStatus.PENDING
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job post is not available for applications. Only active or pending jobs can accept applications.",
      });
    }

    // Prevent users from applying to their own jobs
    if (job.postedBy.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own job post",
      });
    }

    // Check if user has already applied
    const existingApplication = job.applications.find(
      (app) => app.applicantId.toString() === req.user.id
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    job.applications.push({
      applicantId: req.user.id,
      appliedAt: new Date(),
      status: "pending",
      resume,
      coverLetter,
    });

    await job.save();

    return res.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    logger.error("Apply for job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
};

// Search jobs
export const searchJobs = async (req: Request, res: Response) => {
  try {
    const {
      q,
      company,
      location,
      type,
      remote,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filter: any = { status: JobPostStatus.ACTIVE };

    if (q) {
      filter.$or = [
        { position: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q as string, "i")] } },
      ];
    }

    if (company) filter.company = { $regex: company, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (type) filter.type = type;
    if (req.query.experience) filter.experience = req.query.experience;
    if (req.query.industry) filter.industry = req.query.industry;
    if (remote) filter.remote = remote === "true";

    const jobs = await JobPost.find(filter)
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .populate({
        path: "applications.applicantId",
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await JobPost.countDocuments(filter);

    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = jobs.map(transformJob);

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error("Search jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search jobs",
    });
  }
};

// Get jobs by company
export const getJobsByCompany = async (req: Request, res: Response) => {
  try {
    const { company } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const jobs = await JobPost.find({
      company: { $regex: company, $options: "i" },
      status: JobPostStatus.ACTIVE,
    })
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .populate({
        path: "applications.applicantId",
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({
      company: { $regex: company, $options: "i" },
      status: JobPostStatus.ACTIVE,
    });

    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = jobs.map(transformJob);

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get jobs by company error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs by company",
    });
  }
};

// Get jobs by location
export const getJobsByLocation = async (req: Request, res: Response) => {
  try {
    const { location } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const jobs = await JobPost.find({
      location: { $regex: location, $options: "i" },
      status: JobPostStatus.ACTIVE,
    })
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .populate({
        path: "applications.applicantId",
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({
      location: { $regex: location, $options: "i" },
      status: JobPostStatus.ACTIVE,
    });

    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = jobs.map(transformJob);

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get jobs by location error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs by location",
    });
  }
};

// Get jobs by type
export const getJobsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const jobs = await JobPost.find({
      type,
      status: JobPostStatus.ACTIVE,
    })
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .populate({
        path: "applications.applicantId",
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({
      type,
      status: JobPostStatus.ACTIVE,
    });

    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = jobs.map(transformJob);

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get jobs by type error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs by type",
    });
  }
};

// Get my job posts
export const getMyJobPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const jobs = await JobPost.find({ postedBy: req.user.id })
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .populate({
        path: "applications.applicantId",
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({ postedBy: req.user.id });

    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = jobs.map(transformJob);

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get my job posts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your job posts",
    });
  }
};

// Get job statistics
export const getJobStats = async (req: Request, res: Response) => {
  try {
    const totalJobs = await JobPost.countDocuments();
    const activeJobs = await JobPost.countDocuments({
      status: JobPostStatus.ACTIVE,
    });
    const pendingJobs = await JobPost.countDocuments({
      status: JobPostStatus.PENDING,
    });

    const companyStats = await JobPost.aggregate([
      {
        $group: {
          _id: "$company",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const locationStats = await JobPost.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const typeStats = await JobPost.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        pendingJobs,
        companyStats,
        locationStats,
        typeStats,
      },
    });
  } catch (error) {
    logger.error("Get job stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job statistics",
    });
  }
};

// Get pending jobs for admin approval
export const getPendingJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Check if user is admin
    const isAdmin =
      req.user?.role === "super_admin" ||
      req.user?.role === "college_admin" ||
      req.user?.role === "hod" ||
      req.user?.role === "staff";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view pending jobs",
      });
    }

    const filter: any = {
      status: JobPostStatus.PENDING,
    };

    // 🔒 MULTI-TENANT FILTERING: Only show jobs from same college (unless super admin)
    if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    const jobs = await JobPost.find(filter)
      .populate("postedBy", "firstName lastName email profilePicture")
      .populate("customJobType", "name")
      .populate("customExperience", "name")
      .populate("customIndustry", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments(filter);

    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = jobs.map(transformJob);

    return res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get pending jobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending jobs",
    });
  }
};

// Approve a job post
export const approveJob = async (req: Request, res: Response) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Check if user is admin
    const isAdmin =
      req.user?.role === "super_admin" ||
      req.user?.role === "college_admin" ||
      req.user?.role === "hod" ||
      req.user?.role === "staff";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to approve jobs",
      });
    }

    // Check tenant access (unless super admin)
    if (
      req.user?.role !== "super_admin" &&
      job.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to approve this job post",
      });
    }

    if (job.status !== JobPostStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Job post is not pending approval",
      });
    }

    job.status = JobPostStatus.ACTIVE;
    await job.save();

    return res.json({
      success: true,
      message: "Job post approved successfully",
      data: { job: transformJob(job) },
    });
  } catch (error) {
    logger.error("Approve job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve job post",
    });
  }
};

// Reject a job post
export const rejectJob = async (req: Request, res: Response) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    // Check if user is admin
    const isAdmin =
      req.user?.role === "super_admin" ||
      req.user?.role === "college_admin" ||
      req.user?.role === "hod" ||
      req.user?.role === "staff";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject jobs",
      });
    }

    // Check tenant access (unless super admin)
    if (
      req.user?.role !== "super_admin" &&
      job.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this job post",
      });
    }

    if (job.status !== JobPostStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Job post is not pending approval",
      });
    }

    job.status = JobPostStatus.CLOSED;
    await job.save();

    return res.json({
      success: true,
      message: "Job post rejected successfully",
      data: { job: transformJob(job) },
    });
  } catch (error) {
    logger.error("Reject job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject job post",
    });
  }
};

// Save a job
export const saveJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    // Check if job exists
    const job = await JobPost.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user has already saved this job
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.savedJobs?.includes(id)) {
      return res.status(400).json({
        success: false,
        message: "Job already saved",
      });
    }

    // Add job to user's saved jobs
    if (!user.savedJobs) {
      user.savedJobs = [];
    }
    user.savedJobs.push(id);
    await user.save();

    return res.json({
      success: true,
      message: "Job saved successfully",
    });
  } catch (error) {
    logger.error("Save job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save job",
    });
  }
};

// Unsave a job
export const unsaveJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    // Check if job exists
    const job = await JobPost.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Remove job from user's saved jobs
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.savedJobs?.includes(id)) {
      return res.status(400).json({
        success: false,
        message: "Job not saved",
      });
    }

    user.savedJobs = user.savedJobs.filter((jobId: string) => jobId !== id);
    await user.save();

    return res.json({
      success: true,
      message: "Job unsaved successfully",
    });
  } catch (error) {
    logger.error("Unsave job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unsave job",
    });
  }
};

// Get saved jobs for current user
export const getSavedJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).populate({
      path: "savedJobs",
      match: { status: { $in: [JobPostStatus.ACTIVE, JobPostStatus.PENDING] } },
      populate: [
        {
          path: "postedBy",
          select: "firstName lastName email profilePicture",
        },
        {
          path: "customJobType",
          select: "name",
        },
        {
          path: "customExperience",
          select: "name",
        },
        {
          path: "customIndustry",
          select: "name",
        },
        {
          path: "applications.applicantId",
          select: "firstName lastName email",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const savedJobs = user.savedJobs || [];
    // Transform jobs to replace ObjectId strings with category names
    const transformedJobs = savedJobs.map((job: any) => transformJob(job));
    const paginatedJobs = transformedJobs.slice(skip, skip + limit);
    const total = transformedJobs.length;

    return res.json({
      success: true,
      data: {
        jobs: paginatedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get saved jobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
    });
  }
};

export default {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  searchJobs,
  getJobsByCompany,
  getJobsByLocation,
  getJobsByType,
  getMyJobPosts,
  getJobStats,
  getPendingJobs,
  approveJob,
  rejectJob,
  saveJob,
  unsaveJob,
  getSavedJobs,
};
