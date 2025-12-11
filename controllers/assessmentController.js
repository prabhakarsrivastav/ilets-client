const Assessment = require('../models/Assessment');

/**
 * @desc    Create a new IELTS Listening Assessment
 * @route   POST /api/assessments/create
 * @access  Private (Admin)
 */
const createAssessment = async (req, res) => {
  try {
    const { title, audioUrl, difficulty, sections } = req.body;

    // Validate required fields
    if (!title || !audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Title and audio URL are required'
      });
    }

    // Validate exactly 4 sections
    if (!sections || !Array.isArray(sections) || sections.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'Assessment must have exactly 4 sections'
      });
    }

    // Validate section numbers are 1, 2, 3, 4
    const sectionNumbers = sections.map(s => s.sectionNumber).sort((a, b) => a - b);
    if (JSON.stringify(sectionNumbers) !== JSON.stringify([1, 2, 3, 4])) {
      return res.status(400).json({
        success: false,
        error: 'Sections must be numbered 1 through 4'
      });
    }

    // Validate question numbers are unique and within range
    const allQuestionNumbers = [];
    sections.forEach(section => {
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
      return res.status(400).json({
        success: false,
        error: 'Duplicate question numbers found'
      });
    }

    // Check all numbers are between 1-40
    const invalidNumbers = allQuestionNumbers.filter(n => n < 1 || n > 40);
    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Question numbers must be between 1 and 40'
      });
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

  } catch (error) {
    console.error('Create Assessment Error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
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
const getAssessments = async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, isPublished } = req.query;

    const query = {};
    if (difficulty) query.difficulty = difficulty;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const assessments = await Assessment.find(query)
      .select('title difficulty totalQuestions isPublished createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Assessment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
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
const updateAssessment = async (req, res) => {
  try {
    const { title, audioUrl, difficulty, sections, isPublished } = req.body;

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
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
const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
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
const togglePublish = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
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

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  togglePublish
};
