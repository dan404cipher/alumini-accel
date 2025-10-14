import { Request, Response } from "express";
import JobPost from "../models/JobPost";
import User from "../models/User";
import { logger } from "../utils/logger";
import { JobPostStatus } from "../types";

// Get all job posts
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {
      status: { $in: [JobPostStatus.ACTIVE, JobPostStatus.PENDING] },
    };

    // 🔒 MULTI-TENANT FILTERING: Only show jobs from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        jobs,
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
    const job = await JobPost.findById(req.params.id).populate(
      "poster",
      "firstName lastName email profilePicture"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    return res.json({
      success: true,
      data: { job },
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
      position,
      location,
      type,
      remote,
      salary,
      description,
      requirements,
      benefits,
      tags,
      deadline,
      contactEmail,
      companyWebsite,
      applicationUrl,
    } = req.body;

    const job = new JobPost({
      postedBy: req.user.id,
      tenantId: req.user.tenantId, // Add tenantId for multi-tenant filtering
      company,
      position,
      location,
      type,
      remote: remote || false,
      salary,
      description,
      requirements: requirements || [],
      benefits: benefits || [],
      tags: tags || [],
      deadline: deadline ? new Date(deadline) : undefined,
      contactEmail,
      companyWebsite,
      applicationUrl,
      status: JobPostStatus.PENDING,
    });

    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job post created successfully",
      data: { job },
    });
  } catch (error) {
    logger.error("Create job error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create job post",
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

    // Check if user is the poster or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
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
    if (type !== undefined) job.type = type;
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

    // Check if user is the poster or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
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

    if (job.status !== JobPostStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: "Job post is not active",
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await JobPost.countDocuments(filter);

    res.json({
      success: true,
      data: {
        jobs,
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({
      company: { $regex: company, $options: "i" },
      status: JobPostStatus.ACTIVE,
    });

    res.json({
      success: true,
      data: {
        jobs,
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({
      location: { $regex: location, $options: "i" },
      status: JobPostStatus.ACTIVE,
    });

    res.json({
      success: true,
      data: {
        jobs,
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({
      type,
      status: JobPostStatus.ACTIVE,
    });

    res.json({
      success: true,
      data: {
        jobs,
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobPost.countDocuments({ postedBy: req.user.id });

    res.json({
      success: true,
      data: {
        jobs,
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
};
