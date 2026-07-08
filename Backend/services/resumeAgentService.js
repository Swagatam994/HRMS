import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { env } from '../config/env.js';

const normalizeTokens = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const buildTokenSet = (text = '') => {
  const tokens = normalizeTokens(text);
  return new Set(tokens);
};

const computeSymmetricMatchScore = (resumeText, jobDescription) => {
  const resumeTokens = normalizeTokens(resumeText);
  const jobTokens = normalizeTokens(jobDescription);

  if (!resumeTokens.length || !jobTokens.length) return 0;

  const resumeSet = new Set(resumeTokens);
  const jobSet = new Set(jobTokens);
  const intersection = [...resumeSet].filter((token) => jobSet.has(token));
  const union = new Set([...resumeSet, ...jobSet]);

  if (!union.size) return 0;

  const overlapRatio = intersection.length / union.size;
  const keywordBoost = Math.min(1, intersection.length / Math.max(5, Math.min(jobTokens.length, 10)));
  return Math.round((overlapRatio * 0.7 + keywordBoost * 0.3) * 100);
};

const google = createGoogleGenerativeAI({
  apiKey: env.geminiApiKey,
});

export const screenResume = async (resumeText, jobDescription) => {
  const symmetricScore = computeSymmetricMatchScore(resumeText, jobDescription);
  const result = await generateObject({
    model: google('gemini-3.1-flash-lite'),
    schema: z.object({
      candidateName: z.string().nullable().describe("The candidate's full name"),
      email: z.string().nullable().describe("The candidate's email address"),
      totalYearsExperience: z.number().describe("Total years of professional experience"),
      extractedSkills: z.array(z.string()).describe("List of core technical skills explicitly mentioned"),
      matchScore: z.number().min(0).max(100).describe("Score from 0-100 indicating fit for the role"),
      recommendationStatus: z.enum(["Shortlist", "Review", "Reject"]).describe("Recommendation based on match score")
    }),
    system: `You are the Resume Intelligence & Screening Agent for an enterprise HRMS system. 

Your objective is to ingest raw, unstructured resume text and a target job description, extract the candidate's core professional data, and evaluate their fit for the role.

You must operate strictly analytically, objectively, and without bias. You must not invent, infer, or hallucinate skills or experience that are not explicitly stated in the text.

### SCORING LOGIC
- 90-100: Exceptional match. Exceeds experience requirements and has all mandatory skills. (Shortlist)
- 70-89: Strong match. Meets core experience and possesses most mandatory skills. (Review or Shortlist)
- 50-69: Partial match. Lacks some core skills or falls slightly short on experience. (Review)
- 0-49: Poor match. Does not meet the baseline requirements for the role. (Reject)

### STRICT GUARDRAILS
- If a data point (like an email or phone number) is entirely missing from the resume, output null for that field. Do not guess.
- If the resume text is illegible or appears to be a corrupted file, return a matchScore of 0 and set the status to "Reject".`,
    prompt: `Target Job Description:\n${jobDescription}\n\nRaw Resume Text:\n${resumeText}\n\nSymmetric overlap score baseline: ${symmetricScore}/100`,
    temperature: 0.2
  });

  const aiScore = Number(result.object?.matchScore || 0);
  const blendedScore = Math.round((aiScore * 0.7) + (symmetricScore * 0.3));
  const recommendationStatus = blendedScore >= 80 ? 'Shortlist' : blendedScore >= 60 ? 'Review' : 'Reject';

  return {
    ...result.object,
    matchScore: Math.min(100, Math.max(0, blendedScore)),
    recommendationStatus
  };
};
