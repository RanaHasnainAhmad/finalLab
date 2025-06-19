import { Router } from "express";
import { isStudent, isTeacher, verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteExam, generateExam, getAllExams, getExamByCode, getExamDetails } from "../controllers/examController.js"

const router = Router();

router.route("/generate-exam")
    .post(
        verifyJWT,
        isTeacher,
        generateExam
    );

router.route("/get-exam/:code")
    .get(
        verifyJWT,
        isStudent,
        getExamByCode
    );

router.route("/delete-exam/:id")
    .delete(
        verifyJWT,
        isTeacher,
        deleteExam
    );

router.route('/get-exams/:id')
  .get(verifyJWT, isTeacher, getExamDetails);

router.route("/all-exams")
    .get(
        verifyJWT,
        isTeacher,
        getAllExams
    );

export default router