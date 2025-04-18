import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  isValid: boolean;
  showText?: boolean;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  isValid,
  showText = true,
  size = 'md'
}) => {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'; // Slightly larger sm icon
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-0.5';

  // Define base classes and specific theme classes
  const baseClasses = `inline-flex items-center ${padding} rounded-full ${textSize} font-medium border`; // Added border
  const validClasses = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700"; // Adjusted dark bg
  const invalidClasses = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-700"; // Adjusted dark bg

  return (
    <span className={`${baseClasses} ${isValid ? validClasses : invalidClasses}`}>
      {isValid ? (
        <CheckCircle className={`${iconSize} ${showText ? 'mr-1' : ''}`} />
      ) : (
        <AlertCircle className={`${iconSize} ${showText ? 'mr-1' : ''}`} />
      )}
      {showText && (isValid ? 'Válido' : 'Inválido')}
    </span>
  );
};

export default StatusBadge;
