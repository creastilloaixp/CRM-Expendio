-- Complete setup script for CRM Expendio Oficial
-- This script creates the necessary RPC functions, RLS policies, and seed data

-- Step 1: Create RPC Functions

-- RPC Function to liberate a table (end a visit)
CREATE OR REPLACE FUNCTION liberar_mesa(p_visit_id UUID, p_consumo DECIMAL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    mesa_id UUID;
BEGIN
    -- Get the mesa_id from the visita
    SELECT v.mesa_id INTO mesa_id 
    FROM visitas v 
    WHERE v.id = p_visit_id 
    AND v.hora_salida IS NULL;
    
    IF mesa_id IS NULL THEN
        RAISE EXCEPTION 'Active visit not found';
    END IF;
    
    -- Update the visita to set hora_salida and consumo_total
    UPDATE visitas 
    SET hora_salida = NOW(), 
        consumo_total = p_consumo
    WHERE id = p_visit_id 
    AND hora_salida IS NULL
    RETURNING * INTO result;
    
    -- Update the mesa status to Libre
    UPDATE mesas 
    SET estado = 'Libre' 
    WHERE id = mesa_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function to create a reservation
CREATE OR REPLACE FUNCTION crear_reserva(
    p_mesa_id UUID,
    p_cliente_nombre TEXT,
    p_cliente_telefono TEXT,
    p_fecha_hora TIMESTAMP WITH TIME ZONE,
    p_cantidad_personas INTEGER
)
RETURNS JSON AS $$
DECLARE
    new_cliente_id UUID;
    new_reserva_id UUID;
    result JSON;
BEGIN
    -- Create or get existing cliente
    INSERT INTO clientes (nombre, telefono, email, fecha_creacion)
    VALUES (p_cliente_nombre, p_cliente_telefono, p_cliente_telefono || '@temp.com', NOW())
    ON CONFLICT (email) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono
    RETURNING id INTO new_cliente_id;
    
    -- Create the reservation
    INSERT INTO reservas (mesa_id, cliente_id, fecha_hora, numero_personas, estado)
    VALUES (p_mesa_id, new_cliente_id, p_fecha_hora, p_cantidad_personas, 'Confirmada')
    RETURNING * INTO result;
    
    -- Update mesa status to Reservada
    UPDATE mesas SET estado = 'Reservada' WHERE id = p_mesa_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Enable RLS on all tables
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies

-- Mesas policies
CREATE POLICY "Allow read access to all authenticated users" ON mesas
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow update access to authenticated users" ON mesas
    FOR UPDATE
    TO authenticated
    USING (true);

-- Visitas policies
CREATE POLICY "Allow read access to visitas for authenticated users" ON visitas
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert access to visitas for authenticated users" ON visitas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access to visitas for authenticated users" ON visitas
    FOR UPDATE
    TO authenticated
    USING (true);

-- Reservas policies
CREATE POLICY "Allow read access to reservas for authenticated users" ON reservas
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert access to reservas for authenticated users" ON reservas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access to reservas for authenticated users" ON reservas
    FOR UPDATE
    TO authenticated
    USING (true);

-- Clientes policies
CREATE POLICY "Allow read access to clientes for authenticated users" ON clientes
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert access to clientes for authenticated users" ON clientes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update access to clientes for authenticated users" ON clientes
    FOR UPDATE
    TO authenticated
    USING (true);

-- Step 4: Insert seed data

-- Insert sample mesas
INSERT INTO mesas (id, nombre, capacidad, estado) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Mesa 1', 2, 'Libre'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Mesa 2', 4, 'Libre'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Mesa 3', 4, 'Libre'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Mesa 4', 6, 'Libre'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Mesa 5', 2, 'Libre'),
    ('550e8400-e29b-41d4-a716-446655440006', 'Mesa 6', 8, 'Libre'),
    ('550e8400-e29b-41d4-a716-446655440007', 'Mesa 7', 4, 'Libre'),
    ('550e8400-e29b-41d4-a716-446655440008', 'Mesa 8', 2, 'Libre');

-- Insert sample clientes
INSERT INTO clientes (id, nombre, email, telefono, fecha_creacion) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Juan Pérez', 'juan@example.com', '555-0101', NOW()),
    ('660e8400-e29b-41d4-a716-446655440002', 'María García', 'maria@example.com', '555-0102', NOW()),
    ('660e8400-e29b-41d4-a716-446655440003', 'Carlos López', 'carlos@example.com', '555-0103', NOW());

-- Insert sample visitas (active visits)
INSERT INTO visitas (id, mesa_id, cliente_id, hora_llegada, numero_personas, consumo_total) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '30 minutes', 2, 45.50);

-- Update mesa status to occupied for the active visit
UPDATE mesas SET estado = 'Ocupada' WHERE id = '550e8400-e29b-41d4-a716-446655440001';