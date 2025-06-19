import { Exam } from '../models/Exam.js';
import { Submission } from '../models/Submission.js';

const submitExam = async (req, res) => {
  try {
    const { code } = req.params;
    const { answers } = req.body;

    const exam = await Exam.findOne({ code });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    let score = 0;

    // Calculate score
    exam.questions.forEach((question) => {
      const submitted = answers.find(a => a.questionId === question._id.toString());
      if (submitted && submitted.selectedIndex === question.correctIndex) {
        score += question.marks;
      }
    });

    const submission = await Submission.create({
      student: req.user?._id || null,
      exam: exam._id,
      answers,
      score
    });
    
    console.log("Submission: ", submission);
    

    res.status(200).json({
      message: 'Submission successful',
      totalMarks: exam.questions.length * exam.marksPerQuestion,
      obtainedMarks: score,
      submission
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
};

const getSubmittedExamResult = async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Fetch the submission with student and exam populated
    const submission = await Submission.findById(submissionId)
      .populate("student", "fullname email")
      .populate("exam")
      .lean();

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Make sure the logged-in student owns this submission
    if (submission.student?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const resultDetails = {
      examTitle: submission.exam.title,
      subject: submission.exam.subject,
      grade: submission.exam.grade,
      studentName: submission.student.fullname,
      studentEmail: submission.student.email,
      totalMarks: submission.exam.questions.length * submission.exam.marksPerQuestion,
      obtainedMarks: submission.score,
      date: new Date(submission.createdAt).toLocaleString(),
      answers: submission.answers.map((answer) => {
        const question = submission.exam.questions.find(
          (q) => q._id.toString() === answer.questionId
        );

        return {
          questionText: question?.questionText,
          options: question?.options,
          correctIndex: question?.correctIndex,
          selectedIndex: answer.selectedIndex,
          marks: question?.marks,
          isCorrect: answer.selectedIndex === question?.correctIndex
        };
      })
    };

    res.status(200).json({ result: resultDetails });
  } catch (error) {
    console.error("Error fetching printable result:", error);
    res.status(500).json({ error: "Failed to fetch result" });
  }
};


const getExamSubmissions = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const submissions = await Submission.find({ exam: examId })
      .populate("student", "fullname email")
      .lean();

    const totalPossibleScore = exam.questions.length * exam.marksPerQuestion;
    const totalStudents = submissions.length;

    const submissionDetails = submissions.map((submission) => ({
      studentId: submission.student?._id,
      studentName: submission.student?.fullname || "Anonymous",
      email: submission.student?.email || "N/A",
      score: submission.score,
      totalScore: totalPossibleScore,
      answers: submission.answers
    }));

    res.status(200).json({
      exam: {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        grade: exam.grade,
        totalScore: totalPossibleScore,
        totalStudents
      },
      submissions: submissionDetails
    });
  } catch (err) {
    console.error("Error in getExamSubmissions:", err);
    res.status(500).json({ error: "Failed to retrieve exam submissions" });
  }
};

export {
  submitExam,
  getSubmittedExamResult,
  getExamSubmissions
};