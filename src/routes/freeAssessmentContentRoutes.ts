import { Router } from "express";
import {
    getContentByType,
    getActiveContent,
    saveListeningContent,
    updateListeningPart,
    toggleActiveStatus,
    deleteListeningPart,
    uploadAudio
} from "../controllers/freeAssessmentContentController.js";
import { audioUpload } from "../utils/upload.js";

const router = Router();

// Public route - get active content for frontend
router.get("/active/:type", getActiveContent);

// Specific routes BEFORE generic /:type route
router.post("/listening", saveListeningContent);
router.put("/listening/part/:partNumber", updateListeningPart);
router.delete("/listening/part/:partNumber", deleteListeningPart);

// Audio upload route
router.post("/upload/audio", audioUpload.single("audio"), uploadAudio);

// Toggle route with type parameter
router.patch("/:type/toggle", toggleActiveStatus);

// Generic route LAST (catch-all for type)
router.get("/:type", getContentByType);

export default router;
