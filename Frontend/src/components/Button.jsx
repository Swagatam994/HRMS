import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-400 focus-visible:ring-blue-400',
  secondary: 'bg-white/[0.08] text-slate-100 hover:bg-white/[0.12] focus-visible:ring-white/30',
  danger: 'bg-rose-500 text-white hover:bg-rose-400 focus-visible:ring-rose-400',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/[0.08] focus-visible:ring-white/30'
};

export const Button = ({
  as: Component = 'button',
  children,
  icon: Icon,
  variant = 'primary',
  loading = false,
  className = '',
  title,
  type = 'button',
  disabled = false,
  ...props
}) => {
  const isNativeButton = Component === 'button';
  const unavailable = loading || disabled;

  return (
    <Component
      type={isNativeButton ? type : undefined}
      aria-disabled={!isNativeButton && unavailable ? true : undefined}
      title={title}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${unavailable && !isNativeButton ? 'pointer-events-none opacity-60' : ''} ${className}`}
      disabled={isNativeButton ? unavailable : undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children ? <span className="min-w-0 truncate">{children}</span> : null}
    </Component>
  );
};
