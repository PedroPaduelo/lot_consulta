import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-4'
  };

  const colorClasses = {
    blue: 'border-blue-600 border-r-transparent',
    white: 'border-white border-r-transparent'
  };

  return (
    <div 
      className={`inline-block animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
};

export default Spinner;
