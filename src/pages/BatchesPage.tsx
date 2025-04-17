import React, { useState, useEffect } from 'react';
import { supabase, Batch, checkSupabaseConnection } from '../utils/supabase';
import { Play, Pause, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, AlertTriangle, List, Eye } from 'lucide-react'; // Added Eye icon
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Dialog from '../components/ui/Dialog';
import { usePagination } from '../hooks/usePagination';

interface BatchesPageProps {
  onViewDetails: (batchId: string) => void; // Callback to navigate
}

const BatchesPage: React.FC<BatchesPageProps> = ({ onViewDetails }) => { // Accept prop
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDeleteId, setBatchToDeleteId] = useState<string | null>(null);

  const { currentPage, totalPages, paginatedData, setPage } = usePagination(batches, 5);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionError(false);

    try {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setConnectionError(true);
        throw new Error('Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente.');
      }

      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.batches" does not exist')) {
           setError('A tabela "batches" não foi encontrada no banco de dados. Verifique se as migrações foram executadas.');
        } else {
          throw error;
        }
        setBatches([]);
      } else {
        setBatches(data || []);
      }

    } catch (err: any) {
      console.error('Error fetching batches:', err);
      if (!error) {
        setError(`Erro ao carregar os lotes: ${err.message || 'Por favor, tente novamente.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBatch = async (id: string) => {
    console.log('Start batch:', id);
    setError('Funcionalidade de iniciar lote ainda não implementada.');
  };

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
    try {
      const { error: deleteError } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchToDeleteId);

      if (deleteError) throw deleteError;
      setBatches(prevBatches => prevBatches.filter(batch => batch.id !== batchToDeleteId));
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
      case 'pending':
        themeClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        icon = <Clock className="h-3 w-3 mr-1" />;
        text = "Pendente";
        break;
      case 'processing':
        themeClasses = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
        icon = <RefreshCw className="h-3 w-3 mr-1 animate-spin" />;
        text = "Processando";
        break;
      case 'completed':
        themeClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        icon = <CheckCircle className="h-3 w-3 mr-1" />;
        text = "Concluído";
        break;
      case 'paused':
        themeClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        icon = <Pause className="h-3 w-3 mr-1" />;
        text = "Pausado";
        break;
      case 'error':
        themeClasses = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
        text = "Erro";
        break;
      default:
        themeClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
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

        {connectionError && !isLoading && <Alert type="error" message="Não foi possível conectar ao banco de dados..." />}
        {error && !isLoading && <Alert type="error" message={error} />}

        {isLoading ? (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-3 text-text-secondary-light dark:text-text-secondary-dark">Carregando lotes...</p>
          </div>
        ) : !connectionError && !error && batches.length === 0 ? (
          <div className="text-center py-12 bg-muted-light dark:bg-muted-dark rounded-lg border border-border-light dark:border-border-dark">
            <AlertCircle className="h-12 w-12 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-4" />
            <p className="text-text-primary-light dark:text-text-primary-dark">Nenhum lote encontrado.</p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2">Faça upload de um arquivo Excel na tela de Upload para criar um novo lote.</p>
          </div>
        ) : !connectionError && !error && batches.length > 0 ? (
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
                    <div className="flex space-x-2">
                       {/* View Details Button */}
                       <button
                         onClick={() => onViewDetails(batch.id)}
                         className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transition-colors"
                         title="Visualizar detalhes"
                       >
                         <Eye className="h-5 w-5" />
                       </button>
                      {/* Start/Pause Buttons */}
                      {batch.status === 'pending' || batch.status === 'paused' ? (
                        <button onClick={() => handleStartBatch(batch.id)} className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 focus:outline-none transition-colors" title="Iniciar processamento">
                          <Play className="h-5 w-5" />
                        </button>
                      ) : batch.status === 'processing' ? (
                        <button onClick={() => handlePauseBatch(batch.id)} className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 focus:outline-none transition-colors" title="Pausar processamento">
                          <Pause className="h-5 w-5" />
                        </button>
                      ) : ( <div className="w-7"></div> /* Placeholder */ )}
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
