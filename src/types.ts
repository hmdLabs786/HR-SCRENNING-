export interface Candidate {
  id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'SCREENED' | 'SHORTLISTED' | 'REJECTED' | 'INTERVIEW_SCHEDULED';
  score?: number;
  matchReasoning?: string;
  skills: string[];
  resumeText: string;
  appliedDate: string;
  interviewDate?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  requirements: string[];
  description: string;
}

export interface ScreeningResult {
  score: number;
  reasoning: string;
  skillsMatch: string[];
  missingSkills: string[];
}
