export const evaluationResponseSchema = {
  type: 'object',
  properties: {
    score: {
      type: 'object',
      properties: {
        technicalAccuracy: { type: 'number' },
        communication: { type: 'number' },
        completeness: { type: 'number' },
        confidence: { type: 'number' },
        overall: { type: 'number' }
      },
      required: ['technicalAccuracy', 'communication', 'completeness', 'confidence', 'overall']
    },
    idealAnswer: { type: 'string' },
    mistakes: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    recommendedTopics: { type: 'array', items: { type: 'string' } },
    difficultyLevel: { type: 'string' }
  },
  required: [
    'score',
    'idealAnswer',
    'mistakes',
    'suggestions',
    'strengths',
    'weaknesses',
    'recommendedTopics',
    'difficultyLevel'
  ]
};

export const buildEvaluationPrompt = ({
  role,
  experienceLevel,
  difficulty,
  question,
  expectedAnswer,
  transcript
}) => `
You are an expert AI interviewer evaluating a candidate for a ${role} role.

Candidate level: ${experienceLevel}
Question difficulty: ${difficulty}

Question:
${question}

Expected answer reference:
${expectedAnswer || 'No reference answer was provided. Evaluate against industry-standard knowledge.'}

Candidate transcript:
${transcript}

Evaluate the candidate answer using only the transcript.
Score each criterion from 0 to 10:
- technicalAccuracy
- communication
- completeness
- confidence, estimated from clarity, specificity, and decisiveness in the transcript only
- overall

Return JSON only. Do not include markdown, commentary, or extra keys.
`;
