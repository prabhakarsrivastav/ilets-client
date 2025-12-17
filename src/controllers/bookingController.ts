import { Request, Response } from "express";
import Booking from "../models/Booking.js";
import Schedule from "../models/Schedule.js";
import { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } from "../utils/emailService.js";
import { format } from "date-fns";
import FreeAssessment from "../models/FreeAssessment.js";

// Create a standard booking (from scheduled slot)
export const createBooking = async (req: Request, res: Response) => {
    try {
        const { scheduleId, slotIndex, date, timeSlot, details, userId, guestInfo } = req.body;

        // Validate required fields
        if (!details || !details.country || !details.age || !details.preferredLanguage || !details.purpose) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required booking details",
            });
        }

        // Validate guest info if no userId
        if (!userId && (!guestInfo || !guestInfo.fullName || !guestInfo.email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide guest information (name and email)",
            });
        }

        let bookingDate = date;
        let bookingTimeSlot = timeSlot;

        // If booking from a schedule, find and update the slot
        if (scheduleId) {
            const schedule = await Schedule.findById(scheduleId);

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: "Schedule not found",
                });
            }

            if (slotIndex === undefined || slotIndex < 0 || slotIndex >= schedule.timeSlots.length) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid time slot",
                });
            }

            const slot = schedule.timeSlots[slotIndex];

            if (slot.isBooked) {
                return res.status(400).json({
                    success: false,
                    message: "This time slot is already booked",
                });
            }

            // Mark slot as booked
            schedule.timeSlots[slotIndex].isBooked = true;
            await schedule.save();

            bookingDate = schedule.date;
            bookingTimeSlot = {
                startTime: slot.startTime,
                endTime: slot.endTime,
            };
        }

        // Create the booking
        const booking = new Booking({
            user: userId || null,
            guestInfo: guestInfo || null,
            schedule: scheduleId || null,
            date: new Date(bookingDate),
            timeSlot: bookingTimeSlot,
            bookingType: "scheduled",
            status: "pending",
            details,
        });

        await booking.save();

        // Send booking confirmation email
        if (guestInfo?.email) {
            const formattedDate = format(new Date(bookingDate), 'EEEE, MMMM d, yyyy');
            const formattedTime = `${bookingTimeSlot.startTime} - ${bookingTimeSlot.endTime}`;

            sendBookingConfirmationEmail({
                recipientEmail: guestInfo.email,
                recipientName: guestInfo.fullName,
                bookingDate: formattedDate,
                bookingTime: formattedTime,
                consultationType: details.consultationType || 'Video Call',
                purpose: details.purpose,
                isCustomRequest: false,
            }).catch(err => console.error('Failed to send booking email:', err));
        }

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error: any) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message,
        });
    }
};

// Create a custom booking request
export const createCustomBooking = async (req: Request, res: Response) => {
    try {
        const { requestedDates, requestedTimes, message, details, userId, guestInfo } = req.body;

        // Validate required fields
        if (!details || !details.country || !details.age || !details.preferredLanguage || !details.purpose) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required booking details",
            });
        }

        // Validate guest info if no userId
        if (!userId && (!guestInfo || !guestInfo.fullName || !guestInfo.email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide guest information (name and email)",
            });
        }

        if (!requestedDates || requestedDates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one preferred date",
            });
        }

        // Create the custom booking request
        const booking = new Booking({
            user: userId || null,
            guestInfo: guestInfo || null,
            schedule: null,
            date: new Date(requestedDates[0]), // Use first preferred date as primary
            timeSlot: {
                startTime: requestedTimes?.[0] || "TBD",
                endTime: "TBD",
            },
            bookingType: "custom",
            status: "pending",
            customRequest: {
                requestedDates: requestedDates.map((d: string) => new Date(d)),
                requestedTimes: requestedTimes || [],
                message: message || "",
            },
            details,
        });

        await booking.save();

        // Send custom booking request confirmation email
        if (guestInfo?.email) {
            const formattedDate = requestedDates.map((d: string) => format(new Date(d), 'MMM d, yyyy')).join(', ');
            const formattedTime = requestedTimes?.length > 0 ? requestedTimes.join(', ') : 'Flexible';

            sendBookingConfirmationEmail({
                recipientEmail: guestInfo.email,
                recipientName: guestInfo.fullName,
                bookingDate: formattedDate,
                bookingTime: formattedTime,
                consultationType: details.consultationType || 'Video Call',
                purpose: details.purpose,
                isCustomRequest: true,
            }).catch(err => console.error('Failed to send custom booking email:', err));
        }

        res.status(201).json({
            success: true,
            message: "Custom appointment request submitted successfully. Admin will review and confirm.",
            data: booking,
        });
    } catch (error: any) {
        console.error("Error creating custom booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create custom booking request",
            error: error.message,
        });
    }
};



