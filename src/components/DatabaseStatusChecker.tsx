import React, { useState, useEffect } from 'react';
import { checkTablesExist } from '../utils/supabase';
import Alert from './ui/Alert';

interface DatabaseStatusCheckerProps {
  onStatusChange?: (status: {batches: boolean, cpf_records: boolean}) => void;
}

const DatabaseStatusChecker: React.FC<DatabaseStatusCheckerProps> = ({ onStatusChange }) => {
  const [tablesStatus, setTablesStatus] = useState<{batches: boolean, cpf_records: boolean} | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const status = await checkTablesExist();
      setTablesStatus(status);
      
      if (onStatusChange) {
        onStatusChange(status);
      }
      
      if (!status.batches || !status.cpf_records) {
        setError('Algumas tabelas necessárias não foram encontradas no banco de dados.');
      }
    } catch (err) {
      console.error('Error checking database status:', err);
      setError('Erro ao verificar o status do banco de dados.');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return null;
  }

  if (!tablesStatus || !tablesStatus.batches || !tablesStatus.cpf_records) {
    return (
      <Alert 
        type="warning" 
        message={
          <>
            <strong>Atenção:</strong> Algumas tabelas necessárias não foram encontradas no banco de dados.
            {!tablesStatus?.batches && <div>- Tabela 'batches' não encontrada</div>}
            {!tablesStatus?.cpf_records && <div>- Tabela 'cpf_records' não encontrada</div>}
            <div className="mt-2">
              Isso pode causar erros ao salvar ou consultar dados.
            </div>
          </>
        } 
      />
    );
  }

  return null;
};

export default DatabaseStatusChecker;
