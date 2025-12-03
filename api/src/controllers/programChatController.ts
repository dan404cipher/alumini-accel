import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";
import ProgramChat from "../models/ProgramChat";
import MentorMenteeMatching from "../models/MentorMenteeMatching";
import MentorRegistration from "../models/MentorRegistration";
import MenteeRegistration from "../models/MenteeRegistration";
import { MatchingStatus, UserRole } from "../types";

// Verify user is part of the program (mentor, assigned mentee, or staff/admin)
const verifyUserInProgram = async (
  userId: string,
  programId: string,
  tenantId?: string,
  userRole?: string
): Promise<{ isAuthorized: boolean; isMentor: boolean; isStaff: boolean }> => {
  try {
    // Check if user is staff, HOD, or college_admin - they can always access
    if (userRole === UserRole.STAFF || userRole === UserRole.HOD || userRole === UserRole.COLLEGE_ADMIN) {
      return { isAuthorized: true, isMentor: false, isStaff: true };
    }

    // Get user email for checks
    const User = (await import("../models/User")).default;
    const user = await User.findById(userId).select("email");
    const userEmail = user?.email?.toLowerCase();

    // Build base query for tenant filtering
    const baseQuery: any = { programId };
    if (tenantId) {
      baseQuery.tenantId = tenantId;
    }

    // Check if user is a mentor for this program (allow both submitted and approved)
    const mentorRegQuery = {
      ...baseQuery,
      userId,
      status: { $in: ["submitted", "approved"] },
    };
    const mentorReg = await MentorRegistration.findOne(mentorRegQuery);

    if (mentorReg) {
      return { isAuthorized: true, isMentor: true, isStaff: false };
    }

    // Also check mentor registration by email (in case userId doesn't match)
    if (userEmail) {
      const mentorRegByEmail = await MentorRegistration.findOne({
        ...baseQuery,
        $or: [
          { userId },
          { personalEmail: userEmail },
          { preferredMailingAddress: userEmail },
        ],
        status: { $in: ["submitted", "approved"] },
      });

      if (mentorRegByEmail) {
        return { isAuthorized: true, isMentor: true, isStaff: false };
      }
    }

    // Check if user is an assigned mentee for this program (by menteeId)
    const matchQuery: any = {
      programId,
      menteeId: userId,
      status: {
        $in: [MatchingStatus.ACCEPTED, MatchingStatus.PENDING_MENTOR_ACCEPTANCE],
      },
    };
    if (tenantId) {
      matchQuery.tenantId = tenantId;
    }
    const match = await MentorMenteeMatching.findOne(matchQuery);

    if (match) {
      return { isAuthorized: true, isMentor: false, isStaff: false };
    }

    // Also check matches by menteeRegistrationId (in case menteeId doesn't match)
    if (userEmail) {
      // First, find mentee registrations for this user (allow both submitted and approved)
      const menteeRegs = await MenteeRegistration.find({
        ...baseQuery,
        $or: [
          { userId },
          { personalEmail: userEmail },
          { preferredMailingAddress: userEmail },
        ],
        status: { $in: ["submitted", "approved"] },
      });

      if (menteeRegs.length > 0) {
        // Check if any of these registrations are matched
        const menteeRegIds = menteeRegs.map((reg) => reg._id);
        const matchByRegIdQuery: any = {
          programId,
          menteeRegistrationId: { $in: menteeRegIds },
          status: {
            $in: [MatchingStatus.ACCEPTED, MatchingStatus.PENDING_MENTOR_ACCEPTANCE],
          },
        };
        if (tenantId) {
          matchByRegIdQuery.tenantId = tenantId;
        }
        const matchByRegId = await MentorMenteeMatching.findOne(matchByRegIdQuery);

        if (matchByRegId) {
          return { isAuthorized: true, isMentor: false, isStaff: false };
        }

        // If registered but not matched, still allow access (they're registered mentees)
        return { isAuthorized: true, isMentor: false, isStaff: false };
      }
    }

    // Final check: look for any mentee registration by email (even without userId)
    if (userEmail) {
      const menteeReg = await MenteeRegistration.findOne({
        ...baseQuery,
        $or: [
          { userId },
          { personalEmail: userEmail },
          { preferredMailingAddress: userEmail },
        ],
        status: { $in: ["submitted", "approved"] },
      });

      if (menteeReg) {
        return { isAuthorized: true, isMentor: false, isStaff: false };
      }
    }

    logger.warn(`User ${userId} not authorized for program ${programId}`, {
      userId,
      programId,
      tenantId,
      userRole,
      userEmail,
    });

    return { isAuthorized: false, isMentor: false, isStaff: false };
  } catch (error) {
    logger.error("Error verifying user in program:", error);
    return { isAuthorized: false, isMentor: false, isStaff: false };
  }
};

