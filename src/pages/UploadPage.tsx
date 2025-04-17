import React, { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { validateCPF, cleanAndPadCPF, formatCPF } from '../utils/validators';
import { createBatch, createCPFRecords, checkSupabaseConnection, checkTablesExist } from '../utils/supabase';
import FileUploader from '../components/ui/FileUploader';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';
import CPFTable, { CPFRecord } from '../components/CPFTable';
import ValidationSummary from '../components/ValidationSummary';
import BatchForm from '../components/BatchForm';
import DatabaseStatusChecker from '../components/DatabaseStatusChecker';
import { usePagination } from '../hooks/usePagination';

const UploadPage: React.FC = () => {
  const [data, setData] = useState<CPFRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [tablesStatus, setTablesStatus] = useState<{batches: boolean, cpf_records: boolean} | null>(null);

  // Use pagination hook
  const { currentPage, totalPages, paginatedData, setPage } = usePagination(data, 5);

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      setSupabaseConnected(isConnected);

      if (!isConnected) {
        setError('Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente.');
      } else {
        // If connected, check if tables exist
        const tables = await checkTablesExist();
        setTablesStatus(tables);

        if (!tables.batches || !tables.cpf_records) {
          console.warn('Some required tables do not exist:', tables);
        }
      }
    };

    checkConnection();
  }, []);

  const handleFileUpload = async (file: File) => {
    // Check if file is Excel
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setError('Por favor, faça upload apenas de arquivos Excel (.xlsx ou .xls)');
      setSuccess(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setData([]); // Clear previous data
    setCurrentFilename(file.name);

    try {
      // Read the Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer);

      // Get the first worksheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert to JSON
      const jsonData = utils.sheet_to_json<any>(worksheet);

      if (jsonData.length === 0) {
        throw new Error('A planilha está vazia ou não contém dados válidos');
      }

      // Process the data
      const processedData: CPFRecord[] = jsonData.map((row, index) => {
        // Try to find CPF in the row (look for common column names)
        const possibleCPFKeys = ['cpf', 'CPF', 'Cpf', 'documento', 'Documento', 'DOCUMENTO', 'doc', 'Doc', 'DOC'];
        let cpfValue = '';

        for (const key of possibleCPFKeys) {
          if (row[key] !== undefined && row[key] !== null) { // Check for null as well
            cpfValue = String(row[key]);
            break;
          }
        }

        // If no CPF found, try to use the first column value if it exists
        if (!cpfValue && Object.keys(row).length > 0) {
           const firstColKey = Object.keys(row)[0];
           if (row[firstColKey] !== undefined && row[firstColKey] !== null) {
             cpfValue = String(row[firstColKey]);
           }
        }

        // Clean and pad the CPF
        const cleanedCPF = cleanAndPadCPF(cpfValue);

        // Get name and phone if available
        const possibleNameKeys = ['nome', 'Nome', 'NOME', 'name', 'Name', 'NAME'];
        const possiblePhoneKeys = ['telefone', 'Telefone', 'TELEFONE', 'phone', 'Phone', 'PHONE', 'celular', 'Celular', 'CELULAR'];

        let nameValue = '';
        let phoneValue = '';

        for (const key of possibleNameKeys) {
          if (row[key] !== undefined && row[key] !== null) {
            nameValue = String(row[key]);
            break;
          }
        }

        for (const key of possiblePhoneKeys) {
          if (row[key] !== undefined && row[key] !== null) {
            phoneValue = String(row[key]);
            break;
          }
        }

        // If no name found, use a default
        if (!nameValue) {
          nameValue = `Registro ${index + 1}`; // More generic default
        }

        // Validate the CPF
        const isValid = validateCPF(cleanedCPF);

        return {
          id: index + 1, // Use index as a temporary ID for display
          nome: nameValue,
          cpf: formatCPF(cleanedCPF), // Format for display
          telefone: phoneValue || '-',
          isValid: isValid
        };
      });

      setData(processedData);
      setIsLoading(false);
      setSuccess(`Arquivo "${file.name}" processado com sucesso! ${processedData.length} registros encontrados.`);
      setPage(1); // Reset to first page when new data is loaded
    } catch (err) {
      console.error('Error processing Excel file:', err);
      setError(`Erro ao processar o arquivo: ${err instanceof Error ? err.message : 'Formato inválido ou erro inesperado'}`);
      setIsLoading(false);
    }
  };

  const handleSaveBatch = async (batchData: {
    name: string;
    bank_api: string;
    filename: string;
    total_cpfs: number;
    valid_cpfs: number;
    invalid_cpfs: number;
  }) => {
    try {
      // Check Supabase connection first
      if (supabaseConnected === false) {
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          throw new Error('Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente.');
        }
        setSupabaseConnected(true);
      }

      // Check if tables exist
      const tables = await checkTablesExist();
      if (!tables.batches || !tables.cpf_records) {
        throw new Error('Algumas tabelas necessárias não foram encontradas no banco de dados.');
      }

      // Create batch in Supabase - **Ensure status is 'pending'**
      const batchToCreate = {
        ...batchData,
        status: 'pending' as const // Explicitly set status to 'pending'
      };

      const batch = await createBatch(batchToCreate);


      if (!batch) {
        throw new Error('Falha ao criar o lote no banco de dados');
      }

      // Create CPF records
      const cpfRecords = data.map(record => ({
        batch_id: batch.id,
        cpf: record.cpf.replace(/\D/g, ''), // Store clean CPF
        nome: record.nome,
        telefone: record.telefone,
        is_valid: record.isValid
        // status and result will be set to defaults by createCPFRecords function
      }));

      const success = await createCPFRecords(cpfRecords);

      if (!success) {
        // TODO: Consider deleting the created batch if CPF records fail? Or mark batch as error?
        throw new Error('Falha ao criar os registros de CPF no banco de dados');
      }

      return true;
    } catch (err) {
      console.error('Error saving batch:', err);
      // Propagate the error message
      throw err; // Re-throw the error to be caught in BatchForm
    }
  };

  const handleDatabaseStatusChange = (status: {batches: boolean, cpf_records: boolean}) => {
    setTablesStatus(status);
  };

  const validCount = data.filter(row => row.isValid).length;
  const invalidCount = data.length - validCount;

  return (
    <div className="max-w-4xl mx-auto">
      <DatabaseStatusChecker onStatusChange={handleDatabaseStatusChange} />

      {/* Themed Upload Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 mb-6 border border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Upload de Arquivo Excel</h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
          Faça upload de um arquivo Excel (.xlsx ou .xls) contendo CPFs para validação. O sistema tentará identificar a coluna de CPF automaticamente.
        </p>

        {supabaseConnected === false && (
          <Alert
            type="warning"
            message="Não foi possível conectar ao banco de dados. Você ainda pode validar CPFs, mas não poderá salvar lotes para processamento."
          />
        )}

        <FileUploader onFileSelect={handleFileUpload} />

        {isLoading && (
          <div className="mt-6 text-center"> {/* Increased margin */}
            <Spinner size="lg" />
            <p className="mt-3 text-text-secondary-light dark:text-text-secondary-dark">Processando arquivo...</p>
          </div>
        )}

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
      </div>

      {/* Results Section - Only show if data exists and not loading */}
      {!isLoading && data.length > 0 && (
        <div className="space-y-6"> {/* Added space between elements */}
          {/* Themed Validation Summary Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 border border-border-light dark:border-border-dark">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Resumo da Validação</h2>
            <ValidationSummary validCount={validCount} invalidCount={invalidCount} />
          </div>

          {/* Batch Form - Already themed */}
          <BatchForm
            cpfData={data}
            validCount={validCount}
            invalidCount={invalidCount}
            filename={currentFilename}
            onSave={handleSaveBatch}
            // Disable save if Supabase is not connected or tables don't exist
            disabled={supabaseConnected === false || !tablesStatus?.batches || !tablesStatus?.cpf_records}
          />

          {/* CPF Table - Already themed */}
          <CPFTable
            data={paginatedData}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default UploadPage;
