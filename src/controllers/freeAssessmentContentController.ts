import { Request, Response } from "express";
import FreeAssessmentContent from "../models/FreeAssessmentContent.js";

// Get content by section type and exam type
export const getContentByType = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        const examType = (req.query.examType as string) || "general";

        if (!["listening", "reading", "writing"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid section type" });
        }

        if (!["general", "academic"].includes(examType)) {
            return res.status(400).json({ success: false, message: "Invalid exam type" });
        }

        const content = await FreeAssessmentContent.findOne({ sectionType: type, examType });

        res.json({
            success: true,
            data: content || null
        });
    } catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get active content by section type and exam type (for frontend)
export const getActiveContent = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        let examType = (req.query.examType as string) || "general";

        if (!["listening", "reading", "writing"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid section type" });
        }

        // Map "general-education" to "general" (same content)
        if (examType === "general-education") {
            examType = "general";
        }

        if (!["general", "academic"].includes(examType)) {
            return res.status(400).json({ success: false, message: "Invalid exam type" });
        }

        // For Academic exam type, check if useGeneralContent is enabled
        if (examType === "academic") {
            const academicContent = await FreeAssessmentContent.findOne({
                sectionType: type,
                examType: "academic"
            });

            // If Academic has useGeneralContent enabled, return General content
            if (academicContent?.useGeneralContent) {
                const generalContent = await FreeAssessmentContent.findOne({
                    sectionType: type,
                    examType: "general",
                    isActive: true
                });

                if (!generalContent) {
                    return res.status(404).json({
                        success: false,
                        message: "No active General content found. Please activate General content first."
                    });
                }

                return res.json({
                    success: true,
                    data: generalContent,
                    usingGeneralContent: true // Flag to indicate we're using General content
                });
            }
        }

        // Normal flow: get content for requested exam type
        const content = await FreeAssessmentContent.findOne({
            sectionType: type,
            examType,
            isActive: true
        });

        if (!content) {
            return res.status(404).json({ success: false, message: "No active content found for this exam type" });
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
        const {
            listeningParts,
            isActive,
            examType,
            // Section-level audio (single 30-min clip)
            listeningAudioUrl,
            listeningAudioTitle,
            listeningAudioDescription
        } = req.body;

        // Default to "general" if not provided
        const validExamType = examType || "general";
        if (!["general", "academic"].includes(validExamType)) {
            return res.status(400).json({ success: false, message: "Invalid exam type" });
        }

        // Validate parts
        if (!listeningParts || !Array.isArray(listeningParts)) {
            return res.status(400).json({ success: false, message: "Listening parts are required" });
        }

        // Validate each part has at least partNumber
        for (const part of listeningParts) {
            if (!part.partNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Each part must have a partNumber"
                });
            }
        }

        // Find existing or create new by sectionType AND examType
        let content = await FreeAssessmentContent.findOne({ sectionType: "listening", examType: validExamType });

        if (content) {
            content.listeningParts = listeningParts;
            content.isActive = isActive ?? content.isActive;
            // Update section-level audio
            if (listeningAudioUrl !== undefined) content.listeningAudioUrl = listeningAudioUrl;
            if (listeningAudioTitle !== undefined) content.listeningAudioTitle = listeningAudioTitle;
            if (listeningAudioDescription !== undefined) content.listeningAudioDescription = listeningAudioDescription;
        } else {
            content = new FreeAssessmentContent({
                sectionType: "listening",
                examType: validExamType,
                listeningParts,
                isActive: isActive ?? false,
                listeningAudioUrl,
                listeningAudioTitle,
                listeningAudioDescription
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

// Create or update reading content
export const saveReadingContent = async (req: Request, res: Response) => {
    try {
        const {
            readingPassages,
            isActive,
            examType
        } = req.body;

        // Default to "general" if not provided
        const validExamType = examType || "general";
        if (!["general", "academic"].includes(validExamType)) {
            return res.status(400).json({ success: false, message: "Invalid exam type" });
        }

        // Validate passages
        if (!readingPassages || !Array.isArray(readingPassages)) {
            return res.status(400).json({ success: false, message: "Reading passages are required" });
        }

        // Validate each passage has required fields
        for (const passage of readingPassages) {
            if (!passage.passageNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Each passage must have a passageNumber"
                });
            }
            if (!passage.title || !passage.content) {
                return res.status(400).json({
                    success: false,
                    message: "Each passage must have a title and content"
                });
            }
        }

        // Calculate total questions (excluding instructions)
        let totalQuestions = 0;
        readingPassages.forEach((passage: any) => {
            if (passage.questions) {
                totalQuestions += passage.questions.filter((q: any) => q.type !== "instruction").length;
            }
        });

        // Max 40 questions for reading section
        if (totalQuestions > 40) {
            return res.status(400).json({
                success: false,
                message: `Too many questions: ${totalQuestions}. Maximum is 40.`
            });
        }

        // Find existing or create new by sectionType AND examType
        let content = await FreeAssessmentContent.findOne({ sectionType: "reading", examType: validExamType });

        if (content) {
            content.readingPassages = readingPassages;
            content.isActive = isActive ?? content.isActive;
        } else {
            content = new FreeAssessmentContent({
                sectionType: "reading",
                examType: validExamType,
                readingPassages,
                isActive: isActive ?? false
            });
        }

        await content.save();

        res.json({
            success: true,
            message: "Reading content saved successfully",
            data: content
        });
    } catch (error) {
        console.error("Error saving reading content:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create or update writing content
export const saveWritingContent = async (req: Request, res: Response) => {
    try {
        const {
            writingTasks,
            isActive,
            examType
        } = req.body;

        // Default to "general" if not provided
        const validExamType = examType || "general";
        if (!["general", "academic"].includes(validExamType)) {
            return res.status(400).json({ success: false, message: "Invalid exam type" });
        }

        // Validate tasks
        if (!writingTasks || !Array.isArray(writingTasks)) {
            return res.status(400).json({ success: false, message: "Writing tasks are required" });
        }

        // Validate each task has required fields
        for (const task of writingTasks) {
            if (!task.taskNumber || !task.taskType) {
                return res.status(400).json({
                    success: false,
                    message: "Each task must have taskNumber and taskType"
                });
            }
            if (!task.title || !task.prompt) {
                return res.status(400).json({
                    success: false,
                    message: "Each task must have a title and prompt"
                });
            }
            if (!task.timeAllocation || task.timeAllocation <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Each task must have a valid time allocation"
                });
            }
        }

        // Validate total time allocation <= 60 minutes
        const totalTime = writingTasks.reduce((sum: number, task: any) => sum + (task.timeAllocation || 0), 0);
        if (totalTime > 60) {
            return res.status(400).json({
                success: false,
                message: `Total time allocation (${totalTime} minutes) exceeds 60 minutes limit. Please adjust task times.`
            });
        }

        // Find existing or create new by sectionType AND examType
        let content = await FreeAssessmentContent.findOne({ sectionType: "writing", examType: validExamType });

        if (content) {
            content.writingTasks = writingTasks;
            content.isActive = isActive ?? content.isActive;
        } else {
            content = new FreeAssessmentContent({
                sectionType: "writing",
                examType: validExamType,
                writingTasks,
                isActive: isActive ?? false
            });
        }

        await content.save();

        res.json({
            success: true,
            message: "Writing content saved successfully",
            data: content
        });
    } catch (error) {
        console.error("Error saving writing content:", error);
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
        const examType = (req.query.examType as string) || "general";

        const content = await FreeAssessmentContent.findOne({ sectionType: type, examType });

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

// Toggle useGeneralContent for academic sections
export const toggleUseGeneralContent = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        const examType = (req.query.examType as string);

        // Only valid for academic exam type
        if (examType !== "academic") {
            return res.status(400).json({
                success: false,
                message: "This feature is only available for Academic exam type"
            });
        }

        if (!["listening", "reading", "writing"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid section type" });
        }

        // Find existing academic content
        let content = await FreeAssessmentContent.findOne({ sectionType: type, examType: "academic" });

        if (!content) {
            // If no academic content exists, we need to check if there's a document with just sectionType
            // and update it, or inform the user to create content first
            return res.status(404).json({
                success: false,
                message: `Please save Academic ${type} content at least once before enabling this feature. Go to Academic ${type.charAt(0).toUpperCase() + type.slice(1)} page and save.`
            });
        }

        // Toggle the useGeneralContent flag
        content.useGeneralContent = !content.useGeneralContent;
        await content.save();

        res.json({
            success: true,
            message: content.useGeneralContent
                ? "Now using General content for Academic exam"
                : "Now using separate Academic content",
            data: { useGeneralContent: content.useGeneralContent }
        });
    } catch (error) {
        console.error("Error toggling useGeneralContent:", error);
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

// Upload audio file to Cloudinary (with compression for large files)
export const uploadAudio = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No audio file uploaded" });
        }

        let audioBuffer = req.file.buffer;
        const originalSize = audioBuffer.length;

        // Compress large audio files (>5MB) using FFmpeg before upload
        if (originalSize > 5 * 1024 * 1024) {
            console.log(`Large audio file detected (${Math.round(originalSize / 1024 / 1024)}MB), compressing...`);
            try {
                const { compressAudio } = await import("../utils/audioCompressor.js");
                audioBuffer = await compressAudio(audioBuffer);
                console.log(`Compression complete: ${Math.round(originalSize / 1024 / 1024)}MB -> ${Math.round(audioBuffer.length / 1024 / 1024)}MB`);
            } catch (compressError) {
                console.error("Compression failed, trying to upload original:", compressError);
                // Continue with original buffer if compression fails
            }
        }

        // Import Cloudinary utility dynamically to avoid circular deps
        const { uploadAudioToCloudinary } = await import("../utils/cloudinary.js");

        // Upload to Cloudinary
        const result = await uploadAudioToCloudinary(audioBuffer, req.file.originalname);

        res.json({
            success: true,
            message: "Audio uploaded successfully to Cloudinary",
            data: {
                filename: result.public_id,
                audioUrl: result.secure_url, // This is the Cloudinary URL
                originalName: result.original_filename,
                size: result.bytes,
                originalSize: originalSize,
                duration: result.duration,
                format: result.format
            }
        });
    } catch (error) {
        console.error("Error uploading audio:", error);
        res.status(500).json({ success: false, message: "Failed to upload audio to cloud storage" });
    }
};

// Upload image to Cloudinary (for writing task charts/graphs)
export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file uploaded" });
        }

        // Import Cloudinary utility
        const cloudinary = await import("cloudinary");

        // Configure Cloudinary
        cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        // Upload image buffer to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                {
                    folder: "ielts-reading-images",
                    resource_type: "image",
                    quality: "auto:good",
                    fetch_format: "auto"
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload_stream error:", error);
                        reject(error);
                    }
                    else resolve(result);
                }
            );
            uploadStream.end(req.file!.buffer);
        });

        res.json({
            success: true,
            message: "Image uploaded successfully to Cloudinary",
            data: {
                imageUrl: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes
            }
        });
    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ success: false, message: "Failed to upload image to cloud storage" });
    }
};
