import React, { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import Alert from './ui/Alert';
import { CPFRecord } from './CPFTable';
import Spinner from './ui/Spinner'; // Import Spinner

interface BatchFormProps {
  cpfData: CPFRecord[];
  validCount: number;
  invalidCount: number;
  filename: string;
  onSave: (batchData: {
    name: string;
    bank_api: string;
    filename: string;
    total_cpfs: number;
    valid_cpfs: number;
    invalid_cpfs: number;
  }) => Promise<boolean>;
  disabled?: boolean; // Add disabled prop
}

const BANK_API_OPTIONS = [
  { value: 'banco_brasil', label: 'Banco do Brasil' },
  { value: 'caixa', label: 'Caixa Econômica Federal' },
  { value: 'bradesco', label: 'Bradesco' },
  { value: 'itau', label: 'Itaú' },
  { value: 'santander', label: 'Santander' },
];

const BatchForm: React.FC<BatchFormProps> = ({
  cpfData,
  validCount,
  invalidCount,
  filename,
  onSave,
  disabled = false // Default to false
}) => {
  const [name, setName] = useState('');
  const [bankApi, setBankApi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setSuccess(null);

    if (!name.trim()) {
      setError('Por favor, informe um nome para o lote');
      return;
    }

    if (!bankApi) {
      setError('Por favor, selecione uma API de banco');
      return;
    }

    setIsLoading(true);

    try {
      const batchData = {
        name,
        bank_api: bankApi,
        filename: filename || 'arquivo.xlsx',
        total_cpfs: cpfData.length,
        valid_cpfs: validCount,
        invalid_cpfs: invalidCount
      };

      // onSave now throws error on failure
      await onSave(batchData);

      setSuccess('Lote salvo com sucesso! Aguardando processamento na tela "Lotes Salvos".');
      // Reset form
      setName('');
      setBankApi('');
    } catch (err: any) {
      console.error('Error saving batch:', err);
      setError(`Erro ao salvar o lote: ${err.message || 'Por favor, tente novamente.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Themed form container
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark"> {/* Increased rounding, shadow */}
      <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">Salvar Lote para Processamento</h2> {/* Increased margin */}

      {disabled && (
         <Alert type="warning" message={
            <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0"/>
                <span>Não é possível salvar lotes. Verifique a conexão com o banco de dados e se as tabelas existem.</span>
            </div>
         } />
      )}

      <form onSubmit={handleSubmit} className="space-y-6"> {/* Added space-y */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Increased gap */}
          {/* Themed Input Field */}
          <div>
            <label htmlFor="batch-name" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"> {/* Increased margin */}
              Nome do Lote *
            </label>
            <input
              type="text"
              id="batch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input w-full px-4 py-2 border-border-light dark:border-border-dark rounded-lg focus:border-primary-light focus:ring-primary-light dark:focus:border-primary-dark dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out" // Use form-input, rounded-lg
              placeholder="Ex: Validação Clientes - Junho 2024"
              required
              disabled={disabled || isLoading}
            />
          </div>

          {/* Themed Select Field */}
          <div>
            <label htmlFor="bank-api" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"> {/* Increased margin */}
              API do Banco *
            </label>
            <select
              id="bank-api"
              value={bankApi}
              onChange={(e) => setBankApi(e.target.value)}
              className="form-select w-full px-4 py-2 border-border-light dark:border-border-dark rounded-lg focus:border-primary-light focus:ring-primary-light dark:focus:border-primary-dark dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out" // Use form-select, rounded-lg
              required
              disabled={disabled || isLoading}
            >
              <option value="">Selecione uma API</option>
              {BANK_API_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Themed Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-muted-light dark:bg-muted-dark p-4 rounded-lg border border-border-light dark:border-border-dark"> {/* Increased padding, rounded-lg */}
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Arquivo</p>
            <p className="font-medium text-text-primary-light dark:text-text-primary-dark truncate" title={filename || 'arquivo.xlsx'}>{filename || 'arquivo.xlsx'}</p>
          </div>

          <div className="bg-muted-light dark:bg-muted-dark p-4 rounded-lg border border-border-light dark:border-border-dark"> {/* Increased padding, rounded-lg */}
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Total de CPFs</p>
            <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{cpfData.length}</p>
          </div>

          <div className="bg-muted-light dark:bg-muted-dark p-4 rounded-lg border border-border-light dark:border-border-dark"> {/* Increased padding, rounded-lg */}
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Status Inicial</p>
            <p className="font-medium text-yellow-600 dark:text-yellow-400">Pendente</p>
          </div>
        </div>

        {/* Use themed Alert component */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Themed Save Button */}
        <div className="flex justify-end pt-2"> {/* Added padding-top */}
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-semibold hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out shadow-sm hover:shadow-md" // Adjusted padding, rounded-lg, shadow
            disabled={isLoading || !name.trim() || !bankApi || disabled}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="white" className="mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Lote
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BatchForm;
