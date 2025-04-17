import React, { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { validateCPF, cleanAndPadCPF, formatCPF } from '../utils/validators';
import { createBatch, createCPFRecords, checkSupabaseConnection } from '../utils/supabase';
import FileUploader from '../components/ui/FileUploader';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';
import CPFTable, { CPFRecord } from '../components/CPFTable';
import ValidationSummary from '../components/ValidationSummary';
import BatchForm from '../components/BatchForm';
import { usePagination } from '../hooks/usePagination';

const UploadPage: React.FC = () => {
  const [data, setData] = useState<CPFRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  
  // Use pagination hook
  const { currentPage, totalPages, paginatedData, setPage } = usePagination(data, 5);

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      setSupabaseConnected(isConnected);
      
      if (!isConnected) {
        setError('Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente.');
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
          if (row[key] !== undefined) {
            cpfValue = String(row[key]);
            break;
          }
        }
        
        // If no CPF found, try to use the first column value
        if (!cpfValue && Object.values(row).length > 0) {
          cpfValue = String(Object.values(row)[0]);
        }
        
        // Clean and pad the CPF
        const cleanedCPF = cleanAndPadCPF(cpfValue);
        
        // Get name and phone if available
        const possibleNameKeys = ['nome', 'Nome', 'NOME', 'name', 'Name', 'NAME'];
        const possiblePhoneKeys = ['telefone', 'Telefone', 'TELEFONE', 'phone', 'Phone', 'PHONE', 'celular', 'Celular', 'CELULAR'];
        
        let nameValue = '';
        let phoneValue = '';
        
        for (const key of possibleNameKeys) {
          if (row[key] !== undefined) {
            nameValue = String(row[key]);
            break;
          }
        }
        
        for (const key of possiblePhoneKeys) {
          if (row[key] !== undefined) {
            phoneValue = String(row[key]);
            break;
          }
        }
        
        // If no name found, use a default
        if (!nameValue) {
          nameValue = `Pessoa ${index + 1}`;
        }
        
        // Validate the CPF
        const isValid = validateCPF(cleanedCPF);
        
        return {
          id: index + 1,
          nome: nameValue,
          cpf: formatCPF(cleanedCPF), // Format for display
          telefone: phoneValue || '-',
          isValid: isValid
        };
      });
      
      setData(processedData);
      setIsLoading(false);
      setSuccess(`Arquivo processado com sucesso! ${processedData.length} registros encontrados.`);
      setPage(1); // Reset to first page when new data is loaded
    } catch (err) {
      console.error('Error processing Excel file:', err);
      setError(`Erro ao processar o arquivo: ${err instanceof Error ? err.message : 'Formato inválido'}`);
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
      
      // Create batch in Supabase
      const batch = await createBatch({
        ...batchData,
        status: 'pending'
      });
      
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
      }));
      
      const success = await createCPFRecords(cpfRecords);
      
      if (!success) {
        throw new Error('Falha ao criar os registros de CPF no banco de dados');
      }
      
      return true;
    } catch (err) {
      console.error('Error saving batch:', err);
      return false;
    }
  };

  const validCount = data.filter(row => row.isValid).length;
  const invalidCount = data.length - validCount;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Upload de Arquivo Excel</h1>
        <p className="text-gray-600 mb-6">
          Faça upload de um arquivo Excel contendo CPFs para validação. O sistema verificará se os CPFs são válidos.
        </p>

        {supabaseConnected === false && (
          <Alert 
            type="warning" 
            message="Não foi possível conectar ao banco de dados. Você ainda pode validar CPFs, mas não poderá salvar lotes para processamento." 
          />
        )}

        <FileUploader onFileSelect={handleFileUpload} />

        {isLoading && (
          <div className="mt-4 text-center">
            <Spinner size="lg" />
            <p className="mt-2 text-gray-600">Processando arquivo...</p>
          </div>
        )}

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
      </div>

      {data.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo da Validação</h2>
            <ValidationSummary validCount={validCount} invalidCount={invalidCount} />
          </div>
          
          <BatchForm 
            cpfData={data}
            validCount={validCount}
            invalidCount={invalidCount}
            filename={currentFilename}
            onSave={handleSaveBatch}
          />
          
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
