import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini SDK with telemetry header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  // API endpoint for AI Coach
  app.post("/api/coach", async (req, res) => {
    try {
      const { profile, scores, roadmap, message, chatHistory } = req.body;

      // Construct a very rich system prompt providing context
      const systemInstruction = `You are a highly skilled, supportive AI Career & Technology Coach named Skill Mirror AI Coach.
Your goal is to guide students on their learning journey based on their profile, skill assessment scores, and career goals.

Context:
User Profile:
- Name: ${profile?.name || "N/A"}
- College: ${profile?.college || "N/A"}
- Branch: ${profile?.branch || "N/A"}
- Academic Year: ${profile?.year || "N/A"}
- Career Goal: ${profile?.careerGoal || "N/A"}

Assessment Scores (out of 100):
- Python: ${scores?.pythonScore ?? "Not taken yet"}
- Java: ${scores?.javaScore ?? "Not taken yet"}
- DSA: ${scores?.dsaScore ?? "Not taken yet"}
- Aptitude: ${scores?.aptitudeScore ?? "Not taken yet"}

Roadmap Status:
- Career Goal Associated Roadmap: ${roadmap?.careerGoal || profile?.careerGoal || "N/A"}
- Completion Progress: ${roadmap?.progress ?? 0}%

Provide conversational, encouraging, and highly specific professional advice.
Give concrete suggestions on:
- What technical skills to focus on next.
- Projects to build that match their domain and level.
- Resources or problem-solving approaches to improve their weaker areas.
Keep your answer clear, markdown-formatted, and direct. Keep your suggestions highly customized so that it reflects their scores and achievements. Use an encouraging tone.`;

      // Structure contents for multi-turn chat if history exists
      const contents: any[] = [];
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const turn of chatHistory) {
          contents.push({
            role: turn.role, // 'user' or 'model'
            parts: [{ text: turn.text }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error?.message || "An error occurred with the AI Coach." });
    }
  });

  // API endpoint for generating quiz questions
  app.post("/api/quiz-questions", async (req, res) => {
    try {
      const { subject } = req.body;
      const validSubjects = ["python", "java", "dsa", "aptitude"];
      if (!subject || !validSubjects.includes(subject)) {
        return res.status(400).json({ error: "Invalid subject specified." });
      }

      const prompt = `Generate exactly 5 high-quality, professional multiple-choice questions (MCQs) for a quiz on the subject: "${subject}".
Each question must be clear, standard, and highly relevant.
Each question must follow this exact TypeScript interface structure:
{
  "id": number, // unique positive integer, e.g. 1000 + index
  "text": string, // the question text
  "options": string[], // exactly 4 choices
  "correctIndex": number, // 0-based index of the correct option (0, 1, 2, or 3)
  "explanation": string // a detailed explanation of why the correct option is right
}

Make sure to vary the questions every time! Avoid repeating basic or trivial questions.
Return ONLY a valid JSON array containing exactly 5 question objects. No markdown formatting, no backticks, no comments, and no extra text outside the JSON array. Start with [ and end with ].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.95,
        }
      });

      const responseText = response.text || "";
      const questions = JSON.parse(responseText.trim());
      if (Array.isArray(questions) && questions.length > 0) {
        res.json({ questions });
      } else {
        throw new Error("Invalid response format from Gemini model");
      }
    } catch (error: any) {
      console.error("Gemini Question Generation Error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate questions using Gemini API." });
    }
  });

  // Serve static files in production, use Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
