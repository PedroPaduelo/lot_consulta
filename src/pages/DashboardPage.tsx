import React, { useState, useEffect } from 'react';
import { supabase, Batch } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { ListChecks, Users, Hash, Clock, RefreshCw, CheckCircle, AlertCircle, BarChart2, Pause } from 'lucide-react'; // Added Pause icon

// Type returned by the RPC function
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
// IMPORTANT: Keep this consistent with database values and other components (e.g., StatusProcessingBadge)
// FIX: Changed PAUSADO value from "Pausado" to "Pause" to match database/RPC output based on logs.
const BATCH_STATUSES = {
    PENDENTE: 'Pendente',
    EM_EXECUCAO: 'Em execução',
    FINALIZADO: 'Finalizado',
    PAUSADO: 'Pause', // <--- FIX: Changed from "Pausado"
    ERRO: 'Erro',
} as const;

type BatchStatusKey = keyof typeof BATCH_STATUSES;
type BatchStatusValue = typeof BATCH_STATUSES[BatchStatusKey];

interface KpiData {
    totalBatches: number;
    totalCpfs: number;
    statusCounts: {
        [key in BatchStatusValue]: number; // Use mapped type for status counts
    };
    userCounts?: { // Optional: only for admins
        total: number;
        admin: number;
        operator: number;
    };
}

