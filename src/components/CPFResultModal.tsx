import React from 'react';
import { X, FileJson } from 'lucide-react';
import { DisplayCPFRecord } from '../pages/BatchDetailsPage'; // Import type if needed elsewhere, or define locally

interface CPFResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  cpfRecord: DisplayCPFRecord | null; // Use the extended type from BatchDetailsPage
}

const CPFResultModal: React.FC<CPFResultModalProps> = ({ isOpen, onClose, cpfRecord }) => {
  if (!isOpen || !cpfRecord) return null;

  // Function to safely stringify JSON, handling potential circular references
  const safeJsonStringify = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2); // Pretty print JSON
    } catch (error) {
      console.error("Error stringifying JSON:", error);
      return "Erro ao exibir o resultado (formato inválido ou dados complexos).";
    }
  };

  const resultString = cpfRecord.result ? safeJsonStringify(cpfRecord.result) : 'Nenhum resultado disponível.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl transform transition-all sm:max-w-2xl sm:w-full mx-4 border border-border-light dark:border-border-dark flex flex-col max-h-[80vh]" // Limit height
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h3 className="text-lg font-medium leading-6 text-text-primary-light dark:text-text-primary-dark flex items-center">
            <FileJson className="h-5 w-5 text-primary-light dark:text-primary-dark mr-2" />
            Resultado do Processamento - CPF: {cpfRecord.cpf}
          </h3>
          <button
            onClick={onClose}
            className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-grow"> {/* Allow content scrolling */}
          <pre className="text-sm text-text-primary-light dark:text-text-primary-dark bg-muted-light dark:bg-muted-dark p-4 rounded border border-border-light dark:border-border-dark whitespace-pre-wrap break-words">
            {resultString}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted-light dark:bg-muted-dark flex justify-end space-x-3 rounded-b-lg border-t border-border-light dark:border-border-dark flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:focus:ring-primary-dark text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CPFResultModal;
