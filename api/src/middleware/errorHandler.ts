import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new AppError(message, 401);
  }

  // Default error
  const statusCode = (error as AppError).statusCode || 500;
  const message = (error as AppError).message || "Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Validation error handler
export const handleValidationError = (err: mongoose.Error.ValidationError) => {
  const errors = Object.values(err.errors).map((error: any) => error.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

// Duplicate key error handler
export const handleDuplicateKeyError = (err: any) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} already exists`;
  return new AppError(message, 400);
};

// Cast error handler
export const handleCastError = (err: mongoose.Error.CastError) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// JWT error handlers
export const handleJWTError = () => {
  return new AppError("Invalid token. Please log in again!", 401);
};

export const handleJWTExpiredError = () => {
  return new AppError("Your token has expired! Please log in again.", 401);
};

// Send error response
export const sendErrorResponse = (
  err: AppError,
  req: Request,
  res: Response
) => {
  const statusCode = err.statusCode || 500;

  // API errors
  if (req.originalUrl.startsWith("/api")) {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Rendered error page
  return res.status(statusCode).render("error", {
    title: "Something went wrong!",
    message: err.message,
  });
};

// Global error handler
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: AppError;

  // If it's already an AppError, use it
  if (err instanceof AppError) {
    error = err;
  } else {
    // Create a new AppError with default status code
    error = new AppError(err.message || "Internal Server Error", 500);
  }

  // Log error
  logger.error("Global Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle specific error types
  if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  }

  if ((err as any).code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  }

  if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  sendErrorResponse(error as AppError, req, res);
};

export default {
  AppError,
  errorHandler,
  asyncHandler,
  notFound,
  globalErrorHandler,
  handleValidationError,
  handleDuplicateKeyError,
  handleCastError,
  handleJWTError,
  handleJWTExpiredError,
  sendErrorResponse,
};
