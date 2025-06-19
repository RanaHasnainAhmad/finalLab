import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: String,
  selectedIndex: Number
});

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  answers: [answerSchema],
  score: Number
});

export const Submission = mongoose.model('Submission', submissionSchema);
