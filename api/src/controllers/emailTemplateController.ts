import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import EmailTemplate from "../models/EmailTemplate";
import { logger } from "../utils/logger";
import { emailService } from "../services/emailService";
import { replaceTemplateVariables, getVariableDocumentation, extractVariables, VariableData } from "../services/templateService";
import MentoringProgram from "../models/MentoringProgram";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import MentorRegistration from "../models/MentorRegistration";
import MenteeRegistration from "../models/MenteeRegistration";
import { generateRegistrationToken } from "../models/MenteeRegistration";
// Format date helper
const formatDate = (date: Date | string, formatStr: string = "MMM dd, yyyy"): string => {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (formatStr === "MMM dd, yyyy") {
      return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, "0")}, ${d.getFullYear()}`;
    }
    return d.toLocaleDateString();
  } catch {
    return "Invalid Date";
  }
};

// Create email template
export const createTemplate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { name, templateType, subject, body } = req.body;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    if (!name || !templateType || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Name, template type, subject, and body are required",
      });
    }

    // Extract variables from template
    const variables = extractVariables(subject + " " + body);

    const template = new EmailTemplate({
      name,
      templateType,
      subject,
      body,
      variables,
      createdBy: userId,
      isActive: true,
      tenantId,
    });

    await template.save();

    return res.status(201).json({
      success: true,
      message: "Email template created successfully",
      data: { template },
    });
  } catch (error: any) {
    logger.error("Create email template error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Template name already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create email template",
    });
  }
};

// Get all templates
export const getAllTemplates = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { templateType, isActive } = req.query;
    const tenantId = req.tenantId;

    const query: any = { tenantId };

    if (templateType) {
      query.templateType = templateType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const templates = await EmailTemplate.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    logger.error("Get all templates error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email templates",
    });
  }
};

// Get template by ID
export const getTemplateById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const template = await EmailTemplate.findOne({
      _id: id,
      tenantId,
    })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Get variable documentation
    const variableDocs = getVariableDocumentation(template.templateType);

    return res.json({
      success: true,
      data: {
        template,
        variableDocumentation: variableDocs,
      },
    });
  } catch (error) {
    logger.error("Get template by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch template",
    });
  }
};

// Update template
export const updateTemplate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { name, templateType, subject, body, isActive } = req.body;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    const template = await EmailTemplate.findOne({ _id: id, tenantId });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    if (name) template.name = name;
    if (templateType) template.templateType = templateType;
    if (subject) template.subject = subject;
    if (body) {
      template.body = body;
      // Re-extract variables
      template.variables = extractVariables(subject || template.subject + " " + body);
    }
    if (isActive !== undefined) template.isActive = isActive;
    template.updatedBy = userId as any;

    await template.save();

    return res.json({
      success: true,
      message: "Template updated successfully",
      data: { template },
    });
  } catch (error: any) {
    logger.error("Update template error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update template",
    });
  }
};

// Delete template
export const deleteTemplate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const template = await EmailTemplate.findOneAndDelete({
      _id: id,
      tenantId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    logger.error("Delete template error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete template",
    });
  }
};

// Preview template with sample data
export const previewTemplate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { sampleData } = req.body;
    const tenantId = req.tenantId;

    const template = await EmailTemplate.findOne({ _id: id, tenantId });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Use provided sample data or generate defaults
    const variables: VariableData = sampleData || {
      programName: "Sample Mentoring Program",
      programCategory: "Career Development",
      mentorName: "John Doe",
      menteeName: "Jane Smith",
      registrationLink: "https://example.com/register",
      mentorSelectionLink: "https://example.com/select-mentor",
      studentID: "ST123456",
      rejectionReason: "Sample rejection reason",
      approvalMessage: "Your registration has been approved",
      coordinatorName: "Coordinator Name",
      programManagerName: "Manager Name",
      registrationDeadline: formatDate(new Date(), "MMM dd, yyyy"),
      mentorRegistrationDeadline: formatDate(new Date(), "MMM dd, yyyy"),
      menteeRegistrationDeadline: formatDate(new Date(), "MMM dd, yyyy"),
      matchingEndDate: formatDate(new Date(), "MMM dd, yyyy"),
      preferredName: "John",
      firstName: "John",
      lastName: "Doe",
      personalEmail: "john@example.com",
      sitEmail: "john@sit.edu",
      classOf: "2020",
      tenantId: tenantId as any,
    };

    const previewSubject = replaceTemplateVariables(template.subject, variables);
    const previewBody = replaceTemplateVariables(template.body, variables);

    return res.json({
      success: true,
      data: {
        subject: previewSubject,
        body: previewBody,
        variables: template.variables,
      },
    });
  } catch (error) {
    logger.error("Preview template error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to preview template",
    });
  }
};

// Send mentor invitations
export const sendMentorInvitations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const { alumniIds, templateId, customMessage } = req.body;
    
    // Get tenantId - handle both super admin and regular users
    let tenantId = req.tenantId;
    if (!tenantId && req.user?.tenantId) {
      tenantId = req.user.tenantId.toString();
    }

    if (!alumniIds || !Array.isArray(alumniIds) || alumniIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Alumni IDs are required",
      });
    }

    // Get program
    const programQuery: any = { _id: programId };
    if (tenantId && req.user?.role !== "super_admin") {
      programQuery.tenantId = tenantId;
    }
    
    const program = await MentoringProgram.findOne(programQuery);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Get template (or use default)
    let template;
    const templateQuery: any = {
      templateType: "mentor_invitation",
      isActive: true,
    };
    
    // Add tenantId filter only if not super admin
    if (tenantId && req.user?.role !== "super_admin") {
      templateQuery.tenantId = tenantId;
    }
    
    if (templateId) {
      template = await EmailTemplate.findOne({
        ...templateQuery,
        _id: templateId,
      });
    }

    if (!template) {
      // Get default template
      template = await EmailTemplate.findOne(templateQuery);
    }

    // If no template found, return error instead of creating default
    // User should create template manually via UI
    if (!template) {
      logger.error("No active mentor invitation template found", {
        tenantId,
        userTenantId: req.user?.tenantId,
        programId,
      });
      
      return res.status(404).json({
        success: false,
        message: "No active mentor invitation template found. Please create a mentor invitation template first in the Email Templates section.",
      });
    }

    // Get alumni users
    const userQuery: any = {
      _id: { $in: alumniIds },
      role: "alumni",
    };
    
    // Add tenantId filter only if not super admin
    if (tenantId && req.user?.role !== "super_admin") {
      userQuery.tenantId = tenantId;
    }
    
    const users = await User.find(userQuery).populate({
      path: "alumniProfile",
      options: { strictPopulate: false },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No alumni found with the provided IDs",
      });
    }

    // Get coordinator and manager names
    const coordinatorIds = program.coordinators || [];
    const coordinators = await User.find({
      _id: { $in: coordinatorIds },
    });
    const coordinatorNames = coordinators
      .map((c) => `${c.firstName} ${c.lastName}`)
      .join(", ");

    const manager = program.manager
      ? await User.findById(program.manager)
      : null;
    const managerName = manager
      ? `${manager.firstName} ${manager.lastName}`
      : "";

    // Generate registration links for each alumni
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const recipients = users.map((user) => {
      const alumniProfile = (user as any).alumniProfile;
      const preferredName =
        alumniProfile?.preferredName ||
        `${user.firstName} ${user.lastName}`;
      const registrationLink = `${frontendUrl}/mentor-registration?programId=${programId}`;

      const variables: VariableData = {
        programName: program.name,
        programCategory: program.category,
        mentorName: `${user.firstName} ${user.lastName}`,
        preferredName: preferredName,
        registrationLink: registrationLink,
        coordinatorName: coordinatorNames,
        programManagerName: managerName,
        mentorRegistrationDeadline: formatDate(
          new Date(program.registrationEndDateMentor),
          "MMM dd, yyyy"
        ),
        matchingEndDate: formatDate(
          new Date(program.matchingEndDate),
          "MMM dd, yyyy"
        ),
        tenantId: tenantId as any,
      };

      return {
        email: user.email,
        data: variables,
      };
    });

    // Send batch emails
    const result = await emailService.sendBatchEmails({
      recipients,
      subject: template.subject,
      htmlTemplate: template.body,
      templateId: template._id.toString(),
      rateLimit: 60, // 60 emails per minute
    });

    // Log detailed results
    if (result.failed > 0) {
      const failures = result.results.filter((r) => !r.success);
      logger.error("Some invitations failed to send", {
        total: recipients.length,
        successful: result.success,
        failed: result.failed,
        failures: failures.map((f) => ({
          email: f.email,
          error: f.error,
        })),
      });
    }

    // Check if SMTP is configured
    if (result.failed === recipients.length && !process.env.SMTP_USER) {
      return res.status(500).json({
        success: false,
        message: "Email configuration missing. Please configure SMTP settings (SMTP_USER and SMTP_PASS) in environment variables.",
        data: result,
      });
    }

    // Get failure details for better error messages
    const failures = result.results.filter((r) => !r.success);
    let errorMessage = "";
    
    if (result.failed > 0) {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        errorMessage = "SMTP configuration missing. Please configure SMTP_USER and SMTP_PASS in .env file.";
      } else if (failures.length > 0 && failures[0].error) {
        // Use the actual error message from the email service
        errorMessage = failures[0].error;
        
        // Add helpful hints for common errors
        if (errorMessage.includes("BadCredentials") || errorMessage.includes("Invalid login")) {
          errorMessage = "Invalid Gmail App Password. Steps to fix: 1) Enable 2-Step Verification at https://myaccount.google.com/security, 2) Create App Password at https://myaccount.google.com/apppasswords, 3) Copy the 16-character password (remove spaces), 4) Update SMTP_PASS in .env file, 5) Restart server. See SMTP_SETUP_GUIDE.md for detailed instructions.";
        }
      } else {
        errorMessage = "Failed to send emails. Check server logs for details.";
      }
    }

    return res.json({
      success: result.failed === 0,
      message: result.failed === 0
        ? `All ${result.success} invitations sent successfully`
        : `Invitations sent: ${result.success} successful, ${result.failed} failed. ${errorMessage}`,
      data: {
        ...result,
        errorMessage: errorMessage || undefined,
      },
    });
  } catch (error: any) {
    logger.error("Send mentor invitations error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send mentor invitations",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Generate and send mentee registration links
export const generateMenteeInvitations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const { count, templateId } = req.body;
    const tenantId = req.tenantId;

    // Get program
    const program = await MentoringProgram.findOne({
      _id: programId,
      tenantId,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Generate registration links
    const links: Array<{ token: string; url: string }> = [];
    const numLinks = count || 1;

    for (let i = 0; i < numLinks; i++) {
      const token = generateRegistrationToken();
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
      const url = `${frontendUrl}/mentee-registration?token=${token}&programId=${programId}`;

      links.push({ token, url });
    }

    return res.json({
      success: true,
      message: "Registration links generated successfully",
      data: {
        links,
        program: {
          id: program._id,
          name: program.name,
        },
      },
    });
  } catch (error) {
    logger.error("Generate mentee links error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate registration links",
    });
  }
};

// Send various email types (welcome, acknowledgement, etc.)
export const sendAcknowledgementEmail = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { registrationId, type, templateId } = req.body; // type: "mentor" | "mentee"
    const tenantId = req.tenantId;

    let registration: any;
    if (type === "mentor") {
      registration = await MentorRegistration.findById(registrationId).populate(
        "programId"
      );
    } else {
      registration = await MenteeRegistration.findById(registrationId).populate(
        "programId"
      );
    }

    if (!registration || registration.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const program = registration.programId as any;

    // Get template
    let template;
    if (templateId) {
      template = await EmailTemplate.findOne({
        _id: templateId,
        templateType: "registration_acknowledgement",
        isActive: true,
        tenantId,
      });
    }

    if (!template) {
      template = await EmailTemplate.findOne({
        templateType: "registration_acknowledgement",
        isActive: true,
        tenantId,
      });
    }

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "No acknowledgement template found",
      });
    }

    const recipientEmail =
      type === "mentor"
        ? registration.preferredMailingAddress
        : registration.preferredMailingAddress;
    const recipientName =
      type === "mentor"
        ? registration.preferredName
        : `${registration.firstName} ${registration.lastName}`;

    const variables: VariableData = {
      programName: program?.name || "",
      programCategory: program?.category || "",
      mentorName: type === "mentor" ? recipientName : undefined,
      menteeName: type === "mentee" ? recipientName : undefined,
      preferredName: type === "mentor" ? registration.preferredName : undefined,
      firstName: registration.firstName,
      lastName: registration.lastName,
      personalEmail: registration.personalEmail,
      sitEmail: registration.sitEmail,
      classOf: registration.classOf?.toString(),
      tenantId: tenantId as any,
    };

    const success = await emailService.sendTemplatedEmail(
      { subject: template.subject, body: template.body },
      recipientEmail,
      variables,
      template._id.toString(),
      { tenantId, registrationId, type }
    );

    return res.json({
      success,
      message: success
        ? "Acknowledgement email sent successfully"
        : "Failed to send acknowledgement email",
    });
  } catch (error) {
    logger.error("Send acknowledgement email error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send acknowledgement email",
    });
  }
};

