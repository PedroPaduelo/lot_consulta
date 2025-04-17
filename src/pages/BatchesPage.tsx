import React, { useState, useEffect } from 'react';
import { supabase, Batch, checkSupabaseConnection, checkTablesExist } from '../utils/supabase'; // Import checkTablesExist
import { Play, Pause, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, AlertTriangle, List, Eye } from 'lucide-react';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Dialog from '../components/ui/Dialog';
import { usePagination } from '../hooks/usePagination';
import StatusProcessingBadge from '../components/ui/StatusProcessingBadge'; // Import the correct badge
import DatabaseStatusChecker from '../components/DatabaseStatusChecker'; // Import checker

interface BatchesPageProps {
  onViewDetails: (batchId: string) => void; // Callback to navigate
}

// Define the webhook URL
const JOB_WEBHOOK_URL = 'https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/job-consulta';
// Define the pause webhook URL (assuming a similar pattern)
const PAUSE_WEBHOOK_URL = 'https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/pause-job'; // Placeholder URL

// Define the type for the database status state
type DbStatus = {
  connected: boolean;
  connectionError?: string;
  tables: {
    batches: { exists: boolean; error?: string };
    cpf_records: { exists: boolean; error?: string };
  } | null;
};

const BatchesPage: React.FC<BatchesPageProps> = ({ onViewDetails }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading batches list
  const [error, setError] = useState<string | null>(null); // Action/fetch errors
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // For success feedback
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null); // Combined DB status
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDeleteId, setBatchToDeleteId] = useState<string | null>(null);
  const [startingJobId, setStartingJobId] = useState<string | null>(null); // Track which job is starting
  const [pausingJobId, setPausingJobId] = useState<string | null>(null); // Track which job is pausing

  const { currentPage, totalPages, paginatedData, setPage } = usePagination(batches, 5);

  // Fetch batches when dbStatus indicates connection and tables are ready
  useEffect(() => {
    if (dbStatus?.connected && dbStatus.tables?.batches.exists) {
      fetchBatches();
    } else if (dbStatus) {
      // If dbStatus is set but not ready, stop loading and clear batches
      setIsLoading(false);
      setBatches([]);
      // Error messages are handled by DatabaseStatusChecker
    }
  }, [dbStatus]); // Depend on dbStatus

  // Clear success/error messages after a delay
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Callback for DatabaseStatusChecker
  const handleDatabaseStatusChange = (status: DbStatus) => {
    setDbStatus(status);
    // Clear previous fetch errors when status changes
    setError(null);
  };

  const fetchBatches = async () => {
    // Only proceed if DB is connected and table exists (checked by useEffect dependency)
    if (!dbStatus?.connected || !dbStatus.tables?.batches.exists) {
      setIsLoading(false); // Ensure loading stops if called prematurely
      return;
    }

    setIsLoading(true);
    // Don't clear action errors immediately on refresh
    // setError(null);
    // setSuccessMessage(null);

    try {
      // Select all columns including the new id_execucao
      const { data, error: fetchError } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Specific errors should have been caught by checkTablesExist,
        // but handle potential runtime errors during fetch
        throw fetchError;
      }
      setBatches(data || []);
      setError(null); // Clear previous fetch errors on success

    } catch (err: any) {
      console.error('Error fetching batches:', err);
      setError(`Erro ao carregar os lotes: ${err.message || 'Por favor, tente novamente.'}`);
      setBatches([]); // Clear batches on error
    } finally {
      setIsLoading(false);
    }
  };

  // --- Start Job Function ---
  const handleStartJob = async (batchId: string) => {
    setStartingJobId(batchId);
    setError(null);
    setSuccessMessage(null);

    console.log(`Attempting to start job for batch: ${batchId}`);

    try {
      const response = await fetch(JOB_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'api', batch_id: batchId }),
      });

      console.log('Start Webhook response status:', response.status);
      if (!response.ok) {
        let errorBody = `Erro ${response.status}: ${response.statusText}`;
        try { errorBody = (await response.json()).message || JSON.stringify(await response.json()); } catch (e) { /* ignore */ }
        throw new Error(`Falha ao chamar o webhook de início. ${errorBody}`);
      }

      setSuccessMessage(`Tarefa para o lote ${batchId.substring(0, 8)}... iniciada. O status será atualizado.`);
      // Optionally trigger a refresh after a short delay to potentially catch the status update
      setTimeout(fetchBatches, 3000); // Refresh after 3s

    } catch (err: any) {
      console.error('Error starting job via webhook:', err);
      setError(`Erro ao iniciar a tarefa: ${err.message}`);
    } finally {
      setStartingJobId(null);
    }
  };
  // --- End Start Job Function ---

  // --- Pause Job Function ---
  const handlePauseBatch = async (batchId: string, executionId: string | null) => {
    if (!executionId) {
        setError(`Não é possível pausar o lote ${batchId.substring(0,8)}...: ID de execução não encontrado.`);
        return;
    }

    setPausingJobId(batchId); // Use a separate state for pausing
    setError(null);
    setSuccessMessage(null);

    console.log(`Attempting to pause job for batch: ${batchId} with execution ID: ${executionId}`);

    try {
      // *** Replace PAUSE_WEBHOOK_URL with the actual endpoint ***
      const response = await fetch(PAUSE_WEBHOOK_URL, { // Use the correct pause webhook URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // *** Adjust payload according to the pause API requirements ***
        body: JSON.stringify({
          // Assuming the pause API needs the execution ID
          id_execucao: executionId,
          // Add any other required fields for the pause API
          // tipo: 'pause', // Example
        }),
      });

      console.log('Pause Webhook response status:', response.status);

      if (!response.ok) {
        let errorBody = `Erro ${response.status}: ${response.statusText}`;
        try { errorBody = (await response.json()).message || JSON.stringify(await response.json()); } catch (e) { /* ignore */ }
        throw new Error(`Falha ao chamar o webhook de pausa. ${errorBody}`);
      }

      setSuccessMessage(`Solicitação para pausar o lote ${batchId.substring(0, 8)}... enviada. O status será atualizado.`);
      // Optionally trigger a refresh after a short delay
      setTimeout(fetchBatches, 3000); // Refresh after 3s

    } catch (err: any) {
      console.error('Error pausing job via webhook:', err);
      setError(`Erro ao pausar a tarefa: ${err.message}`);
    } finally {
      setPausingJobId(null); // Clear pausing state
    }
  };
  // --- End Pause Job Function ---


  const handleDeleteBatch = (id: string) => {
    setBatchToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDeleteId) return;
    setError(null);
    setSuccessMessage(null);
    try {
      // Attempt to delete associated CPF records first (optional, depends on CASCADE)
      // const { error: cpfDeleteError } = await supabase
      //   .from('cpf_records')
      //   .delete()
      //   .eq('batch_id', batchToDeleteId);
      // if (cpfDeleteError) throw new Error(`Erro ao excluir registros CPF: ${cpfDeleteError.message}`);

      // Delete the batch itself
      const { error: deleteError } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchToDeleteId);

      if (deleteError) throw deleteError;

      setBatches(prevBatches => prevBatches.filter(batch => batch.id !== batchToDeleteId));
      setSuccessMessage(`Lote ${batchToDeleteId.substring(0,8)}... excluído.`);
      // Reset pagination if the deleted item was the last on the page
      if (paginatedData.length === 1 && currentPage > 1) {
        setPage(currentPage - 1);
      }

    } catch (err: any) {
      console.error('Error deleting batch:', err);
      setError(`Erro ao excluir o lote: ${err.message || 'Tente novamente.'}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setBatchToDeleteId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Data inválida'; }
  };

  // Determine if actions should be disabled (DB issues or loading)
  const actionsDisabled = isLoading || !dbStatus?.connected || !dbStatus.tables?.batches.exists;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Database Status Checker will render its own Alerts */}
      <DatabaseStatusChecker onStatusChange={handleDatabaseStatusChange} />

      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 mb-6 border border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center">
            <List className="mr-2 h-6 w-6 text-primary-light dark:text-primary-dark" />
            Lotes de Processamento
          </h1>
          <button
            onClick={fetchBatches}
            disabled={actionsDisabled} // Disable if loading or DB issues
            className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Display action feedback messages */}
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}


        {isLoading && !batches.length ? ( // Show loading spinner only if loading initial data
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-3 text-text-secondary-light dark:text-text-secondary-dark">Carregando lotes...</p>
          </div>
        ) : !isLoading && dbStatus?.connected && dbStatus.tables?.batches.exists && batches.length === 0 ? ( // Show no batches message only if connected and table exists
          <div className="text-center py-12 bg-muted-light dark:bg-muted-dark rounded-lg border border-border-light dark:border-border-dark">
            <AlertCircle className="h-12 w-12 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-4" />
            <p className="text-text-primary-light dark:text-text-primary-dark">Nenhum lote encontrado.</p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2">Faça upload de um arquivo Excel na tela de Upload para criar um novo lote.</p>
          </div>
        ) : dbStatus?.connected && dbStatus.tables?.batches.exists && batches.length > 0 ? ( // Show table only if connected, table exists, and batches are loaded
          <>
            {/* Updated Table Headers */}
            <Table headers={['NOME', 'API', 'ARQUIVO', 'CPFs (V/I)', 'ID EXECUÇÃO', 'STATUS', 'CRIADO EM', 'AÇÕES']}>
              {paginatedData.map((batch) => (
                <tr key={batch.id} className="hover:bg-muted-light dark:hover:bg-muted-dark transition-colors duration-150">
                  {/* Name */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-light dark:text-primary-dark hover:underline cursor-pointer max-w-[180px] truncate" title={batch.name} onClick={() => onViewDetails(batch.id)}>
                    {batch.name}
                  </td>
                  {/* API */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {batch.bank_api || '-'}
                  </td>
                  {/* Filename */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-[120px] truncate" title={batch.filename}>
                    {batch.filename || '-'}
                  </td>
                  {/* CPF Counts */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {batch.total_cpfs || 0}
                    <span className="text-xs ml-1">
                      (<span className="text-green-600 dark:text-green-400">{batch.valid_cpfs || 0}</span>
                      /
                      <span className="text-red-600 dark:text-red-400">{batch.invalid_cpfs || 0}</span>)
                    </span>
                  </td>
                  {/* Execution ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark font-mono text-xs max-w-[100px] truncate" title={batch.id_execucao ?? undefined}>
                    {batch.id_execucao || '-'}
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusProcessingBadge status={batch.status} size="sm"/> {/* Use StatusProcessingBadge */}
                  </td>
                  {/* Created At */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {formatDate(batch.created_at)}
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <div className="flex space-x-2 items-center">
                       {/* View Details Button */}
                       <button
                         onClick={() => onViewDetails(batch.id)}
                         className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transition-colors"
                         title="Visualizar detalhes"
                       >
                         <Eye className="h-5 w-5" />
                       </button>
                      {/* Start/Pause Buttons */}
                      {batch.status === 'Pendente' || batch.status === 'Pausado' ? (
                        <button
                          onClick={() => handleStartJob(batch.id)}
                          disabled={startingJobId === batch.id || pausingJobId === batch.id || actionsDisabled} // Disable if starting, pausing or general actions disabled
                          className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-wait"
                          title="Iniciar processamento"
                        >
                          {startingJobId === batch.id ? <Spinner size="sm" color="blue" /> : <Play className="h-5 w-5" />}
                        </button>
                      ) : batch.status === 'Em execução' ? (
                        <button
                            onClick={() => handlePauseBatch(batch.id, batch.id_execucao)}
                            disabled={pausingJobId === batch.id || startingJobId === batch.id || !batch.id_execucao || actionsDisabled} // Disable if pausing, starting, no execution ID or general actions disabled
                            className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-wait"
                            title={!batch.id_execucao ? "ID de execução não disponível para pausar" : "Pausar processamento"}
                        >
                          {pausingJobId === batch.id ? <Spinner size="sm" color="yellow" /> : <Pause className="h-5 w-5" />}
                        </button>
                      ) : ( <div className="w-7 h-7"></div> /* Placeholder for alignment */ )}
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        disabled={startingJobId === batch.id || pausingJobId === batch.id || actionsDisabled} // Disable if any action is in progress or general actions disabled
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none transition-colors disabled:opacity-50"
                        title="Excluir lote"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />}
          </>
        ) : null}
        {/* Message when DB connection/table check failed */}
        {!isLoading && (!dbStatus?.connected || !dbStatus.tables?.batches.exists) && (
            <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
                Não é possível exibir os lotes. Verifique o status do banco de dados acima.
            </div>
        )}
      </div>
      <Dialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={confirmDeleteBatch} title="Confirmar Exclusão" confirmText="Excluir" confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600">
        <p>Tem certeza que deseja excluir este lote?</p>
        <p className="mt-1 text-sm">Todos os registros de CPF associados também serão excluídos (se a exclusão em cascata estiver configurada no banco de dados).</p>
        <p className="mt-2 font-medium text-red-600 dark:text-red-400">Esta ação não pode ser desfeita.</p>
      </Dialog>
    </div>
  );
};

export default BatchesPage;
