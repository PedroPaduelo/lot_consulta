import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300" // Darker overlay
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl transform transition-all sm:max-w-lg sm:w-full mx-4 border border-border-light dark:border-border-dark" // Added border
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <h3 className="text-lg font-medium leading-6 text-text-primary-light dark:text-text-primary-dark flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5"> {/* Adjusted padding */}
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark"> {/* Adjusted text color */}
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted-light dark:bg-muted-dark flex justify-end space-x-3 rounded-b-lg border-t border-border-light dark:border-border-dark"> {/* Added border */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:focus:ring-primary-dark text-sm font-medium" // Themed button
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm font-medium ${confirmButtonClass}`} // Keep confirm button class flexible
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
