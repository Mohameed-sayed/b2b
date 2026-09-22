import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'orange' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm cursor-pointer select-none';

  const variantStyles = {
    primary: 'bg-brand-primary hover:bg-[#045bbd] text-brand-white shadow-md shadow-brand-primary/20',
    orange: 'bg-brand-accent hover:bg-[#e67015] text-brand-white shadow-md shadow-brand-accent/20',
    secondary: 'bg-brand-white hover:bg-brand-light text-brand-primary border-2 border-brand-primary',
    success: 'bg-green-600 hover:bg-green-700 text-brand-white',
    danger: 'bg-red-600 hover:bg-red-700 text-brand-white',
    ghost: 'bg-transparent hover:bg-brand-light text-brand-primary',
    outline: 'bg-transparent hover:bg-brand-light text-brand-dark border-2 border-slate-300',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
    md: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-xl shadow-md',
    xl: 'text-lg md:text-xl px-8 py-4 gap-3 rounded-2xl shadow-xl font-extrabold',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
