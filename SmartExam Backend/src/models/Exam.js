import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctIndex: Number,
  marks: Number
});

const examSchema = new mongoose.Schema({
  title: String,
  subject: String,
  grade: String,
  difficulty: String,
  cognitiveSkill: String,
  questionCount: Number,
  marksPerQuestion: Number,
  code: { type: String, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questions: [questionSchema]
});

export const Exam = mongoose.model('Exam', examSchema);
