import { ScreeningResult } from "../types";

export async function screenCandidate(resumeText: string, jobDescription: string): Promise<ScreeningResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resumeText, jobDescription }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to analyze resume");
  }

  return response.json();
}
