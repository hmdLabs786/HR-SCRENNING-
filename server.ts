import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
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
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Resume text and job description are required" });
    }

    try {
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

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("Groq API error:", error);
      res.status(500).json({ error: "Failed to analyze resume with Groq" });
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
