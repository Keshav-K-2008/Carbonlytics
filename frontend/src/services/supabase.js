import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('your_supabase_anon_key_here')) {
  console.warn(
    'Supabase environment variables are missing or set to placeholders. Please configure them in frontend/.env'
  );
}

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('your_supabase_anon_key_here'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;
