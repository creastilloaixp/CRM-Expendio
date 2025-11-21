-- Simple fix for mesas RLS policies and seed data
-- Only fix mesas table to avoid conflicts

-- Drop existing restrictive policies on mesas only
DROP POLICY IF EXISTS "mesas_select" ON public.mesas;
DROP POLICY IF EXISTS "mesas_insert" ON public.mesas;
DROP POLICY IF EXISTS "mesas_update" ON public.mesas;
DROP POLICY IF EXISTS "mesas_delete" ON public.mesas;

-- Create permissive read policy for everyone
CREATE POLICY "Allow read access to mesas for everyone" ON public.mesas
    FOR SELECT
    USING (true);

-- Insert test mesas if none exist
INSERT INTO public.mesas (nombre, capacidad, estado) VALUES
    ('Mesa 1', 2, 'Libre'),
    ('Mesa 2', 4, 'Libre'),
    ('Mesa 3', 4, 'Libre'),
    ('Mesa 4', 6, 'Libre'),
    ('Mesa 5', 2, 'Libre'),
    ('Mesa 6', 8, 'Libre'),
    ('Mesa 7', 4, 'Libre'),
    ('Mesa 8', 2, 'Libre')
ON CONFLICT (nombre) DO NOTHING;