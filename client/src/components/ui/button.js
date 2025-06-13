import React from 'react';

export const Button = ({
  children,
  className = '',
  variant = 'default',
  type = 'button',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variantClass =
    variant === 'outline'
      ? 'border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';

  return (
    <button
      type={type}
      className={`${base} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
