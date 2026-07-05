import { Button } from './Button.jsx';

export const EmptyState = ({ title, description, actionLabel, icon: Icon, onAction }) => (
  <div className="glass-panel flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
    {Icon ? (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.08] text-blue-300">
        <Icon className="h-6 w-6" />
      </div>
    ) : null}
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
    {actionLabel ? (
      <Button className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
