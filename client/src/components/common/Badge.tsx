import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon
}) => {
  const variantStyles = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    orange: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    neutral: 'bg-brand-white text-brand-secondary border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs md:text-sm px-2.5 py-1 font-semibold',
    lg: 'text-sm md:text-base px-3.5 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