// Get all bookings (admin view)
export const getBookings = async (req: Request, res: Response) => {
    try {
        const { status, bookingType, startDate, endDate } = req.query;

        let query: any = {};

        if (status && status !== "all") {
            query.status = status;
        }

        if (bookingType && bookingType !== "all") {
            query.bookingType = bookingType;
        }

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string),
            };
        }

        const bookings = await Booking.find(query)
            .populate("user", "fullName email phoneNumber")
            .populate("schedule", "date timezone")
            .sort({ createdAt: -1 });

        // Augment bookings with assessment ID
        const bookingsWithAssessment = await Promise.all(bookings.map(async (booking) => {
            const bookingObj = booking.toObject();
            const email = (booking.user as any)?.email || booking.guestInfo?.email;

            if (email) {
                // Find latest assessment for this email
                const assessment = await FreeAssessment.findOne({
                    "personalInfo.email": email
                }).sort({ createdAt: -1 }).select("_id");

                return {
                    ...bookingObj,
                    assessmentId: assessment?._id
                };
            }
            return bookingObj;
        }));

        res.json({
            success: true,
            data: bookingsWithAssessment,
        });
    } catch (error: any) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
};

// Get user's bookings
export const getUserBookings = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const bookings = await Booking.find({ user: userId })
            .populate("schedule", "date timezone")
            .sort({ date: -1 });

        res.json({
            success: true,
            data: bookings,
        });
    } catch (error: any) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
};

// Update booking status (admin)
export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, date, timeSlot } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        const previousStatus = booking.status;
        booking.status = status;

        // For custom bookings, admin can assign a specific date/time
        if (booking.bookingType === "custom" && date && timeSlot) {
            booking.date = new Date(date);
            booking.timeSlot = timeSlot;
        }

        // If cancelling a scheduled booking, free up the slot
        if (status === "cancelled" && previousStatus !== "cancelled" && booking.schedule) {
            const schedule = await Schedule.findById(booking.schedule);
            if (schedule) {
                const slotIndex = schedule.timeSlots.findIndex(
                    (slot) =>
                        slot.startTime === booking.timeSlot.startTime &&
                        slot.endTime === booking.timeSlot.endTime
                );
                if (slotIndex !== -1) {
                    schedule.timeSlots[slotIndex].isBooked = false;
                    await schedule.save();
                }
            }
        }

        await booking.save();

        // Send email notification for status update (confirmed, cancelled, completed)
        if ((status === 'confirmed' || status === 'cancelled' || status === 'completed') && previousStatus !== status) {
            const recipientEmail = booking.guestInfo?.email || null;
            const recipientName = booking.guestInfo?.fullName || 'Valued Customer';

            if (recipientEmail) {
                const formattedDate = format(new Date(booking.date), 'EEEE, MMMM d, yyyy');
                const formattedTime = `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}`;

                sendBookingStatusUpdateEmail({
                    recipientEmail,
                    recipientName,
                    bookingDate: formattedDate,
                    bookingTime: formattedTime,
                    consultationType: booking.details.consultationType || 'Video Call',
                    purpose: booking.details.purpose,
                    status: status as 'confirmed' | 'cancelled' | 'completed',
                }).catch(err => console.error('Failed to send status update email:', err));
            }
        }

        // Populate for response
        await booking.populate("user", "fullName email");

        res.json({
            success: true,
            message: `Booking ${status} successfully`,
            data: booking,
        });
    } catch (error: any) {
        console.error("Error updating booking status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update booking status",
            error: error.message,
        });
    }
};

// Cancel booking (user)
export const cancelBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Verify ownership if userId provided
        if (userId && booking.user && booking.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own bookings",
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        if (booking.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a completed booking",
            });
        }

        // Free up the schedule slot if it was a scheduled booking
        if (booking.schedule) {
            const schedule = await Schedule.findById(booking.schedule);
            if (schedule) {
                const slotIndex = schedule.timeSlots.findIndex(
                    (slot) =>
                        slot.startTime === booking.timeSlot.startTime &&
                        slot.endTime === booking.timeSlot.endTime
                );
                if (slotIndex !== -1) {
                    schedule.timeSlots[slotIndex].isBooked = false;
                    await schedule.save();
                }
            }
        }

        booking.status = "cancelled";
        await booking.save();

        res.json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking,
        });
    } catch (error: any) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking",
            error: error.message,
        });
    }
};

// Get booking statistics (admin dashboard)
export const getBookingStats = async (req: Request, res: Response) => {
    try {
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const customRequestsCount = await Booking.countDocuments({
            bookingType: "custom",
            status: "pending",
        });

        const totalBookings = await Booking.countDocuments();

        const statsMap: Record<string, number> = {
            total: totalBookings,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            customPending: customRequestsCount,
        };

        stats.forEach((stat) => {
            statsMap[stat._id] = stat.count;
        });

        res.json({
            success: true,
            data: statsMap,
        });
    } catch (error: any) {
        console.error("Error fetching booking stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking statistics",
            error: error.message,
        });
    }
};
