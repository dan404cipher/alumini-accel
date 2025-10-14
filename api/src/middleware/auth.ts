import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { AuthenticatedRequest, UserRole, UserStatus } from "../types";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import { logger } from "../utils/logger";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      alumniProfile?: any;
    }
  }
}

// JWT Token verification middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    const decoded = jwt.verify(token, secret) as any;

    // Find user and check if still exists and is active
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.VERIFIED
    ) {
      return res.status(401).json({
        success: false,
        message: "Account is not active",
      });
    }

    req.user = user;
    req.user.id = user._id; // Add id property for compatibility
    req.userId = user._id.toString();

    // Extract tenantId from JWT token or user object
    const userTenantId =
      decoded.tenantId ||
      (user.tenantId ? user.tenantId.toString() : undefined);
    req.tenantId = userTenantId;

    // Ensure req.user has tenantId for easy access
    req.user.tenantId = userTenantId;

    // If user is alumni, also fetch alumni profile
    if (user.role === UserRole.ALUMNI) {
      const alumniProfile = await AlumniProfile.findOne({ userId: user._id });
      req.alumniProfile = alumniProfile || undefined;
    }

    return next();
  } catch (error) {
    logger.error("Authentication error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    return next();
  };
};

// Specific role authorization helpers
export const requireSuperAdmin = authorize(UserRole.SUPER_ADMIN);

export const requireCollegeAdmin = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN
);

export const requireHOD = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD
);

export const requireUserCreation = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
  UserRole.STAFF
);

export const requireStaff = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
  UserRole.STAFF
);

export const requireAlumni = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
  UserRole.STAFF,
  UserRole.ALUMNI
);

// Admin level access (Super Admin, College Admin, HOD, Staff)
export const requireAdmin = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
  UserRole.STAFF
);

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    const decoded = jwt.verify(token, secret) as any;
    const user = await User.findById(decoded.userId).select("-password");

    if (
      user &&
      (user.status === UserStatus.ACTIVE || user.status === UserStatus.VERIFIED)
    ) {
      req.user = user;

      if (user.role === UserRole.ALUMNI) {
        const alumniProfile = await AlumniProfile.findOne({ userId: user._id });
        req.alumniProfile = alumniProfile || undefined;
      }
    }

    return next();
  } catch (error) {
    // Continue without authentication on error
    return next();
  }
};

// Rate limiting middleware
export const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 900000
) => {
  const requests = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for authentication, connection, and message endpoints
    if (
      req.path === "/me" ||
      req.path.endsWith("/auth/me") ||
      req.path === "/login" ||
      req.path.endsWith("/auth/login") ||
      req.path === "/register" ||
      req.path.endsWith("/auth/register") ||
      req.path === "/refresh" ||
      req.path.endsWith("/auth/refresh") ||
      req.path.startsWith("/connections/check/") ||
      req.path.includes("/connections/check/") ||
      req.path.startsWith("/messages/") ||
      req.path.includes("/messages/")
    ) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(ip)) {
      const userRequests = requests
        .get(ip)
        .filter((timestamp: number) => timestamp > windowStart);
      requests.set(ip, userRequests);
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    }

    userRequests.push(now);
    return next();
  };
};

// Logout middleware (blacklist token)
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      // Add token to blacklist with expiration
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
      }
      const decoded = jwt.verify(token, secret) as any;
      const exp = decoded.exp * 1000; // Convert to milliseconds
      const ttl = Math.floor((exp - Date.now()) / 1000); // TTL in seconds

      if (ttl > 0) {
        // Token blacklisting removed - Redis dependency eliminated
        logger.info("Token would be blacklisted (Redis removed)");
      }
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
};

// Generate JWT token
export const generateToken = (
  userId: string,
  role: UserRole,
  tenantId?: string
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  const payload: any = { userId, role };
  if (tenantId) {
    payload.tenantId = tenantId;
  }

  return (jwt.sign as any)(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }
  return (jwt.sign as any)({ userId, type: "refresh" }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }
  return jwt.verify(token, secret);
};

// Legacy coordinator function for backward compatibility
export const requireCoordinator = requireCollegeAdmin;

export default {
  authenticateToken,
  authorize,
  requireSuperAdmin,
  requireCollegeAdmin,
  requireHOD,
  requireStaff,
  requireAdmin,
  requireAlumni,
  requireCoordinator,
  optionalAuth,
  rateLimit,
  logout,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
};
