import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.warn(
    'Warning: Supabase credentials are missing or placeholders in backend/.env. Using local SQLite/custom verification fallback.'
  );
}

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;
