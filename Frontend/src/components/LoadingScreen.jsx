import { BrainCircuit } from 'lucide-react';

export const LoadingScreen = ({ label = 'Preparing interview workspace' }) => (
  <div className="flex min-h-screen items-center justify-center bg-ink px-4">
    <div className="glass-panel flex items-center gap-3 p-5">
      <BrainCircuit className="h-6 w-6 animate-pulse text-blue-300" />
      <span className="text-sm font-medium text-slate-200">{label}</span>
    </div>
  </div>
);
