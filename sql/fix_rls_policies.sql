-- Fix RLS policies to allow anonymous read access for admin dashboard
-- This is a temporary fix until proper authentication is implemented

-- Drop existing restrictive policies
DROP POLICY IF EXISTS mesas_select ON public.mesas;
DROP POLICY IF EXISTS mesas_insert ON public.mesas;
DROP POLICY IF EXISTS mesas_update ON public.mesas;
DROP POLICY IF EXISTS mesas_delete ON public.mesas;

-- Create new policies that allow read access for everyone (for admin dashboard)
CREATE POLICY "Allow read access to mesas for everyone" ON public.mesas
    FOR SELECT
    USING (true);

-- Allow insert/update/delete only for authenticated users (when we implement proper auth)
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

-- Apply same fix to other tables
DROP POLICY IF EXISTS clientes_select ON public.clientes;
DROP POLICY IF EXISTS clientes_insert ON public.clientes;
DROP POLICY IF EXISTS clientes_update ON public.clientes;
DROP POLICY IF EXISTS clientes_delete ON public.clientes;

CREATE POLICY "Allow read access to clientes for everyone" ON public.clientes
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert access to clientes for authenticated users" ON public.clientes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access to clientes for authenticated users" ON public.clientes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete access to clientes for authenticated users" ON public.clientes
    FOR DELETE
    TO authenticated
    USING (true);

-- Fix visitas table
DROP POLICY IF EXISTS visitas_select ON public.visitas;
DROP POLICY IF EXISTS visitas_insert ON public.visitas;
DROP POLICY IF EXISTS visitas_update ON public.visitas;
DROP POLICY IF EXISTS visitas_delete ON public.visitas;

CREATE POLICY "Allow read access to visitas for everyone" ON public.visitas
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert access to visitas for authenticated users" ON public.visitas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access to visitas for authenticated users" ON public.visitas
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete access to visitas for authenticated users" ON public.visitas
    FOR DELETE
    TO authenticated
    USING (true);

-- Fix reservas table
DROP POLICY IF EXISTS reservas_select ON public.reservas;
DROP POLICY IF EXISTS reservas_insert ON public.reservas;
DROP POLICY IF EXISTS reservas_update ON public.reservas;
DROP POLICY IF EXISTS reservas_delete ON public.reservas;

CREATE POLICY "Allow read access to reservas for everyone" ON public.reservas
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert access to reservas for authenticated users" ON public.reservas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access to reservas for authenticated users" ON public.reservas
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete access to reservas for authenticated users" ON public.reservas
    FOR DELETE
    TO authenticated
    USING (true);