import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with explicit options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Log connection status for debugging
console.log('Supabase client initialized with URL:', supabaseUrl);

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
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Try a simple query that doesn't rely on specific tables existing initially
    // Using a non-existent function call is a decent check for connectivity
    // without relying on table structure. Expect 'relation "pg_catalog.get_user_id_by_email" does not exist' or similar, not network error.
    const { error } = await supabase.rpc('rpc_does_not_exist_test_connection');

    // We expect a specific error if the function doesn't exist (e.g., 42883),
    // but not a connection error. Check for common connection error messages.
    if (error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        console.error('Supabase connection check failed (Network/Fetch Error):', error);
        return false;
    }
     if (error && error.code === '42883') {
         // This error (undefined function) indicates the DB is reachable.
         console.log('Supabase connection check successful (DB reachable).');
         return true;
     }
     if (!error) {
        // If the RPC somehow exists and doesn't error, connection is also good.
         console.log('Supabase connection check successful.');
         return true;
     }

    // Log other unexpected errors but might still indicate connection issue
    console.warn('Supabase connection check encountered unexpected error:', error);
    return false; // Assume failure on unexpected errors

  } catch (err) {
    // Catch any other exceptions during the check
    console.error('Exception checking Supabase connection:', err);
    return false;
  }
}


// Helper function to check if tables exist
export async function checkTablesExist(): Promise<{batches: boolean, cpf_records: boolean}> {
  let batchesExists = false;
  let cpfRecordsExists = false;

  try {
    console.log('Checking if tables exist...');

    // Check batches table by trying to select a single row's primary key
    const batchesResult = await supabase
      .from('batches')
      .select('id', { count: 'exact', head: true }) // Use head:true for faster check
      .limit(1);

    // Check if error indicates table doesn't exist (code P0001 might be from RLS, 42P01 is relation does not exist)
    if (batchesResult.error && batchesResult.error.code === '42P01') {
      batchesExists = false;
    } else if (batchesResult.error) {
      // Log other errors but assume table might exist if it's not a "does not exist" error
      console.warn('Error checking batches table (assuming exists unless 42P01):', batchesResult.error.message);
      batchesExists = true; // Or false, depending on desired strictness
    } else {
      batchesExists = true;
    }

    // Check cpf_records table similarly
    const cpfRecordsResult = await supabase
      .from('cpf_records')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (cpfRecordsResult.error && cpfRecordsResult.error.code === '42P01') {
      cpfRecordsExists = false;
    } else if (cpfRecordsResult.error) {
      console.warn('Error checking cpf_records table (assuming exists unless 42P01):', cpfRecordsResult.error.message);
      cpfRecordsExists = true; // Or false
    } else {
      cpfRecordsExists = true;
    }

    console.log('Tables exist check result:', { batches: batchesExists, cpf_records: cpfRecordsExists });
    return { batches: batchesExists, cpf_records: cpfRecordsExists };

  } catch (err) {
    console.error('Exception checking tables:', err);
    // Return false for both if a major exception occurs
    return { batches: false, cpf_records: false };
  }
}
