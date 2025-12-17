import { Router } from "express";
import {
    createBooking,
    createCustomBooking,
    getBookings,
    getUserBookings,
    updateBookingStatus,
    cancelBooking,
    getBookingStats,
} from "../controllers/bookingController.js";

const router = Router();

// Admin routes
router.get("/", getBookings);
router.get("/stats", getBookingStats);
router.patch("/:id/status", updateBookingStatus);

// User routes
router.get("/user/:userId", getUserBookings);
router.post("/", createBooking);
router.post("/custom", createCustomBooking);
router.delete("/:id", cancelBooking);

export default router;
