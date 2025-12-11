const express = require('express');
const router = express.Router();
const {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  togglePublish
} = require('../controllers/assessmentController');

// Optional: Import auth middleware if you have it
// const { protect, admin } = require('../middleware/auth');

// @route   POST /api/assessments/create
// @desc    Create new assessment
// @access  Private (Admin)
router.post('/create', createAssessment);

// @route   GET /api/assessments
// @desc    Get all assessments with pagination
// @access  Private (Admin)
router.get('/', getAssessments);

// @route   GET /api/assessments/:id
// @desc    Get single assessment
// @access  Private
router.get('/:id', getAssessmentById);

// @route   PUT /api/assessments/:id
// @desc    Update assessment
// @access  Private (Admin)
router.put('/:id', updateAssessment);

// @route   DELETE /api/assessments/:id
// @desc    Delete assessment
// @access  Private (Admin)
router.delete('/:id', deleteAssessment);

// @route   PATCH /api/assessments/:id/publish
// @desc    Toggle publish status
// @access  Private (Admin)
router.patch('/:id/publish', togglePublish);

module.exports = router;
