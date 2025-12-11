import { Request, Response } from 'express';
import Assessment, { ISection } from '../models/Assessment.js';

interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * @desc    Create a new IELTS Listening Assessment
 * @route   POST /api/assessments/create
 * @access  Private (Admin)
 */
export const createAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, audioUrl, difficulty, sections } = req.body;

    // Validate required fields
    if (!title || !audioUrl) {
      res.status(400).json({
        success: false,
        error: 'Title and audio URL are required'
      });
      return;
    }

    // Validate exactly 4 sections
    if (!sections || !Array.isArray(sections) || sections.length !== 4) {
      res.status(400).json({
        success: false,
        error: 'Assessment must have exactly 4 sections'
      });
      return;
    }

    // Validate section numbers are 1, 2, 3, 4
    const sectionNumbers = sections.map((s: ISection) => s.sectionNumber).sort((a, b) => a - b);
    if (JSON.stringify(sectionNumbers) !== JSON.stringify([1, 2, 3, 4])) {
      res.status(400).json({
        success: false,
        error: 'Sections must be numbered 1 through 4'
      });
      return;
    }

    // Validate question numbers are unique and within range
    const allQuestionNumbers: number[] = [];
    sections.forEach((section: ISection) => {
      if (section.questionSets) {
        section.questionSets.forEach(set => {
          if (set.questions) {
            set.questions.forEach(q => {
              allQuestionNumbers.push(q.number);
            });
          }
        });
      }
    });

    // Check for duplicates
    const uniqueNumbers = [...new Set(allQuestionNumbers)];
    if (uniqueNumbers.length !== allQuestionNumbers.length) {
      res.status(400).json({
        success: false,
        error: 'Duplicate question numbers found'
      });
      return;
    }

    // Check all numbers are between 1-40
    const invalidNumbers = allQuestionNumbers.filter(n => n < 1 || n > 40);
    if (invalidNumbers.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Question numbers must be between 1 and 40'
      });
      return;
    }

    // Create assessment
    const assessment = new Assessment({
      title,
      audioUrl,
      difficulty: difficulty || 'Medium',
      sections,
      totalQuestions: allQuestionNumbers.length,
      createdBy: req.user?.id || null
    });

    await assessment.save();

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });

  } catch (error: any) {
    console.error('Create Assessment Error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating assessment'
    });
  }
};

/**
 * @desc    Get all assessments
 * @route   GET /api/assessments
 * @access  Private (Admin)
 */
export const getAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, difficulty, isPublished } = req.query;

    const query: any = {};
    if (difficulty) query.difficulty = difficulty;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const assessments = await Assessment.find(query)
      .select('title difficulty totalQuestions isPublished createdAt')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Assessment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assessments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get Assessments Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching assessments'
    });
  }
};

/**
 * @desc    Get single assessment by ID
 * @route   GET /api/assessments/:id
 * @access  Private
 */
export const getAssessmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: assessment
    });

  } catch (error) {
    console.error('Get Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching assessment'
    });
  }
};

/**
 * @desc    Update assessment
 * @route   PUT /api/assessments/:id
 * @access  Private (Admin)
 */
export const updateAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, audioUrl, difficulty, sections, isPublished } = req.body;

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
      return;
    }

    // Update fields
    if (title) assessment.title = title;
    if (audioUrl) assessment.audioUrl = audioUrl;
    if (difficulty) assessment.difficulty = difficulty;
    if (sections) assessment.sections = sections;
    if (isPublished !== undefined) assessment.isPublished = isPublished;

    await assessment.save();

    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment
    });

  } catch (error) {
    console.error('Update Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating assessment'
    });
  }
};

/**
 * @desc    Delete assessment
 * @route   DELETE /api/assessments/:id
 * @access  Private (Admin)
 */
export const deleteAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);

    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });

  } catch (error) {
    console.error('Delete Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting assessment'
    });
  }
};

/**
 * @desc    Publish/Unpublish assessment
 * @route   PATCH /api/assessments/:id/publish
 * @access  Private (Admin)
 */
export const togglePublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
      return;
    }

    assessment.isPublished = !assessment.isPublished;
    await assessment.save();

    res.status(200).json({
      success: true,
      message: `Assessment ${assessment.isPublished ? 'published' : 'unpublished'} successfully`,
      data: { isPublished: assessment.isPublished }
    });

  } catch (error) {
    console.error('Toggle Publish Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating publish status'
    });
  }
};
