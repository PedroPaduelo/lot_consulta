import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { supabase, Batch, CPFRecord as DbCPFRecord } from '../utils/supabase';
import { ArrowLeft, FileText, Database, Calendar, CheckSquare, XSquare, Hash, ListFilter, Eye, Percent, Download, Filter } from 'lucide-react'; // Added Filter icon
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import StatusBadge from '../components/ui/StatusBadge'; // For initial CPF validity
import StatusProcessingBadge from '../components/ui/StatusProcessingBadge'; // For processing status
import CPFResultModal from '../components/CPFResultModal'; // Import the modal
import ExportModal from '../components/ExportModal'; // Import the Export modal
import { usePagination } from '../hooks/usePagination';
import { formatCPF } from '../utils/validators'; // Import formatCPF
import * as XLSX from 'xlsx'; // Import xlsx library

// Extend the interface for display purposes
export interface DisplayCPFRecord extends DbCPFRecord { // Export if needed elsewhere
  isValid: boolean; // Keep the initial validation result if needed, or remove if only processing status matters now
}

// Define possible statuses for filtering export
type CPFStatusFilter = DbCPFRecord['status'] | 'all';

interface BatchDetailsPageProps {
  batchId: string;
  onBack: () => void;
}

const POLLING_INTERVAL_MS = 5000; // Check every 5 seconds

