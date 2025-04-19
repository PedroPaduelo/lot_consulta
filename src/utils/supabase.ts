import { createClient, Session, User } from '@supabase/supabase-js';

// --- START Enhanced Environment Variable Debugging ---
console.log('[DEBUG] Reading environment variables...');
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log(`[DEBUG] VITE_SUPABASE_URL: ${supabaseUrl ? `"${supabaseUrl}"` : 'NOT FOUND or empty'}`);
console.log(`[DEBUG] VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? `"${supabaseAnonKey.substring(0, 10)}..." (loaded)` : 'NOT FOUND or empty'}`); // Log only prefix of key

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Variáveis de ambiente Supabase (VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY) ausentes ou inválidas. Verifique seu arquivo .env e a configuração do Vite (envPrefix).';
  console.error('[ERROR]', errorMessage);
  // Display error prominently in the UI during development
  const errorDiv = `<div style="position: fixed; top: 0; left: 0; width: 100%; padding: 15px; background-color: #f8d7da; color: #721c24; border-bottom: 1px solid #f5c6cb; z-index: 9999; font-family: sans-serif; font-size: 14px;"><b>Erro Crítico:</b> ${errorMessage}</div>`;
  document.body.insertAdjacentHTML('afterbegin', errorDiv);
  throw new Error(errorMessage); // Stop execution
} else {
  console.log('[DEBUG] Environment variables seem to be loaded.');
}
// --- END Enhanced Environment Variable Debugging ---


// Create Supabase client with explicit options
console.log('[DEBUG] Initializing Supabase client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true // Changed from false to true, standard practice
  }
});

// Log connection status for debugging
console.log('Supabase client initialized instance:', supabase ? 'OK' : 'Failed');

// --- START Auth Types ---
export type UserProfile = User & {
  role?: 'admin' | 'operator'; // Add role from metadata
};

export type AuthSession = Session | null;
// --- END Auth Types ---


// Define types for database tables

// --- DOCUMENTATION: Standard Batch Statuses ---
// These are the standard status values used for the 'batches' table.
// Ensure consistency across database, frontend components (StatusProcessingBadge, DashboardPage), and any external processes.
// - 'Pendente': Batch created, awaiting processing.
// - 'Em execução': Batch is currently being processed (CPFs are being consulted).
// - 'Finalizado': All CPFs in the batch have been processed successfully.
// - 'Pausado': Processing has been paused by a user or system.
// - 'Erro': An error occurred during batch processing that prevented completion.
// --- END DOCUMENTATION ---
export type BatchStatus = 'Pendente' | 'Em execução' | 'Finalizado' | 'Pausado' | 'Erro';

export type Batch = {
  id: string;
  name: string;
  bank_api: string;
  filename: string;
  total_cpfs: number;
  valid_cpfs: number;
  invalid_cpfs: number;
  status: BatchStatus; // Use the defined type
  id_execucao: string | null; // Added execution ID field
  user_id: string | null; // Added user_id field
  created_at: string;
  updated_at: string;
  // Added fields from RPC/Edge Function (now populated by RPC call in BatchesPage)
  processed_count?: number; // Count of records not 'Pendente'
  pending_count?: number;    // Count of records 'Pendente'
  progress_percent?: number; // Calculated percentage (client-side)
};

// --- DOCUMENTATION: Standard CPF Record Statuses ---
// These are the standard status values used for the 'cpf_records' table.
// - 'Pendente': CPF record is awaiting processing/consultation.
// - 'Em execução': This specific CPF is currently being consulted (less common, often managed at batch level).
// - 'Finalizado': Consultation for this CPF is complete (result stored in 'result' field).
// - 'Erro': An error occurred during the consultation for this specific CPF.
// --- END DOCUMENTATION ---
export type CPFRecordStatus = 'Pendente' | 'Em execução' | 'Finalizado' | 'Erro';

// Updated CPFRecord type to match potential DB schema more closely
export type CPFRecord = {
  id: string; // Assuming UUID from DB
  batch_id: string;
  cpf: string; // Stored clean (only digits)
  nome: string;
  telefone: string | null; // Allow null for phone
  is_valid: boolean; // Result of initial validation
  status: CPFRecordStatus; // Use the defined type
  result: any | null; // Result from bank API (JSONB?)
  created_at: string;
  updated_at: string;
};

// Helper function to create a new batch
// No change needed here as user_id defaults to auth.uid() in the database
export async function createBatch(batchData: Omit<Batch, 'id' | 'created_at' | 'updated_at' | 'id_execucao' | 'user_id' | 'processed_count' | 'pending_count' | 'progress_percent'>): Promise<Batch | null> {
  try {
    console.log('Creating batch with data (user_id will be set by DB):', batchData);

    const batchToInsert: Omit<Batch, 'id' | 'created_at' | 'updated_at' | 'id_execucao' | 'user_id' | 'processed_count' | 'pending_count' | 'progress_percent'> & { status: BatchStatus } = {
        ...batchData,
        status: batchData.status || 'Pendente' // Default to 'Pendente'
    };

    const { data, error } = await supabase
      .from('batches')
      .insert(batchToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating batch:', error);
      // Check for RLS violation error
      if (error.code === '42501' || error.message.includes('policy')) {
         throw new Error(`Erro de permissão ao criar lote: ${error.message}. Verifique se está autenticado.`);
      }
      return null; // Return null for other errors, or rethrow specific ones
    }

    console.log('Batch created successfully:', data);
    return data as Batch;
  } catch (err) {
    console.error('Exception creating batch:', err);
    // Re-throw the error to be handled by the caller (e.g., UploadPage)
    throw err;
  }
}

