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