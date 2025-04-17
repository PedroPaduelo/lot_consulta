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
          bg: 'bg-green-100 dark:bg-green-900',
          text: 'text-green-700 dark:text-green-300',
          icon: <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-green-500 dark:text-green-400" />
        };
      case 'error':
        return {
          bg: 'bg-red-100 dark:bg-red-900',
          text: 'text-red-700 dark:text-red-300',
          icon: <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-yellow-500 dark:text-yellow-400" />
        };
      case 'info':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900',
          text: 'text-blue-700 dark:text-blue-300',
          icon: <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
        };
    }
  };

  const styles = getAlertStyles();

  return (
    // Added border and adjusted padding/margin
    <div className={`mt-4 p-4 ${styles.bg} ${styles.text} rounded-md flex items-start border border-current`}>
      {styles.icon}
      <span className="flex-1">{message}</span>
    </div>
  );
};

export default Alert;
