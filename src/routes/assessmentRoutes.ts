import express from 'express';
import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  togglePublish
} from '../controllers/assessmentController.js';

const router = express.Router();

// POST /api/assessments/create - Create new assessment
router.post('/create', createAssessment);

// GET /api/assessments - Get all assessments
router.get('/', getAssessments);

// GET /api/assessments/:id - Get single assessment
router.get('/:id', getAssessmentById);

// PUT /api/assessments/:id - Update assessment
router.put('/:id', updateAssessment);

// DELETE /api/assessments/:id - Delete assessment
router.delete('/:id', deleteAssessment);

// PATCH /api/assessments/:id/publish - Toggle publish status
router.patch('/:id/publish', togglePublish);

export default router;
