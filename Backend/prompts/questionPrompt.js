export const buildQuestionSelectionPrompt = ({ role, experienceLevel, difficulty, interviewType, count }) => `
Select ${count} high-signal interview questions for a ${role} candidate.
Experience level: ${experienceLevel}
Difficulty: ${difficulty}
Interview type: ${interviewType}

Questions should be asked one at a time, be clear, and be suitable for spoken interviews.
`;
