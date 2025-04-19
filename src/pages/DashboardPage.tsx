import React, { useState, useEffect } from 'react';
import { supabase, Batch } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { ListChecks, Users, Hash, Clock, RefreshCw, CheckCircle, AlertCircle, BarChart2, Pause, Activity, Calendar } from 'lucide-react';
import DailyUpdatesChart, { DailyUpdateData } from '../components/charts/DailyUpdatesChart';
import HourlyUpdatesChart, { HourlyUpdateData } from '../components/charts/HourlyUpdatesChart';
import { DateRangePicker } from '../components/ui/DateRangePicker'; // Import DateRangePicker
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns'; // Import date-fns functions

// Type returned by the RPC function for batches
type BatchWithCounts = Omit<Batch, 'progress_percent'> & {
    processed_count: number;
    pending_count: number;
};

// Type for profile data (simplified for count)
interface ProfileCount {
    id: string;
    role?: 'admin' | 'operator' | null;
}

// Define the standard batch statuses used throughout the application
const BATCH_STATUSES = {
    PENDENTE: 'Pendente',
    EM_EXECUCAO: 'Em execução',
    FINALIZADO: 'Finalizado',
    PAUSADO: 'Pause', // Matches DB/RPC value
    ERRO: 'Erro',
} as const;

type BatchStatusKey = keyof typeof BATCH_STATUSES;
type BatchStatusValue = typeof BATCH_STATUSES[BatchStatusKey];

interface KpiData {
    totalBatches: number;
    totalCpfs: number;
    statusCounts: {
        [key in BatchStatusValue]: number;
    };
    userCounts?: {
        total: number;
        admin: number;
        operator: number;
    };
}

// Helper to get YYYY-MM-DD string in UTC
const getUTCDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Helper to get ISO string (UTC) for start/end of day
const getUTCISOString = (date: Date | undefined, type: 'start' | 'end'): string | undefined => {
    if (!date) return undefined;
    const d = type === 'start' ? startOfDay(date) : endOfDay(date);
    return d.toISOString();
}

