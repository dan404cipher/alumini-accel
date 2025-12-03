import { Request, Response } from "express";
import mongoose from "mongoose";
import Event from "../models/Event";
import User from "../models/User";
import { logger } from "../utils/logger";
import { emailService } from "../services/emailService";
import Tenant from "../models/Tenant";
import { EventType, RewardTriggerEvent } from "../types";
import { awardPointsForTrigger } from "../services/pointsService";

// Get all events
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only show events from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    // Apply filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.location)
      filter.location = { $regex: req.query.location, $options: "i" };
    if (req.query.isOnline !== undefined)
      filter.isOnline = req.query.isOnline === "true";
    if (req.query.isUpcoming) {
      filter.startDate = { $gte: new Date() };
    }

    // Search filter
    if (req.query.search) {
      const searchConditions = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { location: { $regex: req.query.search, $options: "i" } },
        { tags: { $in: [new RegExp(req.query.search as string, "i")] } },
      ];
      
      // If filter.$or already exists, combine with $and
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: filter.$or });
        filter.$and.push({ $or: searchConditions });
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // Date range filter
    if (req.query.dateRange && req.query.dateRange !== "all") {
      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      const thisYearStart = new Date(today.getFullYear(), 0, 1);

      switch (req.query.dateRange) {
        case "today":
          filter.startDate = { $gte: today, $lt: tomorrow };
          break;
        case "tomorrow":
          filter.startDate = { $gte: tomorrow };
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          filter.startDate = { $gte: tomorrow, $lt: dayAfterTomorrow };
          break;
        case "this_week":
          filter.startDate = { $gte: thisWeekStart };
          break;
        case "next_week":
          const nextWeekStart = new Date(thisWeekStart);
          nextWeekStart.setDate(thisWeekStart.getDate() + 7);
          const nextWeekEnd = new Date(nextWeekStart);
          nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
          filter.startDate = { $gte: nextWeekStart, $lt: nextWeekEnd };
          break;
        case "this_month":
          filter.startDate = { $gte: thisMonthStart };
          break;
        case "next_month":
          const nextMonthStart = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            1
          );
          const nextMonthEnd = new Date(
            today.getFullYear(),
            today.getMonth() + 2,
            1
          );
          filter.startDate = { $gte: nextMonthStart, $lt: nextMonthEnd };
          break;
        case "this_year":
          filter.startDate = { $gte: thisYearStart };
          break;
      }
    }

    // Price filter
    if (req.query.price && req.query.price !== "all") {
      const priceValue = req.query.price as string;
      if (priceValue === "free") {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { price: { $exists: false } },
            { price: 0 },
            { price: null },
          ],
        });
      } else if (priceValue.includes("-")) {
        const [min, max] = priceValue.split("-").map((p) => parseFloat(p.trim()));
        if (!isNaN(min) && !isNaN(max)) {
          filter.price = { $gte: min, $lte: max };
        } else if (!isNaN(min)) {
          filter.price = { $gte: min };
        }
      } else if (priceValue.endsWith("+")) {
        const min = parseFloat(priceValue.replace("+", ""));
        if (!isNaN(min)) {
          filter.price = { $gte: min };
        }
      }
    }

    const events = await Event.find(filter)
      .populate("organizer", "firstName lastName email profilePicture")
      .populate("customEventType", "name")
      .select("+attendees") // Ensure attendees are included in response
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    // Ensure currentAttendees reflects confirmed registrations in the response
    const eventsWithCounts = events.map((evt: any) => {
      const confirmed = Array.isArray(evt.attendees)
        ? evt.attendees.filter((a: any) => a && a.status === "registered")
            .length
        : 0;
      // Don't persist here; just override for response
      const obj = evt.toObject ? evt.toObject() : evt;
      obj.currentAttendees = confirmed;
      // If custom event type exists, use its name, otherwise use the enum type
      if (obj.customEventType && obj.customEventType.name) {
        obj.typeDisplayName = obj.customEventType.name;
      } else {
        // Map enum values to display names
        const typeMap: Record<string, string> = {
          meetup: "Meetup",
          workshop: "Workshop",
          webinar: "Webinar",
          conference: "Conference",
          career_fair: "Career Fair",
          reunion: "Reunion",
        };
        obj.typeDisplayName = typeMap[obj.type] || obj.type;
      }
      return obj;
    });

    const total = await Event.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        events: eventsWithCounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get all events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

