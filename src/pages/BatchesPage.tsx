import React, { useState, useEffect } from 'react';
import { supabase, Batch, checkSupabaseConnection } from '../utils/supabase';
import { Play, Pause, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, AlertTriangle, List, Eye } from 'lucide-react';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Dialog from '../components/ui/Dialog';
import { usePagination } from '../hooks/usePagination';

interface BatchesPageProps {
  onViewDetails: (batchId: string) => void; // Callback to navigate
}

// Define the webhook URL
const JOB_WEBHOOK_URL = 'https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/job-consulta';

const BatchesPage: React.FC<BatchesPageProps> = ({ onViewDetails }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading batches list
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // For success feedback
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDeleteId, setBatchToDeleteId] = useState<string | null>(null);
  const [startingJobId, setStartingJobId] = useState<string | null>(null); // Track which job is starting

  const { currentPage, totalPages, paginatedData, setPage } = usePagination(batches, 5);

  useEffect(() => {
    fetchBatches();
  }, []);

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


  const fetchBatches = async () => {
    setIsLoading(true);
    // Don't clear action errors immediately on refresh
    // setError(null);
    // setSuccessMessage(null);
    setConnectionError(false);

    try {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setConnectionError(true);
        throw new Error('Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente.');
      }

      const { data, error: fetchError } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        if (fetchError.message.includes('relation "public.batches" does not exist')) {
           setError('A tabela "batches" não foi encontrada no banco de dados. Verifique se as migrações foram executadas.');
        } else {
          throw fetchError;
        }
        setBatches([]);
      } else {
        setBatches(data || []);
      }

    } catch (err: any) {
      console.error('Error fetching batches:', err);
      if (!error) { // Avoid overwriting specific errors
        setError(`Erro ao carregar os lotes: ${err.message || 'Por favor, tente novamente.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Start Job Function ---
  const handleStartJob = async (batchId: string) => {
    setStartingJobId(batchId); // Set loading state for this specific batch
    setError(null);
    setSuccessMessage(null);

    console.log(`Attempting to start job for batch: ${batchId}`);

    try {
      const response = await fetch(JOB_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'api',
          batch_id: batchId,
        }),
      });

      console.log('Webhook response status:', response.status);

      if (!response.ok) {
        // Attempt to read error details from response body
        let errorBody = 'Erro desconhecido do webhook.';
        try {
            const body = await response.json();
            errorBody = body.message || JSON.stringify(body);
        } catch (e) {
            // If body is not JSON or empty
            errorBody = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(`Falha ao chamar o webhook. ${errorBody}`);
      }

      // Optional: Read success response if needed
      // const responseData = await response.json();
      // console.log('Webhook success response:', responseData);

      setSuccessMessage(`Tarefa para o lote ${batchId.substring(0, 8)}... iniciada com sucesso. O status será atualizado em breve.`);
      // Note: We don't update the status locally here.
      // The webhook should trigger the status update in the database.
      // A subsequent fetchBatches() or real-time subscription will reflect the change.
      // Optionally trigger a refresh after a short delay:
      // setTimeout(fetchBatches, 2000);


    } catch (err: any) {
      console.error('Error starting job via webhook:', err);
      setError(`Erro ao iniciar a tarefa: ${err.message}`);
    } finally {
      setStartingJobId(null); // Clear loading state for this batch
    }
  };
  // --- End Start Job Function ---


  const handlePauseBatch = async (id: string) => {
    console.log('Pause batch:', id);
    setError('Funcionalidade de pausar lote ainda não implementada.');
  };

  const handleDeleteBatch = (id: string) => {
    setBatchToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDeleteId) return;
    setError(null);
    setSuccessMessage(null);
    try {
      const { error: deleteError } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchToDeleteId);

      if (deleteError) throw deleteError;
      setBatches(prevBatches => prevBatches.filter(batch => batch.id !== batchToDeleteId));
      setSuccessMessage(`Lote ${batchToDeleteId.substring(0,8)}... excluído.`);
    } catch (err: any) {
      console.error('Error deleting batch:', err);
      setError(`Erro ao excluir o lote: ${err.message || 'Tente novamente.'}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setBatchToDeleteId(null);
    }
  };

  const getStatusBadge = (status: Batch['status']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    let themeClasses = "";
    let icon = null;
    let text = "Desconhecido";

    switch (status) {
      case 'Pendente':
        themeClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700";
        icon = <Clock className="h-3 w-3 mr-1" />;
        text = "Pendente";
        break;
      case 'Em execução':
        themeClasses = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700";
        icon = <RefreshCw className="h-3 w-3 mr-1 animate-spin" />;
        text = "Em execução";
        break;
      case 'Finalizado':
        themeClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-300 dark:border-green-700";
        icon = <CheckCircle className="h-3 w-3 mr-1" />;
        text = "Finalizado";
        break;
      case 'Pausado':
        themeClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600";
        icon = <Pause className="h-3 w-3 mr-1" />;
        text = "Pausado";
        break;
      case 'Erro':
        themeClasses = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-300 dark:border-red-700";
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
        text = "Erro";
        break;
      default:
        themeClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        text = status; // Display unknown status directly
        break;
    }
    return <span className={`${baseClasses} ${themeClasses}`}>{icon}{text}</span>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Data inválida'; }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 mb-6 border border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center">
            <List className="mr-2 h-6 w-6 text-primary-light dark:text-primary-dark" />
            Lotes de Processamento
          </h1>
          <button
            onClick={fetchBatches}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Display feedback messages */}
        {connectionError && !isLoading && <Alert type="error" message="Não foi possível conectar ao banco de dados..." />}
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}


        {isLoading ? (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-3 text-text-secondary-light dark:text-text-secondary-dark">Carregando lotes...</p>
          </div>
        ) : !connectionError && batches.length === 0 ? ( // Simplified condition
          <div className="text-center py-12 bg-muted-light dark:bg-muted-dark rounded-lg border border-border-light dark:border-border-dark">
            <AlertCircle className="h-12 w-12 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-4" />
            <p className="text-text-primary-light dark:text-text-primary-dark">Nenhum lote encontrado.</p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2">Faça upload de um arquivo Excel na tela de Upload para criar um novo lote.</p>
          </div>
        ) : !connectionError && batches.length > 0 ? ( // Simplified condition
          <>
            <Table headers={['NOME', 'API', 'ARQUIVO', 'CPFs (V/I)', 'STATUS', 'CRIADO EM', 'AÇÕES']}>
              {paginatedData.map((batch) => (
                <tr key={batch.id} className="hover:bg-muted-light dark:hover:bg-muted-dark transition-colors duration-150">
                  {/* Make name clickable */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-light dark:text-primary-dark hover:underline cursor-pointer max-w-[200px] truncate" title={batch.name} onClick={() => onViewDetails(batch.id)}>
                    {batch.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {batch.bank_api || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-[150px] truncate" title={batch.filename}>
                    {batch.filename || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {batch.total_cpfs || 0}
                    <span className="text-xs ml-1">
                      (<span className="text-green-600 dark:text-green-400">{batch.valid_cpfs || 0}</span>
                      /
                      <span className="text-red-600 dark:text-red-400">{batch.invalid_cpfs || 0}</span>)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(batch.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {formatDate(batch.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <div className="flex space-x-2 items-center"> {/* Use items-center */}
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
                          disabled={startingJobId === batch.id} // Disable while starting this specific job
                          className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-wait" // Add cursor-wait
                          title="Iniciar processamento"
                        >
                          {startingJobId === batch.id ? <Spinner size="sm" color="blue" /> : <Play className="h-5 w-5" />}
                        </button>
                      ) : batch.status === 'Em execução' ? (
                        <button onClick={() => handlePauseBatch(batch.id)} className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 focus:outline-none transition-colors" title="Pausar processamento">
                          <Pause className="h-5 w-5" />
                        </button>
                      ) : ( <div className="w-7 h-7"></div> /* Placeholder for alignment */ )}
                      {/* Delete Button */}
                      <button onClick={() => handleDeleteBatch(batch.id)} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none transition-colors" title="Excluir lote">
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
      </div>
      <Dialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={confirmDeleteBatch} title="Confirmar Exclusão" confirmText="Excluir" confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600">
        <p>Tem certeza que deseja excluir este lote?</p>
        <p className="mt-2 font-medium text-red-600 dark:text-red-400">Esta ação não pode ser desfeita.</p>
      </Dialog>
    </div>
  );
};

export default BatchesPage;
