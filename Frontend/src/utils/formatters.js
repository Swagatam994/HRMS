export const formatScore = (score) => `${Number(score || 0).toFixed(1)}/10`;

export const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
};

export const formatDuration = (seconds = 0) => {
  const total = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const rest = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${rest}`;
};
