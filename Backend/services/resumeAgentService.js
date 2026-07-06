import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { env } from '../config/env.js';

const google = createGoogleGenerativeAI({
  apiKey: env.geminiApiKey,
});

export const screenResume = async (resumeText, jobDescription) => {
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
    prompt: `Target Job Description:\n${jobDescription}\n\nRaw Resume Text:\n${resumeText}`,
    temperature: 0.2
  });

  return result.object;
};
