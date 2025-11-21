-- RLS Policies for mesas table
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users" ON mesas
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow update access to authenticated users (for status changes)
CREATE POLICY "Allow update access to authenticated users" ON mesas
    FOR UPDATE
    TO authenticated
    USING (true);

-- RLS Policies for visitas table
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to visitas for authenticated users" ON visitas
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Allow insert access to visitas for authenticated users" ON visitas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow update access to authenticated users
CREATE POLICY "Allow update access to visitas for authenticated users" ON visitas
    FOR UPDATE
    TO authenticated
    USING (true);

-- RLS Policies for reservas table
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to reservas for authenticated users" ON reservas
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Allow insert access to reservas for authenticated users" ON reservas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow update access to authenticated users
CREATE POLICY "Allow update access to reservas for authenticated users" ON reservas
    FOR UPDATE
    TO authenticated
    USING (true);

-- RLS Policies for clientes table
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to clientes for authenticated users" ON clientes
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Allow insert access to clientes for authenticated users" ON clientes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow update access to authenticated users
CREATE POLICY "Allow update access to clientes for authenticated users" ON clientes
    FOR UPDATE
    TO authenticated
    USING (true);