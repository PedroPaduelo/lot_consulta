import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          icon: <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          icon: <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          icon: <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        };
      case 'info':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`mt-4 p-3 ${styles.bg} ${styles.text} rounded-md flex items-start`}>
      {styles.icon}
      <span>{message}</span>
    </div>
  );
};

export default Alert;
