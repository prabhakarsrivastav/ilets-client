import { Router } from "express";
import {
    createSchedule,
    bulkCreateSchedules,
    getSchedules,
    getAvailableSchedules,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
} from "../controllers/scheduleController.js";

const router = Router();

// Public route - get available schedules for users
router.get("/available", getAvailableSchedules);

// Admin routes
router.get("/", getSchedules);
router.post("/", createSchedule);
router.post("/bulk", bulkCreateSchedules);
router.put("/:id", updateSchedule);
router.patch("/:id/toggle", toggleScheduleStatus);
router.delete("/:id", deleteSchedule);

export default router;
