import { Request, Response } from "express";
import Event from "@/models/Event";
import User from "@/models/User";
import { logger } from "@/utils/logger";
import { EventType } from "@/types";

// Get all events
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

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
      .populate("attendees.user", "firstName lastName email profilePicture");

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
      (attendee) => attendee.user.toString() === req.user.id
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    event.attendees.push({
      userId: req.user.id,
      user: req.user.id,
      registeredAt: new Date(),
      status: "registered",
    });

    await event.save();

    return res.json({
      success: true,
      message: "Successfully registered for event",
    });
  } catch (error) {
    logger.error("Register for event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register for event",
    });
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
      (attendee) => attendee.user.toString() === req.user.id
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
      (attendee) => attendee.user.toString() === req.user.id
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
      (feedback) => feedback.user.toString() === req.user.id
    );

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this event",
      });
    }

    event.feedback.push({
      userId: req.user.id,
      user: req.user.id,
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
      "attendees.user": req.user.id,
    })
      .populate("organizer", "firstName lastName email profilePicture")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments({
      "attendees.user": req.user.id,
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

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  submitFeedback,
  getUpcomingEvents,
  searchEvents,
  getMyEvents,
  getMyAttendingEvents,
  getEventStats,
};
