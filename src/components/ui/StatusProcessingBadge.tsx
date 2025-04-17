import React from 'react';
import { Clock, RefreshCw, CheckCircle, Pause, AlertCircle, AlertTriangle } from 'lucide-react';
import { Batch, CPFRecord } from '../../utils/supabase'; // Import types

type StatusType = Batch['status'] | CPFRecord['status']; // Combine possible statuses

interface StatusProcessingBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

const StatusProcessingBadge: React.FC<StatusProcessingBadgeProps> = ({ status, size = 'md' }) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-0.5';

  let themeClasses = "";
  let icon = null;
  let text = "Desconhecido";

  switch (status) {
    case 'pending':
      themeClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700";
      icon = <Clock className={`${iconSize} mr-1`} />;
      text = "Pendente";
      break;
    case 'processing': // "Em execução"
      themeClasses = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700";
      icon = <RefreshCw className={`${iconSize} mr-1 animate-spin`} />;
      text = "Em execução";
      break;
    case 'completed': // "Finalizado" (Batch)
    case 'processed': // "Finalizado" (CPF) - Assuming 'processed' means completed for CPF
      themeClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-300 dark:border-green-700";
      icon = <CheckCircle className={`${iconSize} mr-1`} />;
      text = "Finalizado";
      break;
    case 'paused':
      themeClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600";
      icon = <Pause className={`${iconSize} mr-1`} />;
      text = "Pausado";
      break;
    case 'error':
      themeClasses = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-300 dark:border-red-700";
      icon = <AlertCircle className={`${iconSize} mr-1`} />;
      text = "Erro";
      break;
    default:
      themeClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600";
      icon = <AlertTriangle className={`${iconSize} mr-1`} />;
      break;
  }

  return (
    <span className={`inline-flex items-center ${padding} rounded-full ${textSize} font-medium ${themeClasses}`}>
      {icon}
      {text}
    </span>
  );
};

export default StatusProcessingBadge;
