import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ValidationSummaryProps {
  validCount: number;
  invalidCount: number;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ validCount, invalidCount }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4"> {/* Added flex-wrap */}
      {/* Themed Valid Badge */}
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-300 dark:border-green-700">
        <CheckCircle className="h-4 w-4 mr-1.5" /> {/* Increased margin */}
        {validCount} Válidos
      </span>
      {/* Themed Invalid Badge */}
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-300 dark:border-red-700">
        <AlertCircle className="h-4 w-4 mr-1.5" /> {/* Increased margin */}
        {invalidCount} Inválidos
      </span>
    </div>
  );
};

export default ValidationSummary;
