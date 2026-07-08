import { CheckCircle2, Lightbulb, Target, TriangleAlert } from 'lucide-react';
import { formatScore } from '../utils/formatters.js';

const ListBlock = ({ title, items = [], icon: Icon, color }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
    <div className={`mb-3 flex items-center gap-2 text-sm font-semibold ${color}`}>
      <Icon className="h-4 w-4" />
      <span>{title}</span>
    </div>
    <ul className="space-y-2 text-sm text-slate-300">
      {(items.length ? items : ['No items listed.']).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

export const FeedbackPanel = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div className="glass-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-sm text-slate-400">Latest Evaluation</p>
          <h3 className="text-2xl font-bold text-white">{formatScore(feedback.score?.overall)}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-4">
          <span>Accuracy {formatScore(feedback.score?.technicalAccuracy)}</span>
          <span>Comms {formatScore(feedback.score?.communication)}</span>
          <span>Complete {formatScore(feedback.score?.completeness)}</span>
          <span>Confidence {formatScore(feedback.score?.confidence)}</span>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{feedback.idealAnswer}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ListBlock title="Strengths" items={feedback.strengths} icon={CheckCircle2} color="text-emerald-300" />
        <ListBlock title="Mistakes" items={feedback.mistakes} icon={TriangleAlert} color="text-amber-300" />
        <ListBlock title="Suggestions" items={feedback.suggestions} icon={Lightbulb} color="text-blue-300" />
        <ListBlock title="Recommended Topics" items={feedback.recommendedTopics} icon={Target} color="text-fuchsia-300" />
      </div>
    </div>
  );
};
