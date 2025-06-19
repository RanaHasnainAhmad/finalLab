import { Router } from 'express';
import { getExamSubmissions, getSubmittedExamResult, submitExam } from '../controllers/submissionController.js';
import { isStudent, isTeacher, verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/submit-exam/:code')
    .post(
        verifyJWT,
        isStudent,
        submitExam
    );

router.route('/:examId/submissions')
    .get(
        verifyJWT,
        isTeacher,
        getExamSubmissions
    )

router.route('/results/:submissionId')
    .get(
        verifyJWT,
        isStudent,
        getSubmittedExamResult
    )

export default router
