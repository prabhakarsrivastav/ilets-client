import { Router } from "express";
import {
    getContentByType,
    getActiveContent,
    saveListeningContent,
    saveReadingContent,
    saveWritingContent,
    updateListeningPart,
    toggleActiveStatus,
    toggleUseGeneralContent,
    deleteListeningPart,
    uploadAudio,
    uploadImage
} from "../controllers/freeAssessmentContentController.js";
import { audioUpload, imageUpload } from "../utils/upload.js";

const router = Router();

// Public route - get active content for frontend
router.get("/active/:type", getActiveContent);

// Specific routes BEFORE generic /:type route
router.post("/listening", saveListeningContent);
router.post("/reading", saveReadingContent);
router.post("/writing", saveWritingContent);
router.put("/listening/part/:partNumber", updateListeningPart);
router.delete("/listening/part/:partNumber", deleteListeningPart);

// Upload routes
router.post("/upload/audio", audioUpload.single("audio"), uploadAudio);
router.post("/upload/image", imageUpload.single("image"), uploadImage);

// Toggle routes with type parameter
router.patch("/:type/toggle", toggleActiveStatus);
router.patch("/:type/toggle-use-general", toggleUseGeneralContent);

// Generic route LAST (catch-all for type)
router.get("/:type", getContentByType);

export default router;
