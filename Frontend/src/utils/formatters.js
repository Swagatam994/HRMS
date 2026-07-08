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

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