// Get event by ID
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "firstName lastName email profilePicture")
      .populate("attendees.userId", "firstName lastName email profilePicture")
      .populate("customEventType", "name");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Ensure currentAttendees reflects confirmed registrations
    const confirmed = Array.isArray(event.attendees)
      ? event.attendees.filter((a: any) => a && a.status === "registered")
          .length
      : 0;
    const eventObj = event.toObject ? event.toObject() : event;
    eventObj.currentAttendees = confirmed;

    return res.json({
      success: true,
      data: { event: eventObj },
    });
  } catch (error) {
    logger.error("Get event by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};

// Create event with image upload
export const createEventWithImage = async (req: Request, res: Response) => {
  try {
    const { eventData } = req.body;
    const eventInfo = JSON.parse(eventData);
    const imageFile = req.file;

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      isOnline,
      onlineUrl,
      meetingLink,
      maxAttendees,
      registrationDeadline,
      speakers,
      agenda,
      tags,
      price,
      organizerNotes,
    } = eventInfo;

    // Handle image upload
    let imageUrl = "";
    if (imageFile) {
      // In a real application, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
      // For now, we'll just use the original filename
      imageUrl = `/uploads/events/${imageFile.filename}`;
    }

    // Check if type is a custom category (ObjectId) or default enum
    const isCustomType = type && mongoose.Types.ObjectId.isValid(type);
    const eventType = isCustomType ? type : type;

    const event = new Event({
      title,
      description,
      type: eventType,
      customEventType: isCustomType ? type : undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      isOnline: isOnline || false,
      meetingLink: meetingLink || onlineUrl,
      maxAttendees: maxAttendees || 0,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : undefined,
      organizer: req.user.id,
      tenantId: req.user.tenantId, // Add tenantId for multi-tenant filtering
      speakers: speakers || [],
      agenda: agenda || [],
      tags: tags || [],
      image: imageUrl,
      price: price || 0,
      organizerNotes,
    });

    try {
      await event.save();
    } catch (saveError) {
      console.error("Error saving event to database:", saveError);
      throw saveError;
    }

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { event },
    });
  } catch (error) {
    console.error("Create event with image error:", error);
    logger.error("Create event with image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create event
export const createEvent = async (req: Request, res: Response) => {
  try {
    console.log("Received event data:", req.body);

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      isOnline,
      onlineUrl,
      meetingLink,
      maxAttendees,
      registrationDeadline,
      speakers,
      agenda,
      tags,
      image,
      price,
      organizerNotes,
    } = req.body;

    // Check if type is a custom category (ObjectId) or default enum
    const isCustomType = type && mongoose.Types.ObjectId.isValid(type);
    const eventType = isCustomType ? type : type;

    const event = new Event({
      title,
      description,
      type: eventType,
      customEventType: isCustomType ? type : undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      isOnline: isOnline || false,
      meetingLink: meetingLink || onlineUrl, // Use meetingLink if provided, fallback to onlineUrl
      maxAttendees: maxAttendees || 0,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : undefined,
      organizer: req.user.id,
      tenantId: req.user.tenantId, // Add tenantId for multi-tenant filtering
      speakers: speakers || [],
      agenda: agenda || [],
      tags: tags || [],
      image,
      price: price || 0,
      organizerNotes,
    });

    await event.save();

    console.log("Event saved to database:", {
      id: event._id,
      title: event.title,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      isOnline: event.isOnline,
      meetingLink: event.meetingLink,
      maxAttendees: event.maxAttendees,
      tags: event.tags,
      image: event.image,
      price: event.price,
      organizer: event.organizer,
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { event },
    });
  } catch (error) {
    logger.error("Create event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "super_admin" &&
      req.user.role !== "college_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      isOnline,
      onlineUrl,
      maxAttendees,
      registrationDeadline,
      speakers,
      agenda,
      tags,
      image,
      price,
      organizerNotes,
    } = req.body;

    // Update fields if provided
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (type !== undefined) {
      const isCustomType = type && mongoose.Types.ObjectId.isValid(type);
      event.type = type;
      event.customEventType = isCustomType ? type : undefined;
    }
    if (startDate !== undefined) event.startDate = new Date(startDate);
    if (endDate !== undefined) event.endDate = new Date(endDate);
    if (location !== undefined) event.location = location;
    if (isOnline !== undefined) event.isOnline = isOnline;
    if (onlineUrl !== undefined) event.onlineUrl = onlineUrl;
    if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;
    if (registrationDeadline !== undefined)
      event.registrationDeadline = registrationDeadline
        ? new Date(registrationDeadline)
        : undefined;
    if (speakers !== undefined) event.speakers = speakers;
    if (agenda !== undefined) event.agenda = agenda;
    if (tags !== undefined) event.tags = tags;
    if (image !== undefined) event.image = image;
    if (price !== undefined) event.price = price;
    if (organizerNotes !== undefined) event.organizerNotes = organizerNotes;

    await event.save();

    return res.json({
      success: true,
      message: "Event updated successfully",
      data: { event },
    });
  } catch (error) {
    logger.error("Update event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }
};

// Update event with image upload
export const updateEventWithImage = async (req: Request, res: Response) => {
  try {
    const { eventData } = req.body;
    const eventInfo = JSON.parse(eventData);
    const imageFile = req.file;

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      isOnline,
      onlineUrl,
      meetingLink,
      maxAttendees,
      registrationDeadline,
      speakers,
      agenda,
      tags,
      price,
      organizerNotes,
    } = eventInfo;

    // Find the existing event
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "super_admin" &&
      req.user.role !== "college_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    // Handle image upload
    let imageUrl = event.image; // Keep existing image by default
    if (imageFile) {
      // In a real application, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
      // For now, we'll just use the original filename
      imageUrl = `/uploads/events/${imageFile.filename}`;
    }

    // Update event fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (type !== undefined) {
      const isCustomType = type && mongoose.Types.ObjectId.isValid(type);
      event.type = type;
      event.customEventType = isCustomType ? type : undefined;
    }
    if (startDate !== undefined) event.startDate = new Date(startDate);
    if (endDate !== undefined) event.endDate = new Date(endDate);
    if (location !== undefined) event.location = location;
    if (isOnline !== undefined) event.isOnline = isOnline;
    if (meetingLink !== undefined) event.meetingLink = meetingLink;
    if (onlineUrl !== undefined) event.onlineUrl = onlineUrl;
    if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;
    if (registrationDeadline !== undefined) {
      event.registrationDeadline = new Date(registrationDeadline);
    }
    if (speakers !== undefined) event.speakers = speakers;
    if (agenda !== undefined) event.agenda = agenda;
    if (tags !== undefined) event.tags = tags;
    if (imageUrl !== undefined) event.image = imageUrl;
    if (price !== undefined) event.price = price;
    if (organizerNotes !== undefined) event.organizerNotes = organizerNotes;

    await event.save();

    return res.json({
      success: true,
      message: "Event updated successfully",
      data: { event },
    });
  } catch (error) {
    logger.error("Update event with image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "super_admin" &&
      req.user.role !== "college_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    logger.error("Delete event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
};

// Register for event
export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if registration is still open
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed",
      });
    }

    // Check if event is full
    if (
      event.maxAttendees &&
      event.maxAttendees > 0 &&
      event.attendees.length >= event.maxAttendees
    ) {
      return res.status(400).json({
        success: false,
        message: "Event is full",
      });
    }

    // Check if user is already registered
    const existingRegistration = event.attendees.find(
      (attendee) => attendee.userId.toString() === req.user.id
    );

    // Extract additional registration details from request body
    const { phone, dietaryRequirements, emergencyContact, additionalNotes } =
      req.body;

    // If already registered (not pending), block duplicate
    if (existingRegistration && existingRegistration.status === "registered") {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    // If pending payment, allow resuming payment
    if (existingRegistration && existingRegistration.status === "pending_payment") {
      // Update registration details if provided
      if (phone) existingRegistration.phone = phone;
      if (dietaryRequirements) existingRegistration.dietaryRequirements = dietaryRequirements;
      if (emergencyContact) existingRegistration.emergencyContact = emergencyContact;
      if (additionalNotes) existingRegistration.additionalNotes = additionalNotes;
      await event.save();

      return res.json({
        success: true,
        message: "Payment required to complete registration",
        data: {
          status: "pending_payment",
          paymentRequired: true,
          amount: event.price,
          currency: "INR",
          attendee: existingRegistration,
        },
      });
    }

    // Free vs Paid flow (new registration)
    if (!event.price || event.price === 0) {
      // Free event: register immediately
      const attendee = {
        userId: req.user.id,
        registeredAt: new Date(),
        status: "registered" as const,
        phone: phone || "",
        dietaryRequirements: dietaryRequirements || "",
        emergencyContact: emergencyContact || "",
        additionalNotes: additionalNotes || "",
        amountPaid: 0,
        paymentStatus: "free" as const,
      };
      event.attendees.push(attendee as any);
      await event.save();

      // Award points for event participation (only for alumni users)
      try {
        if (req.user?.role === "alumni") {
          await awardPointsForTrigger(
            req.user.id,
            RewardTriggerEvent.EVENT_PARTICIPATION,
            {
              eventId: event._id.toString(),
              eventName: event.title,
            },
            req.user.tenantId
          );
        }
      } catch (pointsError) {
        logger.error("Failed to award points for event participation:", pointsError);
        // Don't fail registration if points award fails
      }

      // Send registration email for free events
      try {
        const organizerDoc = await (Event as any)
          .findById(req.params.id)
          .populate("organizer", "firstName lastName");
        const tenant = event.tenantId
          ? await Tenant.findById(event.tenantId)
          : null;
        await emailService.sendEventRegistrationEmail({
          to: req.user.email,
          attendeeName: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.email,
          eventTitle: event.title,
          eventDescription: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          isOnline: event.isOnline,
          meetingLink: event.meetingLink,
          price: event.price,
          image: event.image,
          collegeName: tenant?.name,
          organizerName: organizerDoc?.organizer ? `${(organizerDoc as any).organizer.firstName || ""} ${(organizerDoc as any).organizer.lastName || ""}`.trim() : undefined,
          speakers: Array.isArray(event.speakers) ? (event.speakers as any) : undefined,
          agenda: Array.isArray(event.agenda) ? (event.agenda as any) : undefined,
        });
      } catch (e) {
        logger.warn("Failed to send free-event registration email", e);
      }

      return res.json({
        success: true,
        message: "Successfully registered for event",
        data: {
          status: "registered",
          paymentRequired: false,
          attendee,
        },
      });
    }

    // Paid event: store registration with pending payment status
    const attendee = {
      userId: req.user.id,
      registeredAt: new Date(),
      status: "pending_payment" as const,
      phone: phone || "",
      dietaryRequirements: dietaryRequirements || "",
      emergencyContact: emergencyContact || "",
      additionalNotes: additionalNotes || "",
      amountPaid: 0,
      paymentStatus: "pending" as const,
    };
    event.attendees.push(attendee as any);
    await event.save();

    // Paid event - pending payment; do not send email yet
    return res.json({
      success: true,
      message: "Payment required to complete registration",
      data: {
        status: "pending_payment",
        paymentRequired: true,
        amount: event.price,
        currency: "INR",
        attendee,
      },
    });
  } catch (error) {
    logger.error("Register for event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register for event",
    });
  }
};

