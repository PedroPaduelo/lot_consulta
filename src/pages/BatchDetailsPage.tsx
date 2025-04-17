import React, { useState, useEffect } from 'react';
import { supabase, Batch, CPFRecord as DbCPFRecord } from '../utils/supabase';
import { ArrowLeft, FileText, Database, Calendar, CheckSquare, XSquare, Hash, User, Phone, ListFilter, Eye } from 'lucide-react'; // Added Eye
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import StatusBadge from '../components/ui/StatusBadge'; // For initial CPF validity
import StatusProcessingBadge from '../components/ui/StatusProcessingBadge'; // For processing status
import CPFResultModal from '../components/CPFResultModal'; // Import the modal
import { usePagination } from '../hooks/usePagination';
import { formatCPF } from '../utils/validators'; // Import formatCPF

// Extend the interface for display purposes
export interface DisplayCPFRecord extends DbCPFRecord { // Export if needed elsewhere
  isValid: boolean; // Keep the initial validation result if needed, or remove if only processing status matters now
}

interface BatchDetailsPageProps {
  batchId: string;
  onBack: () => void;
}

const BatchDetailsPage: React.FC<BatchDetailsPageProps> = ({ batchId, onBack }) => {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [cpfRecords, setCpfRecords] = useState<DisplayCPFRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [isResultModalOpen, setIsResultModalOpen] = useState(false); // State for modal
  const [selectedCpfRecord, setSelectedCpfRecord] = useState<DisplayCPFRecord | null>(null); // State for selected CPF

  // Filter CPF records based on the selected *initial validation* filter
  const filteredCpfRecords = React.useMemo(() => {
    if (filter === 'valid') {
      return cpfRecords.filter(cpf => cpf.isValid); // Filter by initial is_valid
    }
    if (filter === 'invalid') {
      return cpfRecords.filter(cpf => !cpf.isValid); // Filter by initial is_valid
    }
    return cpfRecords;
  }, [cpfRecords, filter]);

  // Use pagination hook on filtered data
  const { currentPage, totalPages, paginatedData, setPage } = usePagination(filteredCpfRecords, 10);

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    setIsLoading(true);
    setError(null);
    setBatch(null);
    setCpfRecords([]);

    try {
      // Fetch Batch Info
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw new Error(`Erro ao buscar detalhes do lote: ${batchError.message}`);
      if (!batchData) throw new Error('Lote não encontrado.');
      setBatch(batchData);

      // Fetch CPF Records for the batch (including status and result)
      const { data: cpfData, error: cpfError } = await supabase
        .from('cpf_records')
        .select('*') // Select all columns including status and result
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (cpfError) {
        console.error('Erro ao buscar registros de CPF:', cpfError);
        setError('Erro ao buscar os registros de CPF associados a este lote.');
      } else {
         const displayData: DisplayCPFRecord[] = (cpfData || []).map(record => ({
            ...record,
            isValid: record.is_valid // Map is_valid to isValid for potential filtering/display
         }));
         setCpfRecords(displayData);
      }

    } catch (err: any) {
      console.error('Error fetching batch details:', err);
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Data inválida'; }
  };

  // Function to open the result modal
  const handleViewResult = (cpfRecord: DisplayCPFRecord) => {
    setSelectedCpfRecord(cpfRecord);
    setIsResultModalOpen(true);
  };

  // Helper to render detail items
  const DetailItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{label}</p>
        <p className="font-medium text-text-primary-light dark:text-text-primary-dark break-words">{value || '-'}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Spinner size="lg" />
        <p className="mt-3 text-text-secondary-light dark:text-text-secondary-dark">Carregando detalhes do lote...</p>
      </div>
    );
  }

  if (error && !batch) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="space-y-6">
       {/* Back Button and Title */}
       <div className="flex items-center mb-4">
         <button
           onClick={onBack}
           className="p-2 rounded-md hover:bg-muted-light dark:hover:bg-muted-dark text-text-secondary-light dark:text-text-secondary-dark mr-3"
           title="Voltar para a lista de lotes"
         >
           <ArrowLeft className="h-5 w-5" />
         </button>
         <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
           Detalhes do Lote
         </h1>
       </div>

      {/* Batch Details Card */}
      {batch && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 border border-border-light dark:border-border-dark">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-5">{batch.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <DetailItem icon={FileText} label="Nome do Arquivo" value={batch.filename} />
            <DetailItem icon={Database} label="API Banco" value={batch.bank_api} />
            {/* Use StatusProcessingBadge for Batch Status */}
            <div className="flex items-start space-x-3">
                <ListFilter className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Status Processamento</p>
                    <div className="mt-1"> {/* Add margin top for badge */}
                        <StatusProcessingBadge status={batch.status} />
                    </div>
                </div>
            </div>
            <DetailItem icon={Hash} label="Total CPFs" value={batch.total_cpfs} />
            <DetailItem icon={CheckSquare} label="CPFs Válidos (Inicial)" value={batch.valid_cpfs} />
            <DetailItem icon={XSquare} label="CPFs Inválidos (Inicial)" value={batch.invalid_cpfs} />
            <DetailItem icon={Calendar} label="Criado em" value={formatDate(batch.created_at)} />
            <DetailItem icon={Calendar} label="Atualizado em" value={formatDate(batch.updated_at)} />
          </div>
        </div>
      )}

      {/* CPF Records Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 border border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Registros de CPF ({filteredCpfRecords.length})</h2>
            {/* Filter Buttons (still filter by initial validation) */}
            <div className="flex space-x-2">
                 <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark self-center mr-2">Filtrar por validação inicial:</span>
                <button
                    onClick={() => { setFilter('all'); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'all' ? 'bg-primary-light dark:bg-primary-dark text-white' : 'bg-muted-light dark:bg-muted-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => { setFilter('valid'); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'valid' ? 'bg-green-600 text-white' : 'bg-muted-light dark:bg-muted-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    Válidos
                </button>
                <button
                    onClick={() => { setFilter('invalid'); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'invalid' ? 'bg-red-600 text-white' : 'bg-muted-light dark:bg-muted-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    Inválidos
                </button>
            </div>
        </div>

        {error && batch && <Alert type="warning" message={error} />}

        {cpfRecords.length === 0 && !error && (
             <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-6">Nenhum registro de CPF encontrado para este lote.</p>
        )}

        {filteredCpfRecords.length > 0 && (
          <>
            {/* Updated Table Headers */}
            <Table headers={['CPF', 'NOME', 'STATUS VALIDAÇÃO', 'STATUS PROCESSAMENTO', 'AÇÕES']}>
              {paginatedData.map((record) => (
                <tr key={record.id} className={`hover:bg-muted-light dark:hover:bg-muted-dark transition-colors duration-150 ${!record.isValid ? 'opacity-70' : ''}`}> {/* Maybe just dim invalid ones? */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark font-mono">
                    {formatCPF(record.cpf)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {record.nome}
                  </td>
                  {/* Initial Validation Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge isValid={record.isValid} />
                  </td>
                   {/* Processing Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusProcessingBadge status={record.status} size="sm" />
                  </td>
                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                     <button
                        onClick={() => handleViewResult(record)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Visualizar resultado"
                        disabled={!record.result} // Disable if no result
                      >
                        <Eye className="h-5 w-5" />
                      </button>
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
         {filteredCpfRecords.length === 0 && cpfRecords.length > 0 && filter !== 'all' && (
             <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-6">Nenhum CPF com validação inicial '{filter === 'valid' ? 'Válido' : 'Inválido'}' encontrado neste lote.</p>
         )}
      </div>

      {/* Render the CPF Result Modal */}
      <CPFResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        cpfRecord={selectedCpfRecord}
      />
    </div>
  );
};

export default BatchDetailsPage;
