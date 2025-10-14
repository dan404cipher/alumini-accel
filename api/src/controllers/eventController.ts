import { Request, Response } from "express";
import Event from "../models/Event";
import User from "../models/User";
import { logger } from "../utils/logger";
import { EventType } from "../types";

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

    const events = await Event.find(filter)
      .populate("organizer", "firstName lastName email profilePicture")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filter);

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
      .populate("attendees.userId", "firstName lastName email profilePicture");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: { event },
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

    const event = new Event({
      title,
      description,
      type,
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

    const event = new Event({
      title,
      description,
      type,
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
      req.user.role !== "admin"
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
    if (type !== undefined) event.type = type;
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
      req.user.role !== "admin"
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
    if (type !== undefined) event.type = type;
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
      req.user.role !== "admin"
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

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    // Free vs Paid flow
    if (!event.price || event.price === 0) {
      // Free event: register immediately
      event.attendees.push({
        userId: req.user.id,
        registeredAt: new Date(),
        status: "registered",
      });
      await event.save();

      return res.json({
        success: true,
        message: "Successfully registered for event",
        data: { status: "registered", paymentRequired: false },
      });
    }

    // Paid event: return payment intent info (placeholder)
    return res.json({
      success: true,
      message: "Payment required to complete registration",
      data: {
        status: "pending_payment",
        paymentRequired: true,
        amount: event.price,
        currency: "INR",
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

    const event = await Event.findById(id);
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

    // Prevent duplicates
    const existingRegistration = event.attendees.find(
      (attendee) => attendee.userId.toString() === req.user.id
    );
    if (existingRegistration) {
      return res.status(200).json({
        success: true,
        message: "Already registered",
        data: { status: existingRegistration.status },
      });
    }

    // Create registration
    event.attendees.push({
      userId: req.user.id,
      registeredAt: new Date(),
      status: "registered",
    });
    await event.save();

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
      user: a.userId,
      status: a.status,
      registeredAt: a.registeredAt,
      amountPaid: event.price || 0,
      paymentStatus: event.price && event.price > 0 ? "successful" : "free",
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
