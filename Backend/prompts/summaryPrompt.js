export const summaryResponseSchema = {
  type: 'object',
  properties: {
    overallScore: { type: 'number' },
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    recommendedTopics: { type: 'array', items: { type: 'string' } }
  },
  required: ['overallScore', 'summary', 'strengths', 'weaknesses', 'recommendedTopics']
};

export const buildSummaryPrompt = ({ interview, answers }) => `
You are an interview coach producing a final report.

Interview setup:
- Role: ${interview.role}
- Experience: ${interview.experienceLevel}
- Difficulty: ${interview.difficulty}
- Type: ${interview.interviewType}

Question feedback:
${answers
  .map(
    (answer, index) => `
${index + 1}. Question: ${answer.question}
Transcript: ${answer.transcript}
Score: ${answer.feedback?.score?.overall ?? 0}/10
Mistakes: ${(answer.feedback?.mistakes || []).join('; ') || 'None listed'}
Suggestions: ${(answer.feedback?.suggestions || []).join('; ') || 'None listed'}
`
  )
  .join('\n')}

Create a concise final report. Return JSON only with no markdown or extra text.
`;
