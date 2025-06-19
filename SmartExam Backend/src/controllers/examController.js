import { Exam } from '../models/Exam.js';
import { generateMCQs } from "../utils/aiExamGenerator.js";
import shortid from 'shortid';

const generateExam = async (req, res) => {
  try {
    const {
      title,
      subject,
      grade,
      difficulty,
      cognitiveSkill,
      questionCount,
      marksPerQuestion
    } = req.body;

    const questions = await generateMCQs({
      subject,
      grade,
      difficulty,
      cognitiveSkill,
      questionCount,
      marksPerQuestion
    });

    const code = shortid.generate().toUpperCase();

    const exam = await Exam.create({
      title,
      subject,
      grade,
      difficulty,
      cognitiveSkill,
      questionCount,
      marksPerQuestion,
      code,
      createdBy: req.user?._id,
      questions
    });

    res.status(201).json({
      message: 'Exam generated successfully',
      examCode: exam.code,
      totalQuestions: exam.questions.length,
      exam
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate exam' });
  }
};

const getExamByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const exam = await Exam.findOne({ code }).select('-questions.correctIndex'); // Hide correct answers

    console.log("Exam: ", exam);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found with this code' });
    }

    res.status(200).json({
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      questionCount: exam.questionCount,
      marksPerQuestion: exam.marksPerQuestion,
      questions: exam.questions.map((q, idx) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
};

const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      count: exams.length,
      exams: exams.map((exam) => ({
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        grade: exam.grade,
        code: exam.code,
        questionCount: exam.questionCount,
        marksPerQuestion: exam.marksPerQuestion,
        createdAt: exam.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Ensure only the creator (teacher) can delete the exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this exam" });
    }

    await exam.deleteOne();

    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete exam" });
  }
};

const getExamDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to view this exam" });
    }

    res.status(200).json({
      _id: exam._id,
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      code: exam.code,
      questionCount: exam.questionCount,
      marksPerQuestion: exam.marksPerQuestion,
      createdAt: exam.createdAt,
      questions: exam.questions.map((q) => ({
        _id: q._id,
        text: q.questionText,
        options: q.options,
        correctAnswer: q.correctIndex
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch exam details" });
  }
};

export {
  generateExam,
  getExamByCode,
  getAllExams,
  deleteExam,
  getExamDetails
}
