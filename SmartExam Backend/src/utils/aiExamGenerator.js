import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateMCQs = async ({
  subject,
  grade,
  difficulty,
  cognitiveSkill,
  questionCount,
  marksPerQuestion
}) => {
  const prompt = `
Generate ${questionCount} MCQs for the subject "${subject}" for Grade ${grade} students.
Difficulty: ${difficulty}
Cognitive Skill: ${cognitiveSkill}
Each question should have 4 options and only one correct answer.
Respond ONLY with JSON in the following format:

[
  {
    "questionText": "What is the function of chlorophyll?",
    "options": ["Helps in respiration", "Helps in digestion", "Helps in photosynthesis", "None of the above"],
    "correctIndex": 2,
    "marks": ${marksPerQuestion}
  }
]
`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = await response.text();

  // ✅ Extract first and last brackets to isolate array
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]") + 1;

  const jsonText = text.slice(jsonStart, jsonEnd);

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("❌ Failed to parse AI response:", text);
    throw new Error("AI response is not valid JSON.");
  }
};

export { generateMCQs };
