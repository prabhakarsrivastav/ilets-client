import { Request, Response } from "express";
import FreeAssessment from "../models/FreeAssessment.js";

// Create new assessment session
export const createFreeAssessment = async (req: Request, res: Response) => {
    try {
        const { personalInfo } = req.body;

        const assessment = new FreeAssessment({
            personalInfo,
            progress: {
                currentStep: 2, // Moving to Listening after Personal Info
                completedSections: ["personal-info"],
                startedAt: new Date(),
                lastUpdatedAt: new Date(),
            },
            status: "in-progress",
        });

        await assessment.save();

        res.status(201).json({
            success: true,
            data: {
                id: assessment._id,
                personalInfo: assessment.personalInfo,
                progress: assessment.progress,
            },
        });
    } catch (error) {
        console.error("Error creating assessment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update assessment progress
export const updateAssessmentProgress = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { currentStep, completedSection, answers, booking } = req.body;

        const assessment = await FreeAssessment.findById(id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        // Update progress
        assessment.progress.currentStep = currentStep;
        assessment.progress.lastUpdatedAt = new Date();

        if (completedSection && !assessment.progress.completedSections.includes(completedSection)) {
            assessment.progress.completedSections.push(completedSection);
        }

        // Update answers based on section
        if (answers) {
            if (completedSection === "listening") {
                assessment.listeningAnswers = answers;
            } else if (completedSection === "reading") {
                assessment.readingAnswers = answers;
            } else if (completedSection === "writing") {
                assessment.writingAnswers = answers;
            }
        }

        // Update booking if provided
        if (booking) {
            assessment.booking = booking;
            assessment.status = "completed";
            assessment.progress.completedSections.push("booking");
        }

        await assessment.save();

        res.json({
            success: true,
            data: {
                id: assessment._id,
                progress: assessment.progress,
                status: assessment.status,
            },
        });
    } catch (error) {
        console.error("Error updating assessment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all assessments (Admin)
export const getAllFreeAssessments = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;

        const query: any = {};
        if (status && status !== "all") {
            query.status = status;
        }

        const total = await FreeAssessment.countDocuments(query);
        const assessments = await FreeAssessment.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("personalInfo progress status createdAt updatedAt");

        res.json({
            success: true,
            data: assessments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching assessments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get single assessment details (Admin)
export const getFreeAssessmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const assessment = await FreeAssessment.findById(id);

        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        res.json({ success: true, data: assessment });
    } catch (error) {
        console.error("Error fetching assessment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get assessment stats (Admin Dashboard)
export const getAssessmentStats = async (_req: Request, res: Response) => {
    try {
        const total = await FreeAssessment.countDocuments();
        const completed = await FreeAssessment.countDocuments({ status: "completed" });
        const inProgress = await FreeAssessment.countDocuments({ status: "in-progress" });

        // Recent 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = await FreeAssessment.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
        });

        res.json({
            success: true,
            data: {
                total,
                completed,
                inProgress,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                recentCount,
            },
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
