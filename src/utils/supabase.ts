import { createClient } from '@supabase/supabase-js';

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
    detectSessionInUrl: true
  }
});

// Log connection status for debugging
console.log('Supabase client initialized instance:', supabase ? 'OK' : 'Failed');

// Define types for database tables
export type Batch = {
  id: string;
  name: string;
  bank_api: string;
  filename: string;
  total_cpfs: number;
  valid_cpfs: number;
  invalid_cpfs: number;
  status: 'Pendente' | 'Em execução' | 'Finalizado' | 'Pausado' | 'Erro'; // Updated status values
  id_execucao: string | null; // Added execution ID field
  created_at: string;
  updated_at: string;
};

// Updated CPFRecord type to match potential DB schema more closely
export type CPFRecord = {
  id: string; // Assuming UUID from DB
  batch_id: string;
  cpf: string; // Stored clean (only digits)
  nome: string;
  telefone: string | null; // Allow null for phone
  is_valid: boolean; // Result of initial validation
  status: 'Pendente' | 'Em execução' | 'Finalizado' | 'Erro'; // Updated status values, added Erro
  result: any | null; // Result from bank API (JSONB?)
  created_at: string;
  updated_at: string;
};

// Helper function to create a new batch
export async function createBatch(batchData: Omit<Batch, 'id' | 'created_at' | 'updated_at' | 'id_execucao'>): Promise<Batch | null> { // Exclude id_execucao from input
  try {
    console.log('Creating batch with data:', batchData);

    // Ensure status is one of the allowed Batch status types
    const batchToInsert: Omit<Batch, 'id' | 'created_at' | 'updated_at' | 'id_execucao'> & { status: Batch['status'] } = {
        ...batchData,
        status: batchData.status || 'Pendente' // Default to Pendente if not provided
    };


    const { data, error } = await supabase
      .from('batches')
      .insert(batchToInsert) // Insert data with explicit status
      .select()
      .single();

    if (error) {
      console.error('Error creating batch:', error);
      return null;
    }

    console.log('Batch created successfully:', data);
    // The returned data should include the id_execucao if the DB sets it (e.g., via trigger or default)
    // Otherwise, it might be null initially.
    return data as Batch; // Cast to Batch to include id_execucao potentially being null
  } catch (err) {
    console.error('Exception creating batch:', err);
    return null;
  }
}

// Helper function to create CPF records
// Adjusted to match the updated CPFRecord type
export async function createCPFRecords(records: Array<Omit<CPFRecord, 'id' | 'created_at' | 'updated_at' | 'status' | 'result'>>): Promise<boolean> {
  try {
    console.log(`Creating ${records.length} CPF records`);

    // Map input records to the full DB structure with defaults
    const recordsToInsert = records.map(record => ({
      batch_id: record.batch_id,
      cpf: record.cpf, // Assuming clean CPF is passed
      nome: record.nome,
      telefone: record.telefone || null, // Ensure null if empty
      is_valid: record.is_valid,
      status: 'Pendente' as const, // Default status for CPF records
      result: null // Default result
    }));


    // Insert in smaller batches to avoid payload size limits
    const batchSize = 100; // Supabase recommends batches of < 1500 rows
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);

      const { error } = await supabase
        .from('cpf_records')
        .insert(batch); // Insert the mapped batch

      if (error) {
        console.error(`Error creating CPF records batch ${Math.floor(i / batchSize) + 1}:`, error);
        return false; // Stop if any batch fails
      }
    }

    console.log('All CPF records created successfully');
    return true;
  } catch (err) {
    console.error('Exception creating CPF records:', err);
    return false;
  }
}

// Helper function to check if Supabase connection is working
// Uses a direct query to the batches table instead of system tables
export async function checkSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    console.log('Attempting Supabase connection check...');
    
    // Try a direct query to the batches table
    const { error } = await supabase
      .from('batches')
      .select('id')
      .limit(1);

    if (error) {
      // If the batches table doesn't exist yet, that's okay for connection check
      if (error.code === '42P01') { // Relation does not exist
        console.log('Batches table not found, but connection is working');
        return { connected: true };
      }
      
      // Log the specific error for better debugging
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
      
      // Permission errors are okay for connection check
      if (error.message.includes('permission denied')) {
        console.log('Permission denied, but connection is working');
        return { connected: true };
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
      } else if (batchesResult.error.message.includes('permission denied')) {
         result.batches.error = 'Permissão negada para acessar a tabela "batches". Verifique as políticas RLS.';
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
       } else if (cpfRecordsResult.error.message.includes('permission denied')) {
          result.cpf_records.error = 'Permissão negada para acessar a tabela "cpf_records". Verifique as políticas RLS.';
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
