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