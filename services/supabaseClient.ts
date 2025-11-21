import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase.types';

const url = process.env.SUPABASE_URL as string;
const anon = process.env.SUPABASE_ANON_KEY as string;

export const supabase: SupabaseClient<Database> = createClient<Database>(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});