// Confirm paid registration (callback/webhook-safe manual endpoint)
export const confirmPaidRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // event id
    const { paymentStatus } = req.body; // expected 'success'

    const event = await Event.findById(id).populate("organizer", "firstName lastName");
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (paymentStatus !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful",
      });
    }

    // Find existing registration and update it
    const existingRegistration = event.attendees.find(
      (attendee) => attendee.userId.toString() === req.user.id
    );

    if (!existingRegistration) {
      return res.status(404).json({
        success: false,
        message: "No pending registration found",
      });
    }

    // Update existing registration to confirmed
    existingRegistration.status = "registered";
    existingRegistration.paymentStatus = "successful";
    existingRegistration.amountPaid = event.price;
    await event.save();

    // Send registration confirmation email for paid events after success
    try {
      const tenant = event.tenantId ? await Tenant.findById(event.tenantId) : null;
      await emailService.sendEventRegistrationEmail({
        to: req.user.email,
        attendeeName: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.email,
        eventTitle: event.title,
        eventDescription: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        isOnline: event.isOnline,
        meetingLink: event.meetingLink,
        price: event.price,
        image: event.image,
        collegeName: tenant?.name,
        organizerName: (event as any).organizer ? `${(event as any).organizer.firstName || ""} ${(event as any).organizer.lastName || ""}`.trim() : undefined,
        speakers: Array.isArray(event.speakers) ? (event.speakers as any) : undefined,
        agenda: Array.isArray(event.agenda) ? (event.agenda as any) : undefined,
      });
    } catch (e) {
      logger.warn("Failed to send paid-event registration email", e);
    }

    return res.json({
      success: true,
      message: "Registration confirmed",
      data: { status: "registered" },
    });
  } catch (error) {
    logger.error("Confirm paid registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm registration",
    });
  }
};