const DashboardPage: React.FC = () => {
    const [kpiData, setKpiData] = useState<KpiData | null>(null);
    const [dailyChartData, setDailyChartData] = useState<DailyUpdateData[]>([]);
    const [hourlyChartData, setHourlyChartData] = useState<HourlyUpdateData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCharts, setIsLoadingCharts] = useState(false); // Separate loading for charts
    const [error, setError] = useState<string | null>(null);
    const [chartError, setChartError] = useState<string | null>(null);
    const { isAdmin, profile } = useAuth();

    // State for date range filter
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const endDate = new Date();
        const startDate = subDays(endDate, 29); // Default to last 30 days (inclusive)
        return { from: startDate, to: endDate };
    });

    // Get today's date string (UTC) for the hourly chart (remains fixed to today)
    const todayUTCString = getUTCDateString(new Date());

    // Fetch initial KPIs and chart data on mount or profile change
    useEffect(() => {
        fetchKpiData(); // Fetch KPIs once
        fetchChartData(); // Fetch initial chart data
    }, [isAdmin, profile]);

    // Refetch chart data when date range changes
    useEffect(() => {
        fetchChartData();
    }, [dateRange, profile]); // Depend on dateRange and profile

    // Fetch only KPI data (Batches, Users)
    const fetchKpiData = async () => {
        if (!profile) {
            setError("Perfil do usuário não carregado.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true); // Loading for KPIs
        setError(null);

        try {
            // --- Fetch Batch KPIs and User Counts ---
            console.log('[DEBUG] Dashboard: Calling RPC get_batches_with_progress...');
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_batches_with_progress', {
                is_admin_param: isAdmin,
                user_id_param: profile.id
            });
            if (rpcError) throw new Error(rpcError.message || 'Erro ao buscar dados dos lotes.');
            const batches: BatchWithCounts[] = rpcData || [];
            const totalBatches = batches.length;
            const totalCpfs = batches.reduce((sum, batch) => sum + (batch.total_cpfs || 0), 0);
            const statusCounts: KpiData['statusCounts'] = {
                [BATCH_STATUSES.PENDENTE]: 0, [BATCH_STATUSES.EM_EXECUCAO]: 0, [BATCH_STATUSES.FINALIZADO]: 0, [BATCH_STATUSES.PAUSADO]: 0, [BATCH_STATUSES.ERRO]: 0,
            };
            batches.forEach(batch => {
                const statusValue = Object.values(BATCH_STATUSES).find(val => val === batch.status);
                if (statusValue) statusCounts[statusValue]++;
                else console.warn(`[WARN] Dashboard: Unexpected batch status "${batch.status}" for batch ID: ${batch.id}`);
            });

            let userCounts: KpiData['userCounts'] | undefined = undefined;
            if (isAdmin) {
                const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, role');
                if (profilesError) setError('Erro ao buscar contagem de usuários, mas exibindo dados dos lotes.');
                else {
                    const profiles: ProfileCount[] = profilesData || [];
                    userCounts = {
                        total: profiles.length,
                        admin: profiles.filter(p => p.role === 'admin').length,
                        operator: profiles.filter(p => p.role === 'operator' || !p.role).length,
                    };
                }
            }
            setKpiData({ totalBatches, totalCpfs, statusCounts, userCounts });
            // --- End of Batch KPI logic ---
        } catch (err: any) {
            console.error("[ERROR] Dashboard KPI fetch error:", err);
            setError(err.message || 'Falha ao carregar dados de KPI.');
            setKpiData(null);
        } finally {
            setIsLoading(false); // Finish KPI loading
        }
    };

    // Fetch only Chart data based on current dateRange
    const fetchChartData = async () => {
        if (!profile) {
            // Don't set global error, just prevent fetch
            console.warn("[WARN] Chart fetch skipped: Profile not loaded.");
            return;
        }
        if (!dateRange?.from || !dateRange?.to) {
            console.warn("[WARN] Chart fetch skipped: Date range not fully selected.");
            setChartError("Selecione um período de datas válido.");
            setDailyChartData([]); // Clear data if range is invalid
            // Keep hourly chart as is (shows today)
            return;
        }

        setIsLoadingCharts(true); // Start chart loading
        setChartError(null);

        try {
            // Daily Chart Data (Using selected date range)
            const startDateISO = getUTCISOString(dateRange.from, 'start');
            const endDateISO = getUTCISOString(dateRange.to, 'end');

            console.log(`[DEBUG] Dashboard: Calling RPC get_cpf_updates_by_day (Start: ${startDateISO}, End: ${endDateISO})`);
            const { data: dailyData, error: dailyError } = await supabase.rpc('get_cpf_updates_by_day', {
                start_date: startDateISO,
                end_date: endDateISO // Use end of day for range inclusion
            });
            if (dailyError) throw new Error(`Erro ao buscar dados diários: ${dailyError.message}`);
            console.log('[DEBUG] Dashboard: Daily chart data received:', dailyData);
            setDailyChartData((dailyData as DailyUpdateData[]) || []);

            // Hourly Chart Data (Remains fixed to Today - Fetch only once or if needed)
            // Optimization: Could fetch hourly data less frequently if desired
            console.log(`[DEBUG] Dashboard: Calling RPC get_cpf_updates_by_hour (Target: ${todayUTCString})`);
            const { data: hourlyData, error: hourlyError } = await supabase.rpc('get_cpf_updates_by_hour', {
                target_date: todayUTCString
            });
            if (hourlyError) throw new Error(`Erro ao buscar dados por hora: ${hourlyError.message}`);
            console.log('[DEBUG] Dashboard: Hourly chart data received:', hourlyData);
            setHourlyChartData((hourlyData as HourlyUpdateData[]) || []);

        } catch (chartErr: any) {
            console.error("[ERROR] Dashboard chart fetch error:", chartErr);
            setChartError(chartErr.message || 'Falha ao carregar dados dos gráficos.');
            setDailyChartData([]); // Clear data on error
            setHourlyChartData([]);
        } finally {
            setIsLoadingCharts(false); // Finish chart loading
        }
    };


    // Helper component for KPI cards
    const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClass: string }> =
        ({ title, value, icon: Icon, colorClass }) => (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-5 border border-border-light dark:border-border-dark flex items-center space-x-4 transition-transform hover:scale-[1.02] duration-200 ease-in-out">
            <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon className={`h-6 w-6 ${colorClass}`} />
            </div>
            <div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{title}</p>
                <p className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">{value}</p>
            </div>
        </div>
    );

    // Helper component for Chart cards
    const ChartCard: React.FC<{ title: string; description: string; icon: React.ElementType; children: React.ReactNode }> =
        ({ title, description, icon: Icon, children }) => (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark border border-border-light dark:border-border-dark">
            <div className="flex items-center p-4 sm:p-6 border-b border-border-light dark:border-border-dark">
                <Icon className="h-6 w-6 text-primary-light dark:text-primary-dark mr-3" />
                <div>
                    <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">{title}</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{description}</p>
                </div>
            </div>
            <div className="p-4 sm:p-6 min-h-[350px] flex items-center justify-center"> {/* Ensure min height for loading state */}
                {children}
            </div>
        </div>
    );


    if (isLoading && !kpiData) { // Show initial loading only for KPIs
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
                <p className="ml-3 text-text-secondary-light dark:text-text-secondary-dark">Carregando dashboard...</p>
            </div>
        );
    }

    if (error && !kpiData) { // Show main error only if there's no KPI data at all
        return <Alert type="error" message={error} />;
    }

    return (
        <div className="space-y-8">
            {/* Header and Date Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center">
                    <BarChart2 className="mr-3 h-7 w-7 text-primary-light dark:text-primary-dark" />
                    <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                        Dashboard
                    </h1>
                </div>
                <DateRangePicker
                    initialRange={dateRange}
                    onRangeChange={setDateRange}
                />
            </div>


            {/* Show non-blocking errors */}
            {error && kpiData && <Alert type="warning" message={error} />}
            {chartError && <Alert type="warning" message={chartError} />}

            {/* KPIs Section */}
            {kpiData ? (
                <>
                    {/* General KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <KpiCard title="Total de Lotes" value={kpiData.totalBatches} icon={ListChecks} colorClass="text-blue-500 dark:text-blue-400" />
                        <KpiCard title="Total de CPFs Registrados" value={kpiData.totalCpfs} icon={Hash} colorClass="text-indigo-500 dark:text-indigo-400" />
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-5 border border-border-light dark:border-border-dark opacity-50 flex items-center justify-center">
                            <p className="text-center text-text-secondary-light dark:text-text-secondary-dark">...</p>
                         </div>
                    </div>

                    {/* Batch Status KPIs */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
                        <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Status dos Lotes</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <KpiCard title={BATCH_STATUSES.PENDENTE} value={kpiData.statusCounts[BATCH_STATUSES.PENDENTE]} icon={Clock} colorClass="text-yellow-500 dark:text-yellow-400" />
                            <KpiCard title={BATCH_STATUSES.EM_EXECUCAO} value={kpiData.statusCounts[BATCH_STATUSES.EM_EXECUCAO]} icon={RefreshCw} colorClass="text-blue-500 dark:text-blue-400" />
                            <KpiCard title={BATCH_STATUSES.FINALIZADO} value={kpiData.statusCounts[BATCH_STATUSES.FINALIZADO]} icon={CheckCircle} colorClass="text-green-500 dark:text-green-400" />
                            <KpiCard title={BATCH_STATUSES.PAUSADO} value={kpiData.statusCounts[BATCH_STATUSES.PAUSADO]} icon={Pause} colorClass="text-gray-500 dark:text-gray-400" />
                            <KpiCard title={BATCH_STATUSES.ERRO} value={kpiData.statusCounts[BATCH_STATUSES.ERRO]} icon={AlertCircle} colorClass="text-red-500 dark:text-red-400" />
                        </div>
                    </div>

                    {/* User KPIs (Admin Only) */}
                    {isAdmin && kpiData.userCounts && (
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
                            <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Usuários</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <KpiCard title="Total de Usuários" value={kpiData.userCounts.total} icon={Users} colorClass="text-purple-500 dark:text-purple-400" />
                                <KpiCard title="Administradores" value={kpiData.userCounts.admin} icon={Users} colorClass="text-red-500 dark:text-red-400" />
                                <KpiCard title="Operadores" value={kpiData.userCounts.operator} icon={Users} colorClass="text-blue-500 dark:text-blue-400" />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                 !error && <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-10">Nenhum dado de KPI para exibir.</p>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Updates Chart */}
                <ChartCard
                    title="Consultas Atualizadas por Dia"
                    description={`Contagem de CPFs atualizados no período selecionado.`}
                    icon={Calendar}
                >
                    {isLoadingCharts ? <Spinner /> : <DailyUpdatesChart data={dailyChartData} />}
                </ChartCard>

                {/* Hourly Updates Chart */}
                <ChartCard
                    title="Consultas Atualizadas por Hora (Hoje)"
                    description={`Contagem de CPFs atualizados hoje (${new Date(todayUTCString + 'T00:00:00Z').toLocaleDateString('pt-BR')}). Independente do filtro de data.`}
                    icon={Activity}
                >
                    {/* Hourly chart still uses today's data, not affected by dateRange */}
                    {isLoadingCharts ? <Spinner /> : <HourlyUpdatesChart data={hourlyChartData} targetDate={todayUTCString} />}
                </ChartCard>
            </div>

        </div>
    );
};

export default DashboardPage;
