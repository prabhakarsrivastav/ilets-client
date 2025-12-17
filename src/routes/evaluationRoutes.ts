import express from "express";
import {
    getAssessmentForEvaluation,
    calculateAutoGrades,
    saveEvaluation,
} from "../controllers/evaluationController.js";

const router = express.Router();

// Get assessment details for evaluation
router.get("/:id", getAssessmentForEvaluation);

// Calculate auto-grades for an assessment
router.post("/:id/calculate", calculateAutoGrades);

// Save evaluation (with manual overrides)
router.put("/:id", saveEvaluation);

export default router;
