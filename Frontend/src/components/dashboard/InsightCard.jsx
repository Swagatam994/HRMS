import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const InsightCard = ({ title, summary, loading = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-panel relative overflow-hidden p-5"
  >
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
    <div className="relative flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        {loading ? (
          <div className="mt-3 space-y-2">
            <div className="h-3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
          </div>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{summary || 'No insight available yet.'}</p>
        )}
      </div>
    </div>
  </motion.div>
);
