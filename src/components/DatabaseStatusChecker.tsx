import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection, checkTablesExist } from '../utils/supabase';
import Alert from './ui/Alert';
import Spinner from './ui/Spinner'; // Import Spinner

interface DatabaseStatusCheckerProps {
  onStatusChange?: (status: {
    connected: boolean;
    connectionError?: string;
    tables: {
      batches: { exists: boolean; error?: string };
      cpf_records: { exists: boolean; error?: string };
    } | null;
  }) => void;
}

const DatabaseStatusChecker: React.FC<DatabaseStatusCheckerProps> = ({ onStatusChange }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tablesStatus, setTablesStatus] = useState<{
    batches: { exists: boolean; error?: string };
    cpf_records: { exists: boolean; error?: string };
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    setConnectionError(null);
    setTablesStatus(null);
    setIsConnected(null);

    let finalStatus: Parameters<Required<DatabaseStatusCheckerProps>['onStatusChange']>[0] = {
        connected: false,
        connectionError: undefined,
        tables: null
    };

    try {
      // 1. Check Connection
      const connectionResult = await checkSupabaseConnection();
      setIsConnected(connectionResult.connected);
      finalStatus.connected = connectionResult.connected;

      if (!connectionResult.connected) {
        setConnectionError(connectionResult.error || 'Erro desconhecido ao conectar.');
        finalStatus.connectionError = connectionResult.error || 'Erro desconhecido ao conectar.';
      } else {
        // 2. Check Tables (only if connected)
        const tablesResult = await checkTablesExist();
        setTablesStatus(tablesResult);
        finalStatus.tables = tablesResult;
      }
    } catch (err: any) {
      console.error('Error during database status check:', err);
      setConnectionError(`Erro inesperado durante a verificação: ${err.message}`);
      finalStatus.connectionError = `Erro inesperado durante a verificação: ${err.message}`;
    } finally {
      setIsChecking(false);
      if (onStatusChange) {
        onStatusChange(finalStatus);
      }
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-4 bg-muted-light dark:bg-muted-dark rounded-md border border-border-light dark:border-border-dark mb-4">
        <Spinner size="sm" className="mr-2" />
        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Verificando status do banco de dados...</span>
      </div>
    );
  }

  // Display Connection Error First
  if (isConnected === false) {
    return (
      <Alert
        type="error"
        message={
          <>
            <strong>Erro de Conexão:</strong> {connectionError || 'Não foi possível conectar ao banco de dados.'}
            <div className="mt-1 text-sm">Verifique as variáveis de ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) no arquivo `.env`, a configuração do Vite e sua conexão com a internet.</div>
          </>
        }
      />
    );
  }

  // Display Table Errors if Connected but tables have issues
  const tableErrors: string[] = [];
  if (tablesStatus?.batches?.error) tableErrors.push(tablesStatus.batches.error);
  if (tablesStatus?.cpf_records?.error) tableErrors.push(tablesStatus.cpf_records.error);

  if (tableErrors.length > 0) {
    return (
      <Alert
        type="warning"
        message={
          <>
            <strong>Atenção: Problemas com as Tabelas do Banco de Dados</strong>
            <ul className="list-disc list-inside mt-1 text-sm">
              {tableErrors.map((err, index) => <li key={index}>{err}</li>)}
            </ul>
            <div className="mt-2 text-sm">
              A conexão com o banco de dados foi bem-sucedida, mas algumas tabelas estão ausentes ou inacessíveis.
              Verifique se as migrações do Supabase foram executadas corretamente e se as políticas de segurança (RLS) permitem o acesso.
              Funcionalidades que dependem dessas tabelas podem não funcionar.
            </div>
          </>
        }
      />
    );
  }

  // Optionally, show a success message if everything is okay (can be removed if not needed)
  // if (isConnected === true && tableErrors.length === 0) {
  //   return (
  //     <Alert type="success" message="Conexão com o banco de dados e tabelas verificadas com sucesso." />
  //   );
  // }

  return null; // Render nothing if connected and tables are okay
};

export default DatabaseStatusChecker;