// Helper function to create CPF records
// No change needed here, RLS on INSERT checks batch ownership
export async function createCPFRecords(records: Array<Omit<CPFRecord, 'id' | 'created_at' | 'updated_at' | 'status' | 'result'>>): Promise<boolean> {
  try {
    console.log(`Creating ${records.length} CPF records`);

    const recordsToInsert = records.map(record => ({
      batch_id: record.batch_id,
      cpf: record.cpf,
      nome: record.nome,
      telefone: record.telefone || null,
      is_valid: record.is_valid,
      status: 'Pendente' as const, // Default to 'Pendente'
      result: null
    }));

    const batchSize = 100;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('cpf_records')
        .insert(batch);

      if (error) {
        console.error(`Error creating CPF records batch ${Math.floor(i / batchSize) + 1}:`, error);
         // Check for RLS violation error
        if (error.code === '42501' || error.message.includes('policy')) {
            throw new Error(`Erro de permissão ao criar registros CPF: ${error.message}. Verifique se o lote pertence a você.`);
        }
        return false;
      }
    }

    console.log('All CPF records created successfully');
    return true;
  } catch (err) {
    console.error('Exception creating CPF records:', err);
    // Re-throw the error to be handled by the caller
    throw err;
  }
}

// Helper function to check if Supabase connection is working
// Uses a direct query to the batches table instead of system tables
export async function checkSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    console.log('Attempting Supabase connection check...');

    // Try a direct query to the batches table
    // Use head: true for a faster check that doesn't return data
    const { error, count } = await supabase
      .from('batches')
      .select('id', { count: 'exact', head: true })
      .limit(1); // Limit 1 is implicit with head:true, but added for clarity

    // Analyze the error
    if (error) {
      // If the batches table doesn't exist yet (42P01) or access is denied (42501),
      // the connection itself is likely working.
      if (error.code === '42P01' || error.code === '42501') {
        console.log(`Connection check OK, but encountered error accessing 'batches': ${error.message} (Code: ${error.code})`);
        return { connected: true };
      }

      // Log other specific errors for better debugging
      console.error('Supabase connection check failed:', error);

      // Check for common network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { connected: false, error: `Falha de rede ao conectar ao Supabase. Verifique a URL e a conexão com a internet. (${error.message})` };
      }

      // Check for potential authentication/key errors
      if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
         return { connected: false, error: `Chave de API Supabase inválida ou não autorizada. Verifique VITE_SUPABASE_ANON_KEY. (${error.message})` };
      }

      // Check for URL/Host errors
      if (error.message.includes('hostname') || error.message.includes('URL')) {
         return { connected: false, error: `URL do Supabase inválida ou inacessível. Verifique VITE_SUPABASE_URL. (${error.message})` };
      }

      // Other Supabase errors
      return { connected: false, error: `Erro ao comunicar com Supabase: ${error.message}` };
    }

    // If no error, connection is successful
    console.log('Supabase connection check successful.');
    return { connected: true };

  } catch (err: any) {
    // Catch any other exceptions during the check
    console.error('Exception checking Supabase connection:', err);
    return { connected: false, error: `Exceção inesperada ao verificar conexão: ${err.message}` };
  }
}

// Helper function to check if tables exist
// Returns specific error messages if checks fail
export async function checkTablesExist(): Promise<{
  batches: { exists: boolean; error?: string };
  cpf_records: { exists: boolean; error?: string };
}> {
  const result = {
    batches: { exists: false, error: undefined as string | undefined },
    cpf_records: { exists: false, error: undefined as string | undefined },
  };

  try {
    console.log('Checking if tables exist...');

    // Check batches table
    const batchesResult = await supabase
      .from('batches')
      .select('id', { count: 'exact', head: true }) // Use head:true for faster check
      .limit(1);

    if (batchesResult.error) {
      console.warn('Error checking batches table:', batchesResult.error);
      if (batchesResult.error.code === '42P01') { // Relation does not exist
        result.batches.error = 'Tabela "batches" não encontrada.';
      } else if (batchesResult.error.code === '42501' || batchesResult.error.message.includes('permission denied')) { // Check code 42501 too
         result.batches.error = 'Permissão negada para acessar a tabela "batches". Verifique as políticas RLS.';
         result.batches.exists = true; // Table exists but access denied
      } else {
        result.batches.error = `Erro ao verificar tabela "batches": ${batchesResult.error.message}`;
      }
    } else {
      result.batches.exists = true;
    }

    // Check cpf_records table
    const cpfRecordsResult = await supabase
      .from('cpf_records')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (cpfRecordsResult.error) {
       console.warn('Error checking cpf_records table:', cpfRecordsResult.error);
       if (cpfRecordsResult.error.code === '42P01') { // Relation does not exist
         result.cpf_records.error = 'Tabela "cpf_records" não encontrada.';
       } else if (cpfRecordsResult.error.code === '42501' || cpfRecordsResult.error.message.includes('permission denied')) {
          result.cpf_records.error = 'Permissão negada para acessar a tabela "cpf_records". Verifique as políticas RLS.';
          result.cpf_records.exists = true; // Table exists but access denied
       } else {
         result.cpf_records.error = `Erro ao verificar tabela "cpf_records": ${cpfRecordsResult.error.message}`;
       }
    } else {
      result.cpf_records.exists = true;
    }

    console.log('Tables exist check result:', result);
    return result;

  } catch (err: any) {
    console.error('Exception checking tables:', err);
    // Return generic error if a major exception occurs during the check
    const errorMsg = `Exceção ao verificar tabelas: ${err.message}`;
    result.batches.error = result.batches.error || errorMsg;
    result.cpf_records.error = result.cpf_records.error || errorMsg;
    return result;
  }
}

// --- START Auth Functions ---

export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// --- END Auth Functions ---
