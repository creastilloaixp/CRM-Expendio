// Simple script to fix RLS policies in Supabase
// This requires the service role key to bypass RLS

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('Fixing RLS policies...');

    // Drop existing restrictive policies
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS mesas_select ON public.mesas;
        DROP POLICY IF EXISTS mesas_insert ON public.mesas;
        DROP POLICY IF EXISTS mesas_update ON public.mesas;
        DROP POLICY IF EXISTS mesas_delete ON public.mesas;
      `
    });

    // Create new permissive policies
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow read access to mesas for everyone" ON public.mesas
          FOR SELECT
          USING (true);

        CREATE POLICY "Allow insert access to mesas for authenticated users" ON public.mesas
          FOR INSERT
          TO authenticated
          WITH CHECK (true);

        CREATE POLICY "Allow update access to mesas for authenticated users" ON public.mesas
          FOR UPDATE
          TO authenticated
          USING (true)
          WITH CHECK (true);

        CREATE POLICY "Allow delete access to mesas for authenticated users" ON public.mesas
          FOR DELETE
          TO authenticated
          USING (true);
      `
    });

    console.log('RLS policies fixed successfully!');
  } catch (error) {
    console.error('Error fixing RLS policies:', error);
  }
}

fixRLSPolicies();