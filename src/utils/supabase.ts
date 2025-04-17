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
  status: 'pending' | 'processing' | 'completed' | 'paused' | 'error';
  created_at: string;
  updated_at: string;
};

export type CPFRecord = {
  id: string;
  batch_id: string;
  cpf: string;
  nome: string;
  telefone: string;
  is_valid: boolean;
  status: 'pending' | 'processed' | 'error';
  result: any;
  created_at: string;
  updated_at: string;
};

// Helper function to create a new batch
export async function createBatch(batchData: Omit<Batch, 'id' | 'created_at' | 'updated_at'>): Promise<Batch | null> {
  try {
    const { data, error } = await supabase
      .from('batches')
      .insert(batchData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating batch:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception creating batch:', err);
    return null;
  }
}

// Helper function to create CPF records
export async function createCPFRecords(records: Omit<CPFRecord, 'id' | 'created_at' | 'updated_at' | 'status' | 'result'>[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cpf_records')
      .insert(records.map(record => ({
        ...record,
        status: 'pending',
        result: null
      })));
    
    if (error) {
      console.error('Error creating CPF records:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception creating CPF records:', err);
    return false;
  }
}

// Helper function to check if Supabase connection is working
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Try a simple query to check connection
    const { data, error } = await supabase
      .from('batches')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Exception checking Supabase connection:', err);
    return false;
  }
}
