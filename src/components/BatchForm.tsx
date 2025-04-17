import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Alert from './ui/Alert';
import { CPFRecord } from './CPFTable';

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
  onSave 
}) => {
  const [name, setName] = useState('');
  const [bankApi, setBankApi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Por favor, informe um nome para o lote');
      return;
    }
    
    if (!bankApi) {
      setError('Por favor, selecione uma API de banco');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const batchData = {
        name,
        bank_api: bankApi,
        filename: filename || 'arquivo.xlsx',
        total_cpfs: cpfData.length,
        valid_cpfs: validCount,
        invalid_cpfs: invalidCount
      };
      
      const success = await onSave(batchData);
      
      if (success) {
        setSuccess('Lote salvo com sucesso! Aguardando processamento.');
        // Reset form
        setName('');
        setBankApi('');
      } else {
        setError('Erro ao salvar o lote. Por favor, tente novamente.');
      }
    } catch (err) {
      console.error('Error saving batch:', err);
      setError('Erro ao salvar o lote. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Salvar Lote para Processamento</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="batch-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Lote
            </label>
            <input
              type="text"
              id="batch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Validação CPF - Maio 2023"
            />
          </div>
          
          <div>
            <label htmlFor="bank-api" className="block text-sm font-medium text-gray-700 mb-1">
              API do Banco
            </label>
            <select
              id="bank-api"
              value={bankApi}
              onChange={(e) => setBankApi(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Arquivo</p>
            <p className="font-medium truncate">{filename || 'arquivo.xlsx'}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Total de CPFs</p>
            <p className="font-medium">{cpfData.length}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium text-yellow-600">Pendente</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={isLoading || !name.trim() || !bankApi}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
        
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
      </form>
    </div>
  );
};

export default BatchForm;
