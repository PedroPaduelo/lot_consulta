import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ValidationSummaryProps {
  validCount: number;
  invalidCount: number;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ validCount, invalidCount }) => {
  return (
    <div className="flex gap-4 mb-4">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-4 w-4 mr-1" />
        {validCount} válidos
      </span>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <AlertCircle className="h-4 w-4 mr-1" />
        {invalidCount} inválidos
      </span>
    </div>
  );
};

export default ValidationSummary;