// Send a message to program chat
export const sendProgramChatMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { programId } = req.params;
    const { content } = req.body;
    const senderId = req.user?._id;
    const tenantId = req.tenantId;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!programId || !content) {
      return res.status(400).json({
        success: false,
        message: "Program ID and content are required",
      });
    }

    // Get user role
    const User = (await import("../models/User")).default;
    const user = await User.findById(senderId).select("role");
    const userRole = user?.role;

    // Verify user is part of the program
    const { isAuthorized } = await verifyUserInProgram(senderId, programId, tenantId, userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send messages in this program chat",
      });
    }

    // Create the message
    const message = new ProgramChat({
      programId,
      sender: senderId,
      content: content.trim(),
      messageType: "text",
      tenantId,
    });

    await message.save();

    // Populate sender details
    await message.populate([
      { path: "sender", select: "firstName lastName email profilePicture" },
      { path: "programId", select: "name" },
    ]);

    // Determine sender's role
    const senderIdStr = senderId.toString();
    let role: "Mentor" | "Mentee" | "Staff" | "Admin" = "Mentee"; // Default to Mentee

    // Check if sender is staff, HOD, or college_admin
    if (userRole === UserRole.STAFF) {
      role = "Staff";
    } else if (userRole === UserRole.HOD || userRole === UserRole.COLLEGE_ADMIN) {
      role = "Admin";
    } else {
      // Check if sender is a mentor
      const mentorReg = await MentorRegistration.findOne({
        programId,
        userId: senderIdStr,
        status: "approved",
        tenantId,
      });

      if (mentorReg) {
        role = "Mentor";
      } else {
        // Check if sender is a mentee
        const match = await MentorMenteeMatching.findOne({
          programId,
          menteeId: senderIdStr,
          status: {
            $in: [MatchingStatus.ACCEPTED, MatchingStatus.PENDING_MENTOR_ACCEPTANCE],
          },
          tenantId,
        });

        if (match) {
          role = "Mentee";
        } else {
          // Also check mentee registration
          const userForEmail = await User.findById(senderIdStr).select("email");
          if (userForEmail?.email) {
            const menteeReg = await MenteeRegistration.findOne({
              programId,
              $or: [{ userId: senderIdStr }, { personalEmail: userForEmail.email.toLowerCase() }],
              status: "approved",
              tenantId,
            });

            if (menteeReg) {
              role = "Mentee";
            }
          }
        }
      }
    }

    logger.info(`Program chat message sent by ${senderId} in program ${programId}`);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: message._id,
        programId: message.programId,
        sender: {
          id: (message.sender as any)._id,
          firstName: (message.sender as any).firstName,
          lastName: (message.sender as any).lastName,
          email: (message.sender as any).email,
          profilePicture: (message.sender as any).profilePicture,
          role: role,
        },
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      },
    });
  }
);

