import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string | React.ReactNode; // Allow ReactNode for complex messages
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/30', // Lighter background
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-300 dark:border-green-700', // Matching border
          icon: <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-green-500 dark:text-green-400" /> // Increased margin
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-300 dark:border-red-700',
          icon: <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-400', // Adjusted dark text
          border: 'border-yellow-300 dark:border-yellow-600', // Adjusted dark border
          icon: <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-yellow-500 dark:text-yellow-400" />
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-300 dark:border-blue-700',
          icon: <Info className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
        };
    }
  };

  const styles = getAlertStyles();

  return (
    // Added border and adjusted padding/margin
    <div className={`mt-4 p-4 ${styles.bg} ${styles.text} rounded-lg flex items-start border ${styles.border} shadow-sm`}> {/* Rounded-lg, shadow-sm */}
      {styles.icon}
      <div className="flex-1 text-sm">{message}</div> {/* Ensure text size consistency */}
    </div>
  );
};

export default Alert;
