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
  status: 'Pendente' | 'Em execução' | 'Finalizado' | 'paused' | 'error';
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
  status: 'Pendente' | 'Em execução' | 'Finalizado'; // Status for API processing
  result: any | null; // Result from bank API (JSONB?)
  created_at: string;
  updated_at: string;
};

// Helper function to create a new batch
export async function createBatch(batchData: Omit<Batch, 'id' | 'created_at' | 'updated_at'>): Promise<Batch | null> {
  try {
    console.log('Creating batch with data:', batchData);

    const { data, error } = await supabase
      .from('batches')
      .insert(batchData)
      .select()
      .single();

    if (error) {
      console.error('Error creating batch:', error);
      return null;
    }

    console.log('Batch created successfully:', data);
    return data;
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
      status: 'pending' as const, // Default status
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
    const { error } = await supabase.rpc('get_user_id_by_email', { email: 'test@example.com' });

    // We expect a specific error if the function doesn't exist or user not found,
    // but not a connection error. Check for common connection error messages.
    if (error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        console.error('Supabase connection check failed (Network/Fetch Error):', error);
        return false;
    }

    // If no critical connection error, assume connection is okay
    console.log('Supabase connection check successful (or table/function specific error)');
    return true;

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

    // Check if error indicates table doesn't exist
    if (batchesResult.error && batchesResult.error.message.includes('relation "public.batches" does not exist')) {
      batchesExists = false;
    } else if (batchesResult.error) {
      // Log other errors but assume table might exist if it's not a "does not exist" error
      console.warn('Error checking batches table (assuming exists):', batchesResult.error.message);
      batchesExists = true; // Or false, depending on desired strictness
    } else {
      batchesExists = true;
    }

    // Check cpf_records table similarly
    const cpfRecordsResult = await supabase
      .from('cpf_records')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (cpfRecordsResult.error && cpfRecordsResult.error.message.includes('relation "public.cpf_records" does not exist')) {
      cpfRecordsExists = false;
    } else if (cpfRecordsResult.error) {
      console.warn('Error checking cpf_records table (assuming exists):', cpfRecordsResult.error.message);
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
