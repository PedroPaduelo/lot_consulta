import React, { useState, useEffect } from 'react';
import { supabase, Batch, checkSupabaseConnection } from '../utils/supabase';
import { Play, Pause, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { usePagination } from '../hooks/usePagination';

const BatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  // Use pagination hook
  const { currentPage, totalPages, paginatedData, setPage } = usePagination(batches, 5);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionError(false);
    
    try {
      // Check connection first
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
        throw error;
      }
      
      setBatches(data || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Erro ao carregar os lotes. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBatch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ status: 'processing' })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setBatches(prev => prev.map(batch => 
        batch.id === id ? { ...batch, status: 'processing' } : batch
      ));
    } catch (err) {
      console.error('Error starting batch:', err);
      setError('Erro ao iniciar o processamento do lote.');
    }
  };

  const handlePauseBatch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ status: 'paused' })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setBatches(prev => prev.map(batch => 
        batch.id === id ? { ...batch, status: 'paused' } : batch
      ));
    } catch (err) {
      console.error('Error pausing batch:', err);
      setError('Erro ao pausar o processamento do lote.');
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setBatches(prev => prev.filter(batch => batch.id !== id));
    } catch (err) {
      console.error('Error deleting batch:', err);
      setError('Erro ao excluir o lote.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Processando
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Pause className="h-3 w-3 mr-1" />
            Pausado
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Desconhecido
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Lotes de Processamento</h1>
          <button
            onClick={fetchBatches}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </button>
        </div>

        {connectionError && (
          <Alert 
            type="error" 
            message="Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente." 
          />
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <Spinner size="lg" />
            <p className="mt-2 text-gray-600">Carregando lotes...</p>
          </div>
        ) : error ? (
          <Alert type="error" message={error} />
        ) : batches.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum lote encontrado.</p>
            <p className="text-gray-500 text-sm mt-2">Faça upload de um arquivo Excel para criar um novo lote.</p>
          </div>
        ) : (
          <>
            <Table headers={['NOME', 'API', 'ARQUIVO', 'TOTAL CPFs', 'STATUS', 'DATA', 'AÇÕES']}>
              {paginatedData.map((batch) => (
                <tr key={batch.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {batch.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {batch.bank_api}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate">
                    {batch.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {batch.total_cpfs}
                    {batch.valid_cpfs > 0 && (
                      <span className="ml-1 text-xs text-green-600">({batch.valid_cpfs} válidos)</span>
                    )}
                    {batch.invalid_cpfs > 0 && (
                      <span className="ml-1 text-xs text-red-600">({batch.invalid_cpfs} inválidos)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(batch.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(batch.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {batch.status === 'pending' || batch.status === 'paused' ? (
                        <button
                          onClick={() => handleStartBatch(batch.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                          title="Iniciar processamento"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                      ) : batch.status === 'processing' ? (
                        <button
                          onClick={() => handlePauseBatch(batch.id)}
                          className="p-1 text-yellow-600 hover:text-yellow-800 focus:outline-none"
                          title="Pausar processamento"
                        >
                          <Pause className="h-5 w-5" />
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                        title="Excluir lote"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BatchesPage;