// Get messages for a program chat
export const getProgramChatMessages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { programId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?._id;
    const tenantId = req.tenantId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "Program ID is required",
      });
    }

    // Get user role
    const User = (await import("../models/User")).default;
    const user = await User.findById(userId).select("role");
    const userRole = user?.role;
    const isAlumni = userRole === UserRole.ALUMNI;

    // Verify user is part of the program
    const { isAuthorized } = await verifyUserInProgram(userId, programId, tenantId, userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view messages in this program chat",
      });
    }

    // Get messages
    const messages = await ProgramChat.getProgramMessages(
      programId,
      Number(limit),
      Number(page)
    );

    const total = await ProgramChat.countDocuments({ programId, tenantId });

    // Determine role for each sender and filter out staff/admin messages for alumni
    const messagesWithRoles = await Promise.all(
      messages.map(async (msg: any) => {
        const senderId = msg.sender._id.toString();
        let role: "Mentor" | "Mentee" | "Staff" | "Admin" | null = null;

        // Check sender's user role first
        const senderUser = await User.findById(senderId).select("role");
        if (senderUser?.role === UserRole.STAFF) {
          role = "Staff";
        } else if (senderUser?.role === UserRole.HOD || senderUser?.role === UserRole.COLLEGE_ADMIN) {
          role = "Admin";
        } else {
          // Check if sender is a mentor
          const mentorReg = await MentorRegistration.findOne({
            programId,
            userId: senderId,
            status: "approved",
            tenantId,
          });

          if (mentorReg) {
            role = "Mentor";
          } else {
            // Check if sender is a mentee
            const match = await MentorMenteeMatching.findOne({
              programId,
              menteeId: senderId,
              status: {
                $in: [MatchingStatus.ACCEPTED, MatchingStatus.PENDING_MENTOR_ACCEPTANCE],
              },
              tenantId,
            });

            if (match) {
              role = "Mentee";
            } else {
              // Also check mentee registration
              const userForEmail = await User.findById(senderId).select("email");
              if (userForEmail?.email) {
                const menteeReg = await MenteeRegistration.findOne({
                  programId,
                  $or: [{ userId: senderId }, { personalEmail: userForEmail.email.toLowerCase() }],
                  status: "approved",
                  tenantId,
                });

                if (menteeReg) {
                  role = "Mentee";
                }
              }
            }
          }
        }

        // If requester is alumni, hide Staff/Admin roles (show as null or "Mentor")
        let displayRole = role;
        if (isAlumni && (role === "Staff" || role === "Admin")) {
          // Option 1: Hide the role badge completely
          displayRole = null;
          // Option 2: Show as "Mentor" instead (uncomment if preferred)
          // displayRole = "Mentor";
        }

        return {
          id: msg._id,
          programId: msg.programId,
          sender: {
            id: msg.sender._id,
            firstName: msg.sender.firstName,
            lastName: msg.sender.lastName,
            email: msg.sender.email,
            profilePicture: msg.sender.profilePicture,
            role: displayRole || (role || "Mentee"), // Use displayRole, fallback to original role, then default to Mentee
          },
          content: msg.content,
          messageType: msg.messageType,
          createdAt: msg.createdAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
        };
      })
    );

    // No need to filter - all messages are included, but roles are hidden for alumni
    const filteredMessages = messagesWithRoles.filter((msg) => msg !== null);

    return res.status(200).json({
      success: true,
      data: {
        messages: filteredMessages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredMessages.length,
          totalPages: Math.ceil(filteredMessages.length / Number(limit)),
        },
      },
    });
  }
);

