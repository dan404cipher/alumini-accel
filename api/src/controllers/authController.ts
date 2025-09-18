import { Request, Response } from "express";
import crypto from "crypto";
import User from "@/models/User";
import AlumniProfile from "@/models/AlumniProfile";
import { logger } from "@/utils/logger";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  authenticateToken,
} from "@/middleware/auth";
import { UserRole, UserStatus } from "@/types";
import { sendEmail } from "@/utils/email";
import { sendSMS } from "@/utils/sms";
import { AppError } from "@/middleware/errorHandler";

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      status,
      tenantId,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Determine user status
    let userStatus = UserStatus.PENDING;

    // If status is provided, use it (for admin-created accounts)
    if (status && status === "active") {
      userStatus = UserStatus.ACTIVE;
    }

    // Create user
    const userData: any = {
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: role || UserRole.ALUMNI,
      phone,
      status: userStatus,
    };

    // Add tenantId for non-super-admin users
    if (role && role !== UserRole.SUPER_ADMIN && tenantId) {
      userData.tenantId = tenantId;
    }

    const user = new User(userData);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = emailVerificationToken;

    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Welcome to AlumniAccel - Verify Your Email",
      html: `
        <h1>Welcome to AlumniAccel!</h1>
        <p>Hi ${user.firstName},</p>
        <p>Thank you for registering with AlumniAccel. Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Best regards,<br>The AlumniAccel Team</p>
      `,
    });

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.VERIFIED
    ) {
      return res.status(401).json({
        success: false,
        message: "Account is not active. Please verify your email first.",
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    user.isEmailVerified = true;
    user.status = UserStatus.VERIFIED;
    user.emailVerificationToken = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    logger.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request - AlumniAccel",
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The AlumniAccel Team</p>
      `,
    });

    return res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send password reset email",
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    logger.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    return res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error("Refresh token error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If user is alumni, include alumni profile
    let alumniProfile = null;
    if (user.role === UserRole.ALUMNI) {
      alumniProfile = await AlumniProfile.findOne({ userId: user._id });
    }

    return res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          phone: user.phone,
          profilePicture: user.profilePicture,
          bio: user.bio,
          location: user.location,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          linkedinProfile: user.linkedinProfile,
          twitterHandle: user.twitterHandle,
          githubProfile: user.githubProfile,
          website: user.website,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          preferences: user.preferences,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        alumniProfile,
      },
    });
  } catch (error) {
    logger.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    // Token blacklisting is handled in middleware
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// Send verification email again
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = emailVerificationToken;
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - AlumniAccel",
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${user.firstName},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Best regards,<br>The AlumniAccel Team</p>
      `,
    });

    return res.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    logger.error("Resend verification email error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification email",
    });
  }
};

// Check if email is available
export const checkEmailAvailability = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    return res.json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "Email is already registered"
        : "Email is available",
    });
  } catch (error) {
    logger.error("Check email availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  getCurrentUser,
  logout,
  changePassword,
  resendVerificationEmail,
  checkEmailAvailability,
};