const DashboardPage: React.FC = () => {
    const [kpiData, setKpiData] = useState<KpiData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin, profile } = useAuth(); // Get admin status and profile

    useEffect(() => {
        fetchDashboardData();
    }, [isAdmin, profile]); // Refetch if admin status or profile changes

    const fetchDashboardData = async () => {
        if (!profile) {
            setError("Perfil do usuário não carregado.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch Batches using RPC
            console.log('[DEBUG] Dashboard: Calling RPC get_batches_with_progress...');
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_batches_with_progress', {
                is_admin_param: isAdmin,
                user_id_param: profile.id
            });

            if (rpcError) {
                console.error('[ERROR] Dashboard RPC error:', rpcError);
                throw new Error(rpcError.message || 'Erro ao buscar dados dos lotes.');
            }
            // --- DEBUG: Log the raw RPC data ---
            console.log('[DEBUG] Dashboard RAW RPC response:', JSON.stringify(rpcData, null, 2));
            // --- END DEBUG ---

            const batches: BatchWithCounts[] = rpcData || [];

            // Calculate Batch KPIs
            const totalBatches = batches.length;
            const totalCpfs = batches.reduce((sum, batch) => sum + (batch.total_cpfs || 0), 0);

            // Initialize status counts using the defined constants
            const statusCounts: KpiData['statusCounts'] = {
                [BATCH_STATUSES.PENDENTE]: 0,
                [BATCH_STATUSES.EM_EXECUCAO]: 0,
                [BATCH_STATUSES.FINALIZADO]: 0,
                [BATCH_STATUSES.PAUSADO]: 0, // Now expects "Pause"
                [BATCH_STATUSES.ERRO]: 0,
            };

            // --- DEBUG: Log expected status values ---
            console.log('[DEBUG] Dashboard: Expected status values:', Object.values(BATCH_STATUSES));
            // --- END DEBUG ---

            // Aggregate counts, ensuring keys match exactly using explicit comparison
            batches.forEach((batch, index) => {
                const statusFromBatch = batch.status; // Get the status string directly
                console.log(`[DEBUG] Dashboard Batch[${index}] ID: ${batch.id}, Raw Status from DB/RPC: "${statusFromBatch}" (Type: ${typeof statusFromBatch})`);

                let matched = false;
                // Iterate through the defined status *values* for comparison
                for (const key in BATCH_STATUSES) {
                    const expectedStatusValue = BATCH_STATUSES[key as BatchStatusKey];
                    // Explicit comparison
                    if (statusFromBatch === expectedStatusValue) {
                        statusCounts[expectedStatusValue]++; // Increment count using the matched value as key
                        console.log(`   ✅ Counted valid status: "${statusFromBatch}" matched expected "${expectedStatusValue}"`);
                        matched = true;
                        break; // Found a match, exit inner loop
                    }
                }

                if (!matched) {
                    // Log unexpected statuses clearly
                    console.warn(`   ⚠️ Dashboard: Encountered unexpected or non-matching batch status: "${statusFromBatch}" for batch ID: ${batch.id}. This status was NOT counted.`);
                }
            });
            // --- DEBUG: Log final counts before setting state ---
            console.log('[DEBUG] Dashboard final calculated status counts (before setState):', JSON.stringify(statusCounts, null, 2));
            // --- END DEBUG ---

            let userCounts: KpiData['userCounts'] | undefined = undefined;

            // Fetch User Counts (only if admin)
            if (isAdmin) {
                console.log('[DEBUG] Dashboard: Fetching profiles for user counts...');
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, role'); // Select only needed fields

                if (profilesError) {
                    console.error('[ERROR] Dashboard profiles fetch error:', profilesError);
                    // Don't block dashboard for profile errors, just log and continue
                    setError('Erro ao buscar contagem de usuários, mas exibindo dados dos lotes.');
                } else {
                    const profiles: ProfileCount[] = profilesData || [];
                    userCounts = {
                        total: profiles.length,
                        admin: profiles.filter(p => p.role === 'admin').length,
                        operator: profiles.filter(p => p.role === 'operator' || !p.role).length, // Count null/undefined as operator
                    };
                    console.log('[DEBUG] Dashboard user counts:', userCounts);
                }
            }

            // Construct the final data object
            const finalKpiData: KpiData = {
                totalBatches,
                totalCpfs,
                statusCounts, // Use the calculated counts
                userCounts,
            };

            // --- DEBUG: Log the object being passed to setKpiData ---
            console.log('[DEBUG] Dashboard: Data being set to state:', JSON.stringify(finalKpiData, null, 2));
            // --- END DEBUG ---

            setKpiData(finalKpiData); // Update the state

        } catch (err: any) {
            console.error("[ERROR] Dashboard fetch error:", err);
            setError(err.message || 'Falha ao carregar dados do dashboard.');
            setKpiData(null); // Clear data on error
        } finally {
            setIsLoading(false);
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

    // --- DEBUG: Log kpiData when rendering ---
    console.log('[DEBUG] Dashboard rendering with kpiData:', kpiData ? JSON.stringify(kpiData.statusCounts, null, 2) : 'null');
    // --- END DEBUG ---

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
                <p className="ml-3 text-text-secondary-light dark:text-text-secondary-dark">Carregando dashboard...</p>
            </div>
        );
    }

    if (error && !kpiData) { // Show error only if there's no data at all
        return <Alert type="error" message={error} />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center mb-6">
                 <BarChart2 className="mr-3 h-7 w-7 text-primary-light dark:text-primary-dark" />
                 <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                   Dashboard
                 </h1>
            </div>

            {error && <Alert type="warning" message={error} />} {/* Show profile fetch error as warning if batch data loaded */}

            {kpiData ? (
                <>
                    {/* General KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <KpiCard title="Total de Lotes" value={kpiData.totalBatches} icon={ListChecks} colorClass="text-blue-500 dark:text-blue-400" />
                        <KpiCard title="Total de CPFs Registrados" value={kpiData.totalCpfs} icon={Hash} colorClass="text-indigo-500 dark:text-indigo-400" />
                        {/* Placeholder or another general KPI */}
                         <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-5 border border-border-light dark:border-border-dark opacity-50">
                            <p className="text-center text-text-secondary-light dark:text-text-secondary-dark">...</p>
                         </div>
                    </div>

                    {/* Batch Status KPIs - Using BATCH_STATUSES constants */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
                        <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Status dos Lotes</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* Access counts using the constant values as keys */}
                            <KpiCard title={BATCH_STATUSES.PENDENTE} value={kpiData.statusCounts[BATCH_STATUSES.PENDENTE]} icon={Clock} colorClass="text-yellow-500 dark:text-yellow-400" />
                            <KpiCard title={BATCH_STATUSES.EM_EXECUCAO} value={kpiData.statusCounts[BATCH_STATUSES.EM_EXECUCAO]} icon={RefreshCw} colorClass="text-blue-500 dark:text-blue-400" />
                            <KpiCard title={BATCH_STATUSES.FINALIZADO} value={kpiData.statusCounts[BATCH_STATUSES.FINALIZADO]} icon={CheckCircle} colorClass="text-green-500 dark:text-green-400" />
                            {/* Use the updated constant value for the title and key */}
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

                    {/* Placeholder for Recent Activity/Batches */}
                    {/* <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
                        <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Atividade Recente</h2>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark">Lista dos últimos lotes processados...</p>
                    </div> */}
                </>
            ) : (
                 !error && <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-10">Nenhum dado para exibir no dashboard.</p>
            )}
        </div>
    );
};

export default DashboardPage;
