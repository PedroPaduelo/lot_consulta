import React, { useState } from 'react';
import { X, Filter, Download, Code } from 'lucide-react'; // Added Code icon
import { CPFRecord } from '../utils/supabase'; // Import base type
import Spinner from './ui/Spinner'; // Import Spinner

// Define possible statuses for filtering
type CPFStatus = CPFRecord['status'] | 'all'; // Add 'all' option

// Define possible values for the 'codigo' filter
type CodigoFilter = 'all' | 'sim' | 'nao_sim'; // 'nao_sim' includes null, undefined, or anything else

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: { status: CPFStatus; codigo: CodigoFilter }) => void; // Pass both filters back
  isExporting: boolean; // Receive exporting state
  recordCount: number; // Total records in the batch for context
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  recordCount
}) => {
  const [selectedStatus, setSelectedStatus] = useState<CPFStatus>('Finalizado'); // Default to 'Finalizado'
  const [selectedCodigo, setSelectedCodigo] = useState<CodigoFilter>('all'); // Default to 'all'

  if (!isOpen) return null;

  const handleExportClick = () => {
    onExport({ status: selectedStatus, codigo: selectedCodigo }); // Pass both filters
    // Keep modal open while exporting
  };

  const statusOptions: { value: CPFStatus; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'Finalizado', label: 'Finalizado' },
    { value: 'Erro', label: 'Erro' },
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Em execução', label: 'Em execução' },
  ];

  const codigoOptions: { value: CodigoFilter; label: string; description: string }[] = [
    { value: 'all', label: 'Todos', description: 'Incluir todos os registros, independente do valor do campo "Código".' },
    { value: 'sim', label: 'Código = SIM', description: 'Incluir apenas registros onde o campo "Código" no resultado é "SIM".' },
    { value: 'nao_sim', label: 'Código ≠ SIM', description: 'Incluir registros onde o campo "Código" não é "SIM" (inclui nulo, vazio ou diferente).' },
  ];


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl transform transition-all sm:max-w-lg sm:w-full mx-4 border border-border-light dark:border-border-dark flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h3 className="text-lg font-medium leading-6 text-text-primary-light dark:text-text-primary-dark flex items-center">
            <Filter className="h-5 w-5 text-primary-light dark:text-primary-dark mr-2" />
            Opções de Exportação (Excel)
          </h3>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus:outline-none disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Filters */}
        <div className="px-6 py-5 overflow-y-auto flex-grow space-y-6"> {/* Increased space */}
           <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
             Selecione os filtros para exportar os registros de CPF. A exportação incluirá CPF, Nome, Telefone, Banco, Valor Liberado, Código, Status e Data de Atualização.
           </p>
           <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
             Total de registros no lote: <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{recordCount}</span>
           </p>

          {/* Status Filter */}
          <div>
            <label htmlFor="export-status-filter" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
              Filtrar por Status do Processamento:
            </label>
            <select
              id="export-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as CPFStatus)}
              disabled={isExporting}
              className="form-select w-full px-4 py-2 border-border-light dark:border-border-dark rounded-lg focus:border-primary-light focus:ring-primary-light dark:focus:border-primary-dark dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Codigo Filter */}
          <fieldset className="space-y-3">
             <legend className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
               Filtrar por Campo "Código" (do resultado):
             </legend>
             {codigoOptions.map((option) => (
               <label
                 key={option.value}
                 className={`flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-colors duration-150 ${
                   selectedCodigo === option.value
                     ? 'bg-primary-light/10 dark:bg-primary-dark/20 border-primary-light dark:border-primary-dark'
                     : 'border-border-light dark:border-border-dark hover:bg-muted-light dark:hover:bg-muted-dark'
                 } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 <input
                   type="radio"
                   name="codigo-filter"
                   value={option.value}
                   checked={selectedCodigo === option.value}
                   onChange={() => setSelectedCodigo(option.value)}
                   disabled={isExporting}
                   className="form-radio h-4 w-4 text-primary-light dark:text-primary-dark focus:ring-primary-light dark:focus:ring-primary-dark border-gray-300 dark:border-gray-600 bg-surface-light dark:bg-surface-dark mt-0.5 flex-shrink-0 disabled:opacity-50"
                 />
                 <div className="flex-1">
                    <span className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{option.label}</span>
                    <span className="block text-xs text-text-secondary-light dark:text-text-secondary-dark">{option.description}</span>
                 </div>
               </label>
             ))}
           </fieldset>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted-light dark:bg-muted-dark flex justify-end space-x-3 rounded-b-lg border-t border-border-light dark:border-border-dark flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:focus:ring-primary-dark text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExportClick}
            disabled={isExporting}
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-background-dark flex items-center disabled:opacity-60 disabled:cursor-wait transition-all duration-200 ease-in-out text-sm shadow-sm hover:shadow-md"
          >
            {isExporting ? (
              <>
                <Spinner size="sm" color="white" className="mr-2" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Executar e Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