// Participants list for organizers
export const getEventParticipants = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "attendees.userId",
      "firstName lastName email phone profilePicture"
    );

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Only organizer or privileged roles can view participants
    if (
      event.organizer.toString() !== req.user.id &&
      !["hod", "staff", "college_admin", "super_admin"].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const participants = event.attendees.map((a: any) => ({
      user: {
        firstName: a.userId?.firstName || "",
        lastName: a.userId?.lastName || "",
        email: a.userId?.email || "",
        phone: a.userId?.phone || "",
      },
      status: a.status || "registered",
      registeredAt: a.registeredAt,
      phone: a.phone || "",
      dietaryRequirements: a.dietaryRequirements || "",
      emergencyContact: a.emergencyContact || "",
      additionalNotes: a.additionalNotes || "",
      amountPaid: a.amountPaid || 0,
      paymentStatus: a.paymentStatus || "free",
    }));

    return res.json({ success: true, data: { participants } });
  } catch (error) {
    logger.error("Get participants error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch participants" });
  }
};

// Unregister from event
export const unregisterFromEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Find and remove user from attendees
    const attendeeIndex = event.attendees.findIndex(
      (attendee) => attendee.userId.toString() === req.user.id
    );

    if (attendeeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not registered for this event",
      });
    }

    event.attendees.splice(attendeeIndex, 1);
    await event.save();

    return res.json({
      success: true,
      message: "Successfully unregistered from event",
    });
  } catch (error) {
    logger.error("Unregister from event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unregister from event",
    });
  }
};

