export const parseJsonFromText = (value) => {
  if (!value || typeof value !== 'string') {
    throw new Error('No text returned to parse as JSON.');
  }

  const cleaned = value
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned);
};
