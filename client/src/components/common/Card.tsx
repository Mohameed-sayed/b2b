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
    default: 'bg-brand-white border border-slate-200 backdrop-blur-md',
    glow: 'bg-brand-white border border-slate-300 shadow-xl shadow-brand-primary/10',
    accent: 'bg-brand-white border-2 border-brand-accent/40 shadow-lg shadow-brand-accent/10',
    success: 'bg-brand-white border-2 border-green-600/40 shadow-lg shadow-green-600/10',
    danger: 'bg-brand-white border-2 border-red-600/40 shadow-lg shadow-red-600/10',
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