// Submit event feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user attended the event
    const attended = event.attendees.find(
      (attendee) => attendee.userId.toString() === req.user.id
    );

    if (!attended) {
      return res.status(400).json({
        success: false,
        message: "You must attend the event to submit feedback",
      });
    }

    // Check if event has ended
    if (new Date() < event.endDate) {
      return res.status(400).json({
        success: false,
        message: "Event has not ended yet",
      });
    }

    // Check if user already submitted feedback
    const existingFeedback = event.feedback.find(
      (feedback) => feedback.userId.toString() === req.user.id
    );

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this event",
      });
    }

    event.feedback.push({
      userId: req.user.id,
      rating,
      comment,
      date: new Date(),
    });

    await event.save();

    return res.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    logger.error("Submit feedback error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

// Get upcoming events
export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find({
      startDate: { $gte: new Date() },
    })
      .populate("organizer", "firstName lastName email profilePicture")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments({
      startDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get upcoming events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming events",
    });
  }
};

// Search events
export const searchEvents = async (req: Request, res: Response) => {
  try {
    const { q, type, location, isOnline, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filter: any = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q as string, "i")] } },
      ];
    }

    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (isOnline) filter.isOnline = isOnline === "true";

    const events = await Event.find(filter)
      .populate("organizer", "firstName lastName email profilePicture")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Event.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error("Search events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search events",
    });
  }
};

