import { Request, Response } from "express";
import FreeAssessmentContent from "../models/FreeAssessmentContent.js";

// Get content by section type
export const getContentByType = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        if (!["listening", "reading", "writing"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid section type" });
        }

        const content = await FreeAssessmentContent.findOne({ sectionType: type });

        res.json({
            success: true,
            data: content || null
        });
    } catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get active content by section type (for frontend)
export const getActiveContent = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        if (!["listening", "reading", "writing"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid section type" });
        }

        const content = await FreeAssessmentContent.findOne({
            sectionType: type,
            isActive: true
        });

        if (!content) {
            return res.status(404).json({ success: false, message: "No active content found" });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error("Error fetching active content:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create or update listening content
export const saveListeningContent = async (req: Request, res: Response) => {
    try {
        const { listeningParts, isActive } = req.body;

        // Validate parts
        if (!listeningParts || !Array.isArray(listeningParts)) {
            return res.status(400).json({ success: false, message: "Listening parts are required" });
        }

        // Validate each part has at least partNumber (allow empty audioUrl for draft state)
        for (const part of listeningParts) {
            if (!part.partNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Each part must have a partNumber"
                });
            }
        }

        // Find existing or create new
        let content = await FreeAssessmentContent.findOne({ sectionType: "listening" });

        if (content) {
            content.listeningParts = listeningParts;
            content.isActive = isActive ?? content.isActive;
        } else {
            content = new FreeAssessmentContent({
                sectionType: "listening",
                listeningParts,
                isActive: isActive ?? false
            });
        }

        await content.save();

        res.json({
            success: true,
            message: "Listening content saved successfully",
            data: content
        });
    } catch (error) {
        console.error("Error saving listening content:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update a specific listening part
export const updateListeningPart = async (req: Request, res: Response) => {
    try {
        const { partNumber } = req.params;
        const { audioUrl, audioTitle, audioDescription, questions } = req.body;

        const content = await FreeAssessmentContent.findOne({ sectionType: "listening" });

        if (!content) {
            // Create new content with this part
            const newContent = new FreeAssessmentContent({
                sectionType: "listening",
                listeningParts: [{
                    partNumber: parseInt(partNumber),
                    audioUrl,
                    audioTitle,
                    audioDescription,
                    questions: questions || []
                }],
                isActive: false
            });
            await newContent.save();
            return res.json({ success: true, data: newContent });
        }

        // Find and update the part
        const partIndex = content.listeningParts?.findIndex(
            p => p.partNumber === parseInt(partNumber)
        );

        if (partIndex === undefined || partIndex === -1) {
            // Add new part
            content.listeningParts = content.listeningParts || [];
            content.listeningParts.push({
                partNumber: parseInt(partNumber),
                audioUrl,
                audioTitle,
                audioDescription,
                questions: questions || []
            });
        } else {
            // Update existing part
            content.listeningParts![partIndex] = {
                partNumber: parseInt(partNumber),
                audioUrl,
                audioTitle,
                audioDescription,
                questions: questions || []
            };
        }

        await content.save();

        res.json({
            success: true,
            message: `Part ${partNumber} updated successfully`,
            data: content
        });
    } catch (error) {
        console.error("Error updating listening part:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Toggle active status
export const toggleActiveStatus = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        const content = await FreeAssessmentContent.findOne({ sectionType: type });

        if (!content) {
            return res.status(404).json({ success: false, message: "Content not found" });
        }

        content.isActive = !content.isActive;
        await content.save();

        res.json({
            success: true,
            message: `Content ${content.isActive ? "activated" : "deactivated"}`,
            data: { isActive: content.isActive }
        });
    } catch (error) {
        console.error("Error toggling status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete a listening part
export const deleteListeningPart = async (req: Request, res: Response) => {
    try {
        const { partNumber } = req.params;

        const content = await FreeAssessmentContent.findOne({ sectionType: "listening" });

        if (!content || !content.listeningParts) {
            return res.status(404).json({ success: false, message: "Content not found" });
        }

        content.listeningParts = content.listeningParts.filter(
            p => p.partNumber !== parseInt(partNumber)
        );

        await content.save();

        res.json({
            success: true,
            message: `Part ${partNumber} deleted successfully`,
            data: content
        });
    } catch (error) {
        console.error("Error deleting part:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Upload audio file to Cloudinary
export const uploadAudio = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No audio file uploaded" });
        }

        // Import Cloudinary utility dynamically to avoid circular deps
        const { uploadAudioToCloudinary } = await import("../utils/cloudinary.js");

        // Upload to Cloudinary
        const result = await uploadAudioToCloudinary(req.file.buffer, req.file.originalname);

        res.json({
            success: true,
            message: "Audio uploaded successfully to Cloudinary",
            data: {
                filename: result.public_id,
                audioUrl: result.secure_url, // This is the Cloudinary URL
                originalName: result.original_filename,
                size: result.bytes,
                duration: result.duration,
                format: result.format
            }
        });
    } catch (error) {
        console.error("Error uploading audio:", error);
        res.status(500).json({ success: false, message: "Failed to upload audio to cloud storage" });
    }
};