const BatchDetailsPage: React.FC<BatchDetailsPageProps> = ({ batchId, onBack }) => {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [cpfRecords, setCpfRecords] = useState<DisplayCPFRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all'); // Table filter (initial validation)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedCpfRecord, setSelectedCpfRecord] = useState<DisplayCPFRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false); // State for export loading
  const [exportError, setExportError] = useState<string | null>(null); // State for export error
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // State for export modal

  // State for progress
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to store interval ID

  // Filter CPF records based on the selected *initial validation* filter for the table
  const filteredCpfRecordsForTable = React.useMemo(() => {
    if (filter === 'valid') {
      return cpfRecords.filter(cpf => cpf.isValid);
    }
    if (filter === 'invalid') {
      return cpfRecords.filter(cpf => !cpf.isValid);
    }
    return cpfRecords;
  }, [cpfRecords, filter]);

  // Use pagination hook on filtered data for the table
  const { currentPage, totalPages, paginatedData, setPage } = usePagination(filteredCpfRecordsForTable, 10);

  // Function to calculate progress
  const calculateProgress = (currentPendingCount: number | null, totalCpfs: number | undefined) => {
    if (currentPendingCount === null || totalCpfs === undefined || totalCpfs === 0) {
      if (batch?.status === 'Finalizado') return 100;
      return 0;
    }
    if (batch?.status === 'Finalizado') return 100;
    const processedCount = totalCpfs - currentPendingCount;
    return Math.round((processedCount / totalCpfs) * 100);
  };

  // Function to fetch pending count
  const fetchPendingCount = async (currentBatchId: string) => {
    try {
      const { count, error: countError } = await supabase
        .from('cpf_records')
        .select('id', { count: 'exact', head: true })
        .eq('batch_id', currentBatchId)
        .eq('status', 'Pendente');

      if (countError) {
        console.error("Error fetching pending count:", countError);
        return;
      }
      console.log(`Fetched pending count for batch ${currentBatchId}: ${count}`);
      setPendingCount(count ?? 0);
    } catch (err) {
      console.error("Exception fetching pending count:", err);
    }
  };

  useEffect(() => {
    fetchBatchDetails();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [batchId]);

  useEffect(() => {
    if (batch) {
        setProgressPercent(calculateProgress(pendingCount, batch.total_cpfs));
    }
  }, [pendingCount, batch]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const shouldPoll = batch && batch.status !== 'Finalizado' && batch.status !== 'Erro';
    if (shouldPoll) {
      console.log(`Starting polling for batch ${batch.id} (status: ${batch.status})`);
      fetchPendingCount(batch.id);
      intervalRef.current = setInterval(() => {
        console.log(`Polling pending count for batch ${batch.id}`);
        fetchPendingCount(batch.id);
      }, POLLING_INTERVAL_MS);
    } else if (batch) {
      console.log(`Polling stopped for batch ${batch.id} (status: ${batch.status}). Fetching final count.`);
      fetchPendingCount(batch.id).then(() => {
          if (batch.status === 'Finalizado') {
              console.log(`Batch ${batch.id} is Finalizado. Setting progress to 100.`);
              setPendingCount(0);
              setProgressPercent(100);
          }
      });
    } else {
        console.log("Polling not started: Batch data not available yet.");
    }
    return () => {
      if (intervalRef.current) {
        console.log(`Clearing interval for batch ${batch?.id}`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [batch]);

  const fetchBatchDetails = async () => {
    setIsLoading(true);
    setError(null);
    setBatch(null);
    setCpfRecords([]);
    setPendingCount(null);
    setProgressPercent(0);
    setExportError(null);

    try {
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw new Error(`Erro ao buscar detalhes do lote: ${batchError.message}`);
      if (!batchData) throw new Error('Lote não encontrado.');
      setBatch(batchData);

      const { data: cpfData, error: cpfError } = await supabase
        .from('cpf_records')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (cpfError) {
        console.error('Erro ao buscar registros de CPF:', cpfError);
        setError('Erro ao buscar os registros de CPF associados a este lote.');
      } else {
         const displayData: DisplayCPFRecord[] = (cpfData || []).map(record => ({
            ...record,
            isValid: record.is_valid
         }));
         setCpfRecords(displayData);
         const initialPending = displayData.filter(r => r.status === 'Pendente').length;
         console.log(`Initial pending count from fetch: ${initialPending}`);
         setPendingCount(initialPending);
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
        // Check if date is valid before formatting
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Data inválida'; }
  };

  // Function to open the result modal
  const handleViewResult = (cpfRecord: DisplayCPFRecord) => {
    setSelectedCpfRecord(cpfRecord);
    setIsResultModalOpen(true);
  };

  // --- START EXPORT FUNCTION (Now accepts filters) ---
  const handleExportExcel = (filters: { status: CPFStatusFilter }) => {
    setIsExporting(true);
    setExportError(null);

    try {
      // 1. Apply filters
      let recordsToExport = cpfRecords;
      if (filters.status !== 'all') {
        recordsToExport = cpfRecords.filter(record => record.status === filters.status);
      }

      if (recordsToExport.length === 0) {
        setExportError(`Nenhum registro encontrado com o status '${filters.status}' para exportar.`);
        setIsExporting(false);
        return;
      }

      // 2. Prepare data for the sheet, extracting specific fields and adding updated_at
      const dataToExport = recordsToExport.map(record => {
        let banco = '-';
        let valorLiquido = '-';

        // Safely parse result JSON
        if (record.result && typeof record.result === 'object') {
          try {
            banco = record.result.banco || '-';
            valorLiquido = record.result.valor_liquido || '-';
          } catch (parseError) {
            console.error(`Error parsing result JSON for CPF ${record.cpf}:`, parseError);
          }
        } else if (typeof record.result === 'string') {
            try {
                const parsedResult = JSON.parse(record.result);
                banco = parsedResult.banco || '-';
                valorLiquido = parsedResult.valor_liquido || '-';
            } catch (parseError) {
                console.error(`Error parsing result string for CPF ${record.cpf}:`, parseError);
            }
        }

        return {
          'CPF': formatCPF(record.cpf),
          'Nome': record.nome,
          'Telefone': record.telefone || '-',
          'Banco': banco,
          'Valor Líquido': valorLiquido,
          'Status Processamento': record.status, // Include status in export
          'Data Atualização': formatDate(record.updated_at), // Add formatted updated_at
          // Optional: Keep other fields if needed
          // 'Data Criação': formatDate(record.created_at),
          // 'Validação Inicial': record.isValid ? 'Válido' : 'Inválido',
        };
      });

      // 3. Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Registros (${filters.status})`);

      // Set column widths (adjust as needed)
      worksheet['!cols'] = [
        { wch: 18 }, // CPF
        { wch: 30 }, // Nome
        { wch: 15 }, // Telefone
        { wch: 20 }, // Banco
        { wch: 15 }, // Valor Líquido
        { wch: 20 }, // Status Processamento
        { wch: 20 }, // Data Atualização
        // { wch: 20 }, // Data Criação (if kept)
        // { wch: 15 }, // Validação Inicial (if kept)
      ];

      // 4. Generate and trigger download
      const filename = `lote_${batch?.name || batchId.substring(0,8)}_status_${filters.status}.xlsx`; // Dynamic filename
      XLSX.writeFile(workbook, filename);
      setIsExportModalOpen(false); // Close modal on successful export

    } catch (err: any) {
      console.error("Error exporting to Excel:", err);
      setExportError(`Erro ao gerar o arquivo Excel: ${err.message || 'Erro desconhecido'}`);
      // Keep modal open on error
    } finally {
      setIsExporting(false);
    }
  };
  // --- END EXPORT FUNCTION ---

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

  // Determine if export button should be disabled (no records or already exporting)
  const canExport = cpfRecords.length > 0 && !isExporting;

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Spinner size="lg" />
        <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Carregando detalhes do lote...</p>
      </div>
    );
  }

  if (error && !batch) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="space-y-8">
       {/* Back Button, Title, and Export Button */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
         <div className="flex items-center">
             <button
               onClick={onBack}
               className="p-2 rounded-lg hover:bg-muted-light dark:hover:bg-muted-dark text-text-secondary-light dark:text-text-secondary-dark mr-3 transition-colors duration-150"
               title="Voltar para a lista de lotes"
             >
               <ArrowLeft className="h-5 w-5" />
             </button>
             <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
               Detalhes do Lote
             </h1>
         </div>
         {/* Export Button - Opens Modal */}
         <button
            onClick={() => setIsExportModalOpen(true)} // Open modal
            disabled={!canExport} // Disable if no records or already exporting (handled inside modal now)
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-background-dark flex items-center disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-in-out text-sm shadow-sm hover:shadow-md"
            title={!canExport && cpfRecords.length === 0 ? "Nenhum registro neste lote para exportar" : "Abrir opções de exportação"}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Registros (Excel)
          </button>
       </div>
       {/* Export Error Alert (shown below button, relates to export action itself) */}
       {exportError && <Alert type="error" message={exportError} />}


      {/* Batch Details Card */}
      {batch && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">{batch.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 mb-6">
            <DetailItem icon={FileText} label="Nome do Arquivo" value={batch.filename} />
            <DetailItem icon={Database} label="API Banco" value={batch.bank_api} />
            <div className="flex items-start space-x-3">
                <ListFilter className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Status Processamento</p>
                    <div className="mt-1">
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

          {/* Progress Bar Section */}
          {batch.total_cpfs > 0 && (
            <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Progresso da Consulta</p>
                <p className="text-sm font-semibold text-primary-light dark:text-primary-dark">{progressPercent}%</p>
              </div>
              <div className="w-full bg-muted-light dark:bg-muted-dark rounded-full h-2.5 border border-border-light dark:border-border-dark overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-primary-light dark:from-blue-600 dark:to-primary-dark h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              {pendingCount !== null && batch.status !== 'Finalizado' && (
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1.5 text-right">
                  {batch.total_cpfs - pendingCount} de {batch.total_cpfs} consultados ({pendingCount} pendentes)
                </p>
              )}
               {batch.status === 'Finalizado' && (
                 <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1.5 text-right">
                   {batch.total_cpfs} de {batch.total_cpfs} consultados (Finalizado)
                 </p>
               )}
            </div>
          )}
        </div>
      )}

      {/* CPF Records Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Registros de CPF ({filteredCpfRecordsForTable.length})</h2>
            {/* Filter Buttons (for table display) */}
            <div className="flex space-x-2 flex-wrap gap-y-2">
                 <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark self-center mr-2 whitespace-nowrap">Filtrar Tabela (Validação Inicial):</span>
                <button
                    onClick={() => { setFilter('all'); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-150 border ${filter === 'all' ? 'bg-primary-light dark:bg-primary-dark text-white border-primary-light dark:border-primary-dark' : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-muted-light dark:hover:bg-muted-dark hover:border-gray-400 dark:hover:border-gray-500'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => { setFilter('valid'); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-150 border ${filter === 'valid' ? 'bg-green-600 text-white border-green-600' : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-muted-light dark:hover:bg-muted-dark hover:border-gray-400 dark:hover:border-gray-500'}`}
                >
                    Válidos
                </button>
                <button
                    onClick={() => { setFilter('invalid'); setPage(1); }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-150 border ${filter === 'invalid' ? 'bg-red-600 text-white border-red-600' : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-muted-light dark:hover:bg-muted-dark hover:border-gray-400 dark:hover:border-gray-500'}`}
                >
                    Inválidos
                </button>
            </div>
        </div>

        {error && batch && <Alert type="warning" message={error} />}

        {cpfRecords.length === 0 && !error && (
             <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">
               Nenhum registro de CPF encontrado para este lote.
             </p>
        )}

        {filteredCpfRecordsForTable.length > 0 && (
          <>
            <Table headers={['CPF', 'NOME', 'STATUS VALIDAÇÃO', 'STATUS PROCESSAMENTO', 'AÇÕES']}>
              {paginatedData.map((record) => (
                <tr key={record.id} className={`hover:bg-muted-light/70 dark:hover:bg-muted-dark/70 transition-colors duration-150 ${!record.isValid ? 'opacity-70' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark font-mono">
                    {formatCPF(record.cpf)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {record.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge isValid={record.isValid} size="sm"/>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusProcessingBadge status={record.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                     <button
                        onClick={() => handleViewResult(record)}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Visualizar resultado"
                        disabled={!record.result}
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
         {filteredCpfRecordsForTable.length === 0 && cpfRecords.length > 0 && filter !== 'all' && (
             <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">
               Nenhum CPF com validação inicial '{filter === 'valid' ? 'Válido' : 'Inválido'}' encontrado neste lote (filtro da tabela).
             </p>
         )}
      </div>

      {/* Render the CPF Result Modal */}
      <CPFResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        cpfRecord={selectedCpfRecord}
      />

      {/* Render the Export Options Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
            setIsExportModalOpen(false);
            setExportError(null); // Clear export error when closing modal manually
        }}
        onExport={handleExportExcel} // Pass the updated export function
        isExporting={isExporting}
        recordCount={cpfRecords.length}
      />
    </div>
  );
};

export default BatchDetailsPage;
