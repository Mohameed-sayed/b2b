import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'accent' | 'success' | 'danger';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900/80 border border-slate-800 backdrop-blur-md',
    glow: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/60 shadow-xl shadow-blue-500/5',
    accent: 'bg-gradient-to-br from-orange-950/40 via-slate-900/90 to-slate-950 border border-orange-500/30 shadow-xl shadow-orange-500/10',
    success: 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-xl shadow-emerald-500/10',
    danger: 'bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-950 border border-rose-500/30 shadow-xl shadow-rose-500/10',
  };

  const interactiveStyles = interactive
    ? 'transition-all duration-200 hover:-translate-y-1 hover:border-slate-600 hover:shadow-2xl cursor-pointer active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-2xl p-6 ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
