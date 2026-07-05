export const clampScore = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(10, Number(number.toFixed(1))));
};

export const average = (items) => {
  if (!items.length) return 0;
  return clampScore(items.reduce((sum, item) => sum + Number(item || 0), 0) / items.length);
};

export const buildReportFromAnswers = (answers = []) => {
  const scoredAnswers = answers.filter((answer) => answer?.feedback?.score?.overall !== undefined);
  const scores = scoredAnswers.map((answer) => answer.feedback.score.overall);

  const strengths = [
    ...new Set(scoredAnswers.flatMap((answer) => answer.feedback?.strengths || []))
  ].slice(0, 6);
  const weaknesses = [
    ...new Set(scoredAnswers.flatMap((answer) => answer.feedback?.weaknesses || answer.feedback?.mistakes || []))
  ].slice(0, 6);
  const recommendedTopics = [
    ...new Set(scoredAnswers.flatMap((answer) => answer.feedback?.recommendedTopics || []))
  ].slice(0, 8);

  return {
    overallScore: average(scores),
    strengths,
    weaknesses,
    recommendedTopics,
    summary:
      scoredAnswers.length > 0
        ? `Completed ${scoredAnswers.length} question${scoredAnswers.length === 1 ? '' : 's'} with an average score of ${average(scores)}/10.`
        : 'No evaluated answers were available for this interview.',
    generatedAt: new Date()
  };
};
