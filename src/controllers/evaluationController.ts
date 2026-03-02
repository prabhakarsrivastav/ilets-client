import { Request, Response } from "express";
import FreeAssessment from "../models/FreeAssessment.js";
import FreeAssessmentContent from "../models/FreeAssessmentContent.js";

// Get assessment details for evaluation
export const getAssessmentForEvaluation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const assessment = await FreeAssessment.findById(id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        // Try to find active content that actually has questions
        let listeningContents = await FreeAssessmentContent.find({ sectionType: "listening", isActive: true });
        let listeningContent = listeningContents.find(c => c.listeningParts?.some(p => p.questions?.length > 0));

        if (!listeningContent) {
            // Fallback: Find ANY content that has questions, sorted by latest
            const allContent = await FreeAssessmentContent.find({ sectionType: "listening" }).sort({ createdAt: -1 });
            listeningContent = allContent.find(c => c.listeningParts?.some(p => p.questions?.length > 0));
        }

        // Same for Reading
        let readingContents = await FreeAssessmentContent.find({ sectionType: "reading", isActive: true });
        let readingContent = readingContents.find(c => c.readingPassages?.some(p => p.questions?.length > 0));

        if (!readingContent) {
            const allContent = await FreeAssessmentContent.find({ sectionType: "reading" }).sort({ createdAt: -1 });
            readingContent = allContent.find(c => c.readingPassages?.some(p => p.questions?.length > 0));
        }

        // Same for Writing
        let writingContents = await FreeAssessmentContent.find({ sectionType: "writing", isActive: true });
        let writingContent = writingContents.find(c => (c.writingTasks?.length || 0) > 0);

        if (!writingContent) {
            const allContent = await FreeAssessmentContent.find({ sectionType: "writing" }).sort({ createdAt: -1 });
            writingContent = allContent.find(c => (c.writingTasks?.length || 0) > 0);
        }

        console.log("Evaluation Debug - Content selected:", {
            listeningId: listeningContent?._id,
            listeningQuestions: listeningContent?.listeningParts?.reduce((acc, p) => acc + (p.questions?.length || 0), 0) || 0,
            readingId: readingContent?._id,
            writingId: writingContent?._id,
        });

        console.log("Evaluation Debug - User answers:", {
            listeningAnswers: assessment.listeningAnswers,
            readingAnswers: assessment.readingAnswers,
            writingAnswers: assessment.writingAnswers,
        });

        // Build question details with answers
        const listeningQuestions: any[] = [];
        const readingQuestions: any[] = [];

        // Extract listening questions - use display number 1-40 but answer key lis_pX_qY
        let globalListeningIndex = 1;
        if (listeningContent?.listeningParts) {
            // Sort parts by partNumber to ensure correct order
            const sortedParts = [...listeningContent.listeningParts].sort((a, b) => a.partNumber - b.partNumber);

            for (const part of sortedParts) {
                const partNumber = part.partNumber;
                let questionIndex = 1; // Internal index for key generation

                // Sort questions if they have numbers, otherwise trust array order
                const questions = part.questions || [];

                for (const q of questions) {
                    if (q.type !== "instruction") {
                        const answerKey = `lis_p${partNumber}_q${questionIndex}`;
                        listeningQuestions.push({
                            questionNumber: globalListeningIndex, // Continuous 1-40
                            originalNumber: q.questionNumber,
                            answerKey,
                            questionText: q.questionText,
                            type: q.type,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            autoMark: q.autoMark !== false,
                            userAnswer: assessment.listeningAnswers?.[answerKey] || "",
                            partNumber,
                        });
                        questionIndex++;
                        globalListeningIndex++;
                    }
                }
            }
        }

        // Extract reading questions - use the answer key format: read_p{passageNumber}_q{questionNumber}
        if (readingContent?.readingPassages) {
            for (const passage of readingContent.readingPassages) {
                const passageNumber = passage.passageNumber;
                for (const q of passage.questions || []) {
                    if (q.type !== "instruction") {
                        const answerKey = `read_p${passageNumber}_q${q.questionNumber}`;
                        readingQuestions.push({
                            questionNumber: q.questionNumber,
                            answerKey,
                            questionText: q.questionText,
                            type: q.type,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            autoMark: q.autoMark !== false,
                            userAnswer: assessment.readingAnswers?.[answerKey] || "",
                            passageTitle: passage.title,
                            passageNumber,
                        });
                    }
                }
            }
        }

        // Writing tasks - keys are just '1' and '2'
        const writingTasks = writingContent?.writingTasks?.map(task => ({
            taskNumber: task.taskNumber,
            taskType: task.taskType,
            title: task.title,
            prompt: task.prompt,
            minWords: task.minWords,
            userAnswer: assessment.writingAnswers?.[task.taskNumber.toString()] || "",
        })) || [];

        console.log("Evaluation Debug - Questions extracted:", {
            listeningQuestions: listeningQuestions.length,
            readingQuestions: readingQuestions.length,
            writingTasks: writingTasks.length,
        });

        res.json({
            success: true,
            data: {
                assessment: {
                    _id: assessment._id,
                    personalInfo: assessment.personalInfo,
                    status: assessment.status,
                    progress: assessment.progress,
                    evaluation: assessment.evaluation,
                    createdAt: (assessment as any).createdAt,
                    listeningAnswers: assessment.listeningAnswers,
                    readingAnswers: assessment.readingAnswers,
                    writingAnswers: assessment.writingAnswers,
                },
                listeningQuestions,
                readingQuestions,
                writingTasks,
            },
        });
    } catch (error: any) {
        console.error("Error fetching assessment for evaluation:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Calculate auto-grades for an assessment
export const calculateAutoGrades = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const assessment = await FreeAssessment.findById(id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        // Get the content with correct answers - fallback to any active/valid content

        // Listening
        let listeningContents = await FreeAssessmentContent.find({ sectionType: "listening", isActive: true });
        let listeningContent = listeningContents.find(c => c.listeningParts?.some(p => p.questions?.length > 0));

        if (!listeningContent) {
            const allContent = await FreeAssessmentContent.find({ sectionType: "listening" }).sort({ createdAt: -1 });
            listeningContent = allContent.find(c => c.listeningParts?.some(p => p.questions?.length > 0));
        }

        // Reading
        let readingContents = await FreeAssessmentContent.find({ sectionType: "reading", isActive: true });
        let readingContent = readingContents.find(c => c.readingPassages?.some(p => p.questions?.length > 0));

        if (!readingContent) {
            const allContent = await FreeAssessmentContent.find({ sectionType: "reading" }).sort({ createdAt: -1 });
            readingContent = allContent.find(c => c.readingPassages?.some(p => p.questions?.length > 0));
        }

        // Calculate listening score - use key format: lis_p{partNumber}_q{questionIndex}
        let listeningCorrect = 0;
        let listeningTotal = 0;
        const listeningDetails: Record<string, any> = {};

        if (listeningContent?.listeningParts) {
            // Sort parts to match evaluation display order
            const sortedParts = [...listeningContent.listeningParts].sort((a, b) => a.partNumber - b.partNumber);

            for (const part of sortedParts) {
                const partNumber = part.partNumber;
                let questionIndex = 1;
                for (const q of part.questions || []) {
                    if (q.type !== "instruction" && q.autoMark !== false) {
                        listeningTotal++;
                        const answerKey = `lis_p${partNumber}_q${questionIndex}`;
                        const userAnswer = (assessment.listeningAnswers?.[answerKey] || "").trim().toLowerCase();
                        const correctAnswer = (q.correctAnswer || "").trim().toLowerCase();

                        // Handle multiple correct answers (comma-separated)
                        const correctAnswers = correctAnswer.split(",").map(a => a.trim());
                        const isCorrect = correctAnswers.includes(userAnswer) || userAnswer === correctAnswer;

                        if (isCorrect) listeningCorrect++;

                        listeningDetails[answerKey] = {
                            userAnswer: assessment.listeningAnswers?.[answerKey] || "",
                            correctAnswer: q.correctAnswer,
                            isCorrect,
                            overridden: false,
                        };
                        questionIndex++;
                    }
                }
            }
        }

        // Calculate reading score - use key format: read_p{passageNumber}_q{questionNumber}
        let readingCorrect = 0;
        let readingTotal = 0;
        const readingDetails: Record<string, any> = {};

        if (readingContent?.readingPassages) {
            for (const passage of readingContent.readingPassages) {
                const passageNumber = passage.passageNumber;
                for (const q of passage.questions || []) {
                    if (q.type !== "instruction" && q.autoMark !== false) {
                        readingTotal++;
                        const answerKey = `read_p${passageNumber}_q${q.questionNumber}`;
                        const userAnswer = (assessment.readingAnswers?.[answerKey] || "").trim().toLowerCase();
                        const correctAnswer = (q.correctAnswer || "").trim().toLowerCase();

                        // Handle multiple correct answers (comma-separated)
                        const correctAnswers = correctAnswer.split(",").map(a => a.trim());
                        const isCorrect = correctAnswers.includes(userAnswer) || userAnswer === correctAnswer;

                        if (isCorrect) readingCorrect++;

                        readingDetails[answerKey] = {
                            userAnswer: assessment.readingAnswers?.[answerKey] || "",
                            correctAnswer: q.correctAnswer,
                            isCorrect,
                            overridden: false,
                        };
                    }
                }
            }
        }

        // Calculate band scores (simplified IELTS conversion)
        const listeningBand = calculateBandScore(listeningCorrect, listeningTotal);
        const readingBand = calculateBandScore(readingCorrect, readingTotal);

        let totalScore = 0;
        let sectionsCount = 0;
        if (listeningBand > 0) { totalScore += listeningBand; sectionsCount++; }
        if (readingBand > 0) { totalScore += readingBand; sectionsCount++; }
        const calculatedOverall = sectionsCount > 0 ? Math.round((totalScore / sectionsCount) * 2) / 2 : null;

        // Update evaluation
        assessment.evaluation = {
            listeningScore: {
                auto: listeningBand,
                manual: null,
                totalQuestions: listeningTotal,
                correctAnswers: listeningCorrect,
            },
            readingScore: {
                auto: readingBand,
                manual: null,
                totalQuestions: readingTotal,
                correctAnswers: readingCorrect,
            },
            writingScore: {
                task1: null,
                task2: null,
                overall: null,
            },
            overallBand: calculatedOverall,
            evaluatedBy: null,
            evaluatedAt: new Date(),
            notes: "",
            answerDetails: {
                listening: listeningDetails,
                reading: readingDetails,
            },
        };

        await assessment.save();

        res.json({
            success: true,
            message: "Auto-grades calculated successfully",
            data: assessment.evaluation,
        });
    } catch (error: any) {
        console.error("Error calculating auto-grades:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Save evaluation (with manual overrides)
export const saveEvaluation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { evaluation } = req.body;

        const assessment = await FreeAssessment.findById(id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: "Assessment not found" });
        }

        // Merge with existing evaluation or create new
        assessment.evaluation = {
            ...assessment.evaluation,
            ...evaluation,
            evaluatedAt: new Date(),
        };

        // Calculate overall band if sections are scored
        const listening = evaluation.listeningScore?.manual ?? evaluation.listeningScore?.auto ?? 0;
        const reading = evaluation.readingScore?.manual ?? evaluation.readingScore?.auto ?? 0;
        const writing = evaluation.writingScore?.overall ?? 0;

        let totalScore = 0;
        let sectionsCount = 0;
        if (listening > 0) { totalScore += listening; sectionsCount++; }
        if (reading > 0) { totalScore += reading; sectionsCount++; }
        if (writing > 0) { totalScore += writing; sectionsCount++; }

        if (assessment.evaluation && sectionsCount > 0) {
            // Simple average of available sections
            assessment.evaluation.overallBand = Math.round((totalScore / sectionsCount) * 2) / 2;
        }

        await assessment.save();

        res.json({
            success: true,
            message: "Evaluation saved successfully",
            data: assessment.evaluation,
        });
    } catch (error: any) {
        console.error("Error saving evaluation:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Helper function to convert raw score to band score
function calculateBandScore(correct: number, total: number): number {
    if (total === 0) return 0;

    const percentage = (correct / total) * 100;

    // Simplified IELTS band conversion
    if (percentage >= 97) return 9;
    if (percentage >= 90) return 8.5;
    if (percentage >= 82) return 8;
    if (percentage >= 75) return 7.5;
    if (percentage >= 67) return 7;
    if (percentage >= 60) return 6.5;
    if (percentage >= 52) return 6;
    if (percentage >= 45) return 5.5;
    if (percentage >= 37) return 5;
    if (percentage >= 30) return 4.5;
    if (percentage >= 22) return 4;
    if (percentage >= 15) return 3.5;
    if (percentage >= 7) return 3;
    return 2.5;
}
