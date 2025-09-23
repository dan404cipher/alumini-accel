import { Request, Response } from "express";
import User from "@/models/User";
import { logger } from "@/utils/logger";
import { UserRole, UserStatus } from "@/types";
import { AppError } from "@/middleware/errorHandler";
import bcrypt from "bcryptjs";

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only show users from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    // Apply filters
    if (req.query.role) {
      const roleParam = String(req.query.role);
      // Handle comma-separated roles (e.g., "hod,staff")
      if (roleParam.includes(",")) {
        filter.role = { $in: roleParam.split(",") };
      } else {
        filter.role = roleParam;
      }
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .populate("tenantId", "name domain")
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// Create new user (Super Admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, role, tenantId, department, password } =
      req.body;

    logger.info(`Creating user: ${email}, role: ${role}, status: active`);

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: email, firstName, lastName, role, password",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const userData: any = {
      email,
      firstName,
      lastName,
      role,
      password: password, // Let the pre-save hook handle hashing
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    };

    // Add tenantId for non-super-admin users
    if (role !== UserRole.SUPER_ADMIN) {
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "tenantId is required for non-super-admin users",
        });
      }

      // 🔒 MULTI-TENANT VALIDATION: College Admins can only create users for their own college
      if (req.user?.role === "college_admin") {
        const userTenantId = String(req.user?.tenantId);
        const requestTenantId = String(tenantId);

        if (userTenantId !== requestTenantId) {
          return res.status(403).json({
            success: false,
            message:
              "College Admins can only create users for their own college",
          });
        }
      }

      userData.tenantId = tenantId;
    }

    // Add department for HOD and Staff
    if ((role === UserRole.HOD || role === UserRole.STAFF) && department) {
      userData.department = department;
    }

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    logger.info(`User created: ${email} with role: ${role}`);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user: userResponse },
    });
  } catch (error) {
    logger.error("Create user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error("Get user by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      bio,
      location,
      linkedinProfile,
      twitterHandle,
      githubProfile,
      website,
      preferences,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;
    if (bio) user.bio = bio;
    if (location) user.location = location;
    if (linkedinProfile) user.linkedinProfile = linkedinProfile;
    if (twitterHandle) user.twitterHandle = twitterHandle;
    if (githubProfile) user.githubProfile = githubProfile;
    if (website) user.website = website;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Update any user by ID (Super Admin only)
export const updateUserById = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      bio,
      location,
      department,
      linkedinProfile,
      twitterHandle,
      githubProfile,
      website,
      preferences,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;
    if (bio) user.bio = bio;
    if (location) user.location = location;
    if (department) user.department = department;
    if (linkedinProfile) user.linkedinProfile = linkedinProfile;
    if (twitterHandle) user.twitterHandle = twitterHandle;
    if (githubProfile) user.githubProfile = githubProfile;
    if (website) user.website = website;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    return res.json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (error) {
    logger.error("Update user by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deletion of super admin
    if (user.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete super admin user",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// Update user status (admin only)
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!Object.values(UserStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent status change of super admin
    if (
      user.role === UserRole.SUPER_ADMIN &&
      req.user.role !== UserRole.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify super admin status",
      });
    }

    user.status = status;
    await user.save();

    return res.json({
      success: true,
      message: "User status updated successfully",
      data: { user },
    });
  } catch (error) {
    logger.error("Update user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// Search users
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q, role, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only search users from same college (unless super admin)
    if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

// Get user statistics (admin only)
export const getUserStats = async (req: Request, res: Response) => {
  try {
    // 🔒 MULTI-TENANT FILTERING: Only show stats from same college (unless super admin)
    const tenantFilter: any = {};
    if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      tenantFilter.tenantId = req.user.tenantId;
    }

    const totalUsers = await User.countDocuments(tenantFilter);
    const activeUsers = await User.countDocuments({
      ...tenantFilter,
      status: UserStatus.ACTIVE,
    });
    const verifiedUsers = await User.countDocuments({
      ...tenantFilter,
      status: UserStatus.VERIFIED,
    });
    const pendingUsers = await User.countDocuments({
      ...tenantFilter,
      status: UserStatus.PENDING,
    });

    const roleStats = await User.aggregate([
      { $match: tenantFilter },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyStats = await User.aggregate([
      { $match: tenantFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        pendingUsers,
        roleStats,
        monthlyStats,
      },
    });
  } catch (error) {
    logger.error("Get user stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
    });
  }
};

// Bulk update users (admin only)
export const bulkUpdateUsers = async (req: Request, res: Response) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs are required",
      });
    }

    const allowedUpdates = ["status", "role", "preferences"];
    const filteredUpdates: any = {};

    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: filteredUpdates }
    );

    return res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users successfully`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error("Bulk update users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk update users",
    });
  }
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Get the uploaded file info
    const file = req.file;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's profile picture
    user.profilePicture = `/uploads/profile-images/${file.filename}`;
    await user.save();

    return res.json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profileImage: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload profile image",
    });
  }
};

export default {
  getAllUsers,
  createUser,
  getUserById,
  updateProfile,
  updateUserById,
  deleteUser,
  updateUserStatus,
  searchUsers,
  getUserStats,
  bulkUpdateUsers,
  uploadProfileImage,
};
