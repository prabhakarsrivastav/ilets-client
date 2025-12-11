import { Router } from "express";
import {
    createFreeAssessment,
    updateAssessmentProgress,
    getAllFreeAssessments,
    getFreeAssessmentById,
    getAssessmentStats,
} from "../controllers/freeAssessmentController.js";

const router = Router();

// Public routes (for oneeka frontend)
router.post("/", createFreeAssessment);
router.put("/:id/progress", updateAssessmentProgress);

// Admin routes
router.get("/", getAllFreeAssessments);
router.get("/stats", getAssessmentStats);
router.get("/:id", getFreeAssessmentById);

export default router;
