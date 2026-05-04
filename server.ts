import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import "dotenv/config";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Use the GROQ_API_KEY from environment variables
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is not set. API routes will fail.");
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY || "",
  });

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    console.log("Received analysis request");
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      console.error("Missing resumeText or jobDescription");
      return res.status(400).json({ error: "Resume text and job description are required" });
    }

    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing in environment");
      return res.status(500).json({ error: "API key configuration missing on server" });
    }

    try {
      console.log("Calling Groq API...");
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert HR assistant. Analyze resumes against job descriptions and return a JSON object with: score (0-100), reasoning (string), skillsMatch (array of strings), and missingSkills (array of strings). Only return the JSON object."
          },
          {
            role: "user",
            content: `Job Description:
${jobDescription}

Resume Text:
${resumeText}`
          }
        ],
        model: "llama3-70b-8192",
        response_format: { type: "json_object" },
      });

      console.log("Groq API response received");
      let content = completion.choices[0]?.message?.content || "{}";
      
      // Clean markdown if present
      if (content.includes("```")) {
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();
      }
      
      let result = JSON.parse(content);
      
      // Post-process to ensure types match Firestore rules
      if (result.score !== undefined) {
        result.score = Number(result.score);
      } else {
        result.score = 0;
      }
      
      if (!result.reasoning) result.reasoning = "Analytical summary not provided by model.";
      if (!result.skillsMatch) result.skillsMatch = [];
      if (!result.missingSkills) result.missingSkills = [];
      
      res.json(result);
    } catch (error: any) {
      console.error("Groq API error details:", error);
      res.status(500).json({ 
        error: "Failed to analyze resume with Groq", 
        details: error.message 
      });
    }
  });

  // Vite middleware for development
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