// Get my events (organized by user)
export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find({ organizer: req.user.id })
      .populate("organizer", "firstName lastName email profilePicture")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments({ organizer: req.user.id });

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get my events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your events",
    });
  }
};

// Get events I'm attending
export const getMyAttendingEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find({
      "attendees.userId": req.user.id,
    })
      .populate("organizer", "firstName lastName email profilePicture")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments({
      "attendees.userId": req.user.id,
    });

    return res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get my attending events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch events you are attending",
    });
  }
};

// Get event statistics
export const getEventStats = async (req: Request, res: Response) => {
  try {
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({
      startDate: { $gte: new Date() },
    });
    const onlineEvents = await Event.countDocuments({ isOnline: true });
    const offlineEvents = await Event.countDocuments({ isOnline: false });

    const typeStats = await Event.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const monthlyStats = await Event.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$startDate" },
            month: { $month: "$startDate" },
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
        totalEvents,
        upcomingEvents,
        onlineEvents,
        offlineEvents,
        typeStats,
        monthlyStats,
      },
    });
  } catch (error) {
    logger.error("Get event stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch event statistics",
    });
  }
};

// Save event for alumni
export const saveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is alumni
    const user = await User.findById(userId);
    if (!user || user.role !== "alumni") {
      return res.status(403).json({
        success: false,
        message: "Only alumni can save events",
      });
    }

    // Check if event is already saved
    if (user.savedEvents?.includes(id)) {
      return res.status(400).json({
        success: false,
        message: "Event already saved",
      });
    }

    // Add event to saved events
    if (!user.savedEvents) {
      user.savedEvents = [];
    }
    user.savedEvents.push(id);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Event saved successfully",
    });
  } catch (error) {
    logger.error("Save event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save event",
    });
  }
};

// Unsave event for alumni
export const unsaveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is alumni
    const user = await User.findById(userId);
    if (!user || user.role !== "alumni") {
      return res.status(403).json({
        success: false,
        message: "Only alumni can unsave events",
      });
    }

    // Check if event is saved
    if (!user.savedEvents?.includes(id)) {
      return res.status(400).json({
        success: false,
        message: "Event not saved",
      });
    }

    // Remove event from saved events
    user.savedEvents = user.savedEvents.filter(
      (eventId) => eventId.toString() !== id
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Event unsaved successfully",
    });
  } catch (error) {
    logger.error("Unsave event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unsave event",
    });
  }
};

// Get saved events for alumni
export const getSavedEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get user with saved events
    const user = await User.findById(userId).populate("savedEvents");
    if (!user || user.role !== "alumni") {
      return res.status(403).json({
        success: false,
        message: "Only alumni can view saved events",
      });
    }

    const savedEvents = user.savedEvents || [];

    return res.status(200).json({
      success: true,
      data: {
        events: savedEvents,
        count: savedEvents.length,
      },
    });
  } catch (error) {
    logger.error("Get saved events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get saved events",
    });
  }
};

export default {
  getAllEvents,
  getEventById,
  createEvent,
  createEventWithImage,
  updateEvent,
  updateEventWithImage,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  submitFeedback,
  getUpcomingEvents,
  searchEvents,
  getMyEvents,
  getMyAttendingEvents,
  getEventStats,
  saveEvent,
  unsaveEvent,
  getSavedEvents,
  confirmPaidRegistration,
  getEventParticipants,
};
