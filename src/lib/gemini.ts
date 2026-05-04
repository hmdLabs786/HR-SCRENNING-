import { GoogleGenAI, Type } from "@google/genai";
import { ScreeningResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function screenCandidate(resumeText: string, jobDescription: string): Promise<ScreeningResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this resume against the following job description and provide a structured screening result.
    
    Job Description:
    ${jobDescription}
    
    Resume Text:
    ${resumeText}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: {
            type: Type.NUMBER,
            description: "A score from 0 to 100 based on how well the candidate matches the job.",
          },
          reasoning: {
            type: Type.STRING,
            description: "A brief explanation of why this score was given.",
          },
          skillsMatch: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of skills found in the resume that match the job requirements.",
          },
          missingSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of key skills required by the job but missing or weak in the resume.",
          },
        },
        required: ["score", "reasoning", "skillsMatch", "missingSkills"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI model");
  }
}
