import { Request, Response, NextFunction } from "express";

/**
 * Middleware to parse JSON strings in FormData fields
 * When FormData is sent with nested objects, they are stringified
 * This middleware parses them back to objects
 */
export const parseFormDataJson = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse nested objects that might be JSON strings
    if (req.body.programDuration && typeof req.body.programDuration === "string") {
      try {
        req.body.programDuration = JSON.parse(req.body.programDuration);
      } catch (e) {
        // If parsing fails, keep original value
      }
    }

    if (req.body.areasOfMentoring && typeof req.body.areasOfMentoring === "string") {
      try {
        req.body.areasOfMentoring = JSON.parse(req.body.areasOfMentoring);
      } catch (e) {
        // If parsing fails, keep original value
      }
    }
    
    // Ensure areasOfMentoring has the correct structure
    if (req.body.areasOfMentoring) {
      if (!req.body.areasOfMentoring.mentor) {
        req.body.areasOfMentoring.mentor = [];
      }
      if (!req.body.areasOfMentoring.mentee) {
        req.body.areasOfMentoring.mentee = [];
      }
    }

    // Parse arrays that might be JSON strings or need to be converted
    if (req.body.skillsRequired) {
      if (typeof req.body.skillsRequired === "string") {
        try {
          req.body.skillsRequired = JSON.parse(req.body.skillsRequired);
        } catch (e) {
          // If it's not JSON, convert to array if it's a single value
          req.body.skillsRequired = [req.body.skillsRequired];
        }
      } else if (!Array.isArray(req.body.skillsRequired)) {
        req.body.skillsRequired = [req.body.skillsRequired];
      }
    }

    if (req.body.coordinators) {
      if (typeof req.body.coordinators === "string") {
        try {
          req.body.coordinators = JSON.parse(req.body.coordinators);
        } catch (e) {
          // If it's not JSON, convert to array if it's a single value
          req.body.coordinators = [req.body.coordinators];
        }
      } else if (!Array.isArray(req.body.coordinators)) {
        req.body.coordinators = [req.body.coordinators];
      }
    }

    if (req.body.reportsEscalationsTo) {
      if (typeof req.body.reportsEscalationsTo === "string") {
        try {
          req.body.reportsEscalationsTo = JSON.parse(req.body.reportsEscalationsTo);
        } catch (e) {
          // If it's not JSON, convert to array if it's a single value
          req.body.reportsEscalationsTo = [req.body.reportsEscalationsTo];
        }
      } else if (!Array.isArray(req.body.reportsEscalationsTo)) {
        req.body.reportsEscalationsTo = [req.body.reportsEscalationsTo];
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