// Get all members (mentor and mentees) for a program chat
export const getProgramChatMembers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { programId } = req.params;
    const userId = req.user?._id;
    const tenantId = req.tenantId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "Program ID is required",
      });
    }

    // Get user role
    const User = (await import("../models/User")).default;
    const user = await User.findById(userId).select("role");
    const userRole = user?.role;
    const isAlumni = userRole === UserRole.ALUMNI;

    // Verify user is part of the program
    const { isAuthorized } = await verifyUserInProgram(userId, programId, tenantId, userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view members of this program chat",
      });
    }

    try {
      const members: any[] = [];
      const memberIds = new Set<string>(); // Track unique member IDs

      // Build base query for tenant filtering
      const baseQuery: any = { programId };
      if (tenantId) {
        baseQuery.tenantId = tenantId;
      }

      // Get all mentors for this program (both submitted and approved)
      const mentorRegs = await MentorRegistration.find({
        ...baseQuery,
        status: { $in: ["submitted", "approved"] },
      })
        .populate("userId", "firstName lastName email profilePicture role")
        .select("userId preferredName");

      mentorRegs.forEach((reg: any) => {
        if (reg.userId) {
          const mentorUser = reg.userId;
          const userId = mentorUser._id.toString();
          
          // Skip if already added
          if (memberIds.has(userId)) return;
          
          // If requester is alumni, exclude staff/admin members
          if (isAlumni) {
            const mentorRole = mentorUser.role;
            if (mentorRole === UserRole.STAFF || mentorRole === UserRole.HOD || mentorRole === UserRole.COLLEGE_ADMIN) {
              return; // Skip this member
            }
          }
          
          memberIds.add(userId);
          members.push({
            id: userId,
            firstName: mentorUser.firstName,
            lastName: mentorUser.lastName,
            email: mentorUser.email,
            profilePicture: mentorUser.profilePicture,
            role: "Mentor",
            preferredName: reg.preferredName,
          });
        }
      });

      // Get all matched mentees for this program
      const matches = await MentorMenteeMatching.find({
        ...baseQuery,
        status: {
          $in: [MatchingStatus.ACCEPTED, MatchingStatus.PENDING_MENTOR_ACCEPTANCE],
        },
      })
        .populate("menteeId", "firstName lastName email profilePicture role")
        .populate({
          path: "menteeRegistrationId",
          model: "MenteeRegistration",
          select: "firstName lastName personalEmail",
        });

      // Add unique mentees from matches
      matches.forEach((match: any) => {
        const menteeId = match.menteeId?._id?.toString() || match.menteeId?.toString();
        if (menteeId && !memberIds.has(menteeId)) {
          memberIds.add(menteeId);
          const mentee = match.menteeId || match.menteeRegistrationId;
          if (mentee) {
            // If requester is alumni, exclude staff/admin members
            if (isAlumni && mentee.role) {
              const menteeRole = mentee.role;
              if (menteeRole === UserRole.STAFF || menteeRole === UserRole.HOD || menteeRole === UserRole.COLLEGE_ADMIN) {
                return; // Skip this member
              }
            }
            members.push({
              id: mentee._id || menteeId,
              firstName: mentee.firstName,
              lastName: mentee.lastName,
              email: mentee.email || mentee.personalEmail,
              profilePicture: mentee.profilePicture,
              role: "Mentee",
            });
          }
        }
      });

      // Also check mentee registrations (both submitted and approved, in case they're not matched yet)
      const menteeRegs = await MenteeRegistration.find({
        ...baseQuery,
        status: { $in: ["submitted", "approved"] },
      });

      for (const reg of menteeRegs) {
        let user = null;
        // Check if userId exists (it might not be in the type but could exist in the document)
        const regAny = reg as any;
        if (regAny.userId) {
          user = await User.findById(regAny.userId).select("firstName lastName email profilePicture role");
        } else if (reg.personalEmail) {
          user = await User.findOne({ email: reg.personalEmail.toLowerCase() }).select(
            "firstName lastName email profilePicture role"
          );
        }

        if (user) {
          const userId = user._id.toString();
          // Skip if already added
          if (memberIds.has(userId)) continue;
          
          // If requester is alumni, exclude staff/admin members
          if (isAlumni) {
            const menteeUserRole = user.role;
            if (menteeUserRole === UserRole.STAFF || menteeUserRole === UserRole.HOD || menteeUserRole === UserRole.COLLEGE_ADMIN) {
              continue; // Skip this member
            }
          }
          
          memberIds.add(userId);
            members.push({
              id: userId,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profilePicture: user.profilePicture,
              role: "Mentee",
            });
          }
      }

      // Also get members from actual chat messages (people who have sent messages)
      const uniqueSenderIds = await ProgramChat.distinct("sender", baseQuery);
      
      // Get user details for all unique senders
      const senderUsers = await User.find({
        _id: { $in: uniqueSenderIds },
      }).select("firstName lastName email profilePicture role");

      // Add members from chat messages who aren't already in the list
      for (const senderUser of senderUsers) {
        const senderId = senderUser._id.toString();
        if (memberIds.has(senderId)) continue;
        
        // If requester is alumni, exclude staff/admin members
        if (isAlumni) {
          const senderRole = senderUser.role;
          if (senderRole === UserRole.STAFF || senderRole === UserRole.HOD || senderRole === UserRole.COLLEGE_ADMIN) {
            continue; // Skip this member
          }
        }

        // Determine role
        let role = "Mentee"; // Default
        if (senderUser.role === UserRole.STAFF) {
          role = "Staff";
        } else if (senderUser.role === UserRole.HOD || senderUser.role === UserRole.COLLEGE_ADMIN) {
          role = "Admin";
        } else {
          // Check if they're a mentor
          const mentorCheck = await MentorRegistration.findOne({
            ...baseQuery,
            userId: senderId,
            status: { $in: ["submitted", "approved"] },
          });
          if (mentorCheck) {
            role = "Mentor";
          } else {
            // Check if they're a mentee
            const menteeCheck = await MenteeRegistration.findOne({
              ...baseQuery,
              $or: [
                { userId: senderId },
                { personalEmail: senderUser.email?.toLowerCase() },
                { preferredMailingAddress: senderUser.email?.toLowerCase() },
              ],
              status: { $in: ["submitted", "approved"] },
            });
            if (menteeCheck) {
              role = "Mentee";
            }
          }
        }

        memberIds.add(senderId);
            members.push({
          id: senderId,
          firstName: senderUser.firstName,
          lastName: senderUser.lastName,
          email: senderUser.email,
          profilePicture: senderUser.profilePicture,
          role: role,
            });
      }

      return res.status(200).json({
        success: true,
        data: {
          members: members.sort((a, b) => {
            // Sort mentors first, then mentees
            if (a.role === "Mentor" && b.role !== "Mentor") return -1;
            if (a.role !== "Mentor" && b.role === "Mentor") return 1;
            // Then sort by name
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          }),
        },
      });
    } catch (error: any) {
      logger.error("Get program chat members error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get program chat members",
      });
    }
  }
);

