import { Router } from "express";
import {
    getContentByType,
    getSetsByType,
    getActiveContent,
    saveListeningContent,
    saveReadingContent,
    saveWritingContent,
    updateListeningPart,
    toggleActiveStatus,
    toggleUseGeneralContent,
    deleteSet,
    uploadAudio,
    uploadImage
} from "../controllers/freeAssessmentContentController.js";
import { audioUpload, imageUpload } from "../utils/upload.js";

const router = Router();

// Public route - get active content for frontend
router.get("/active/:type", getActiveContent);

// Get all sets for a specific section and exam type
router.get("/sets/:type", getSetsByType);

// Specific routes BEFORE generic /:type route
router.post("/listening", saveListeningContent);
router.post("/reading", saveReadingContent);
router.post("/writing", saveWritingContent);
router.put("/listening/part/:partNumber", updateListeningPart);

// Delete an entire assessment set
router.delete("/set/:setId", deleteSet);

// Upload routes
router.post("/upload/audio", audioUpload.single("audio"), uploadAudio);
router.post("/upload/image", imageUpload.single("image"), uploadImage);

// Toggle routes with type parameter (now takes setId in body)
router.patch("/:type/toggle", toggleActiveStatus);
router.patch("/:type/toggle-use-general", toggleUseGeneralContent);

// Generic route LAST (catch-all for type, now supports ?setId=)
router.get("/:type", getContentByType);

export default router;
