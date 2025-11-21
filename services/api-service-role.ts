import { createClient } from '@supabase/supabase-js';

// Service role client that bypasses RLS (use with caution)
const supabaseService = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string || process.env.SUPABASE_ANON_KEY as string
);

export const getMesasWithServiceRole = async () => {
  try {
    const { data, error } = await supabaseService
      .from('mesas')
      .select('*')
      .order('nombre');
    
    if (error) {
      console.error('Error fetching mesas with service role:', error);
      return { data: null, error: error.message, ms: 0 };
    }
    
    return { data, error: null, ms: 0 };
  } catch (error) {
    console.error('Exception fetching mesas with service role:', error);
    return { data: null, error: String(error), ms: 0 };
  }
};