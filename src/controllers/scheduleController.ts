import { Request, Response } from "express";
import Schedule from "../models/Schedule.js";

// Create a new schedule
export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { date, timeSlots, timezone, isActive } = req.body;

        const schedule = new Schedule({
            date: new Date(date),
            timeSlots: timeSlots || [],
            timezone: timezone || "Canada/Eastern",
            isActive: isActive !== false,
            createdBy: req.body.adminId, // From auth middleware if available
        });

        await schedule.save();

        res.status(201).json({
            success: true,
            message: "Schedule created successfully",
            data: schedule,
        });
    } catch (error: any) {
        console.error("Error creating schedule:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create schedule",
            error: error.message,
        });
    }
};

// Bulk create schedules for multiple dates
export const bulkCreateSchedules = async (req: Request, res: Response) => {
    try {
        const { dates, timeSlots, timezone } = req.body;

        if (!dates || !Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of dates",
            });
        }

        const schedules = await Promise.all(
            dates.map(async (date: string) => {
                // Check if schedule already exists for this date
                const existingSchedule = await Schedule.findOne({
                    date: new Date(date),
                });

                if (existingSchedule) {
                    // Add new time slots to existing schedule
                    const newSlots = timeSlots.filter(
                        (slot: any) =>
                            !existingSchedule.timeSlots.some(
                                (existing) =>
                                    existing.startTime === slot.startTime &&
                                    existing.endTime === slot.endTime
                            )
                    );
                    existingSchedule.timeSlots.push(...newSlots);
                    await existingSchedule.save();
                    return existingSchedule;
                }

                const schedule = new Schedule({
                    date: new Date(date),
                    timeSlots: timeSlots || [],
                    timezone: timezone || "Canada/Eastern",
                    isActive: true,
                    createdBy: req.body.adminId,
                });

                await schedule.save();
                return schedule;
            })
        );

        res.status(201).json({
            success: true,
            message: `${schedules.length} schedule(s) created/updated successfully`,
            data: schedules,
        });
    } catch (error: any) {
        console.error("Error bulk creating schedules:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create schedules",
            error: error.message,
        });
    }
};

// Get all schedules (admin view)
export const getSchedules = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        let query: any = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string),
            };
        }

        const schedules = await Schedule.find(query)
            .sort({ date: 1 })
            .populate("createdBy", "email");

        res.json({
            success: true,
            data: schedules,
        });
    } catch (error: any) {
        console.error("Error fetching schedules:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch schedules",
            error: error.message,
        });
    }
};

// Get available schedules (public - for users)
export const getAvailableSchedules = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const schedules = await Schedule.find({
            date: { $gte: today },
            isActive: true,
        }).sort({ date: 1 });

        // Filter out fully booked slots
        const availableSchedules = schedules
            .map((schedule) => {
                const availableSlots = schedule.timeSlots.filter(
                    (slot) => !slot.isBooked
                );
                return {
                    _id: schedule._id,
                    date: schedule.date,
                    timeSlots: availableSlots,
                    timezone: schedule.timezone,
                };
            })
            .filter((schedule) => schedule.timeSlots.length > 0);

        res.json({
            success: true,
            data: availableSchedules,
        });
    } catch (error: any) {
        console.error("Error fetching available schedules:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch available schedules",
            error: error.message,
        });
    }
};

// Update a schedule
export const updateSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date, timeSlots, timezone, isActive } = req.body;

        const schedule = await Schedule.findById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found",
            });
        }

        if (date) schedule.date = new Date(date);
        if (timeSlots) schedule.timeSlots = timeSlots;
        if (timezone) schedule.timezone = timezone;
        if (typeof isActive === "boolean") schedule.isActive = isActive;

        await schedule.save();

        res.json({
            success: true,
            message: "Schedule updated successfully",
            data: schedule,
        });
    } catch (error: any) {
        console.error("Error updating schedule:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update schedule",
            error: error.message,
        });
    }
};

// Delete a schedule
export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const schedule = await Schedule.findByIdAndDelete(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found",
            });
        }

        res.json({
            success: true,
            message: "Schedule deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting schedule:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete schedule",
            error: error.message,
        });
    }
};

// Toggle schedule active status
export const toggleScheduleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const schedule = await Schedule.findById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found",
            });
        }

        schedule.isActive = !schedule.isActive;
        await schedule.save();

        res.json({
            success: true,
            message: `Schedule ${schedule.isActive ? "activated" : "deactivated"} successfully`,
            data: schedule,
        });
    } catch (error: any) {
        console.error("Error toggling schedule status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to toggle schedule status",
            error: error.message,
        });
    }
};
