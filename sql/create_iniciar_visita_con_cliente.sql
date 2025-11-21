-- Crear función temporal iniciar_visita_con_cliente
-- Esta función debe ejecutarse manualmente en la consola de Supabase

CREATE OR REPLACE FUNCTION iniciar_visita_con_cliente(
    p_mesa_nombre TEXT,
    p_numero_personas INTEGER,
    p_cliente_id UUID
)
RETURNS JSON AS $$
DECLARE
    mesa_record RECORD;
    new_visita_id UUID;
    result JSON;
BEGIN
    -- Validar que se proporcione cliente_id
    IF p_cliente_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Cliente ID es requerido');
    END IF;
    
    -- Get mesa by nombre
    SELECT * INTO mesa_record
    FROM mesas
    WHERE nombre = p_mesa_nombre;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Mesa no encontrada');
    END IF;
    
    -- Check if mesa is available
    IF mesa_record.estado != 'Libre' AND mesa_record.estado != 'Reservada' THEN
        RETURN json_build_object('success', false, 'message', 'La mesa no está disponible para check-in');
    END IF;
    
    -- Create visita with provided cliente_id
    INSERT INTO visitas (mesa_id, cliente_id, hora_llegada, numero_personas)
    VALUES (mesa_record.id, p_cliente_id, NOW(), p_numero_personas)
    RETURNING id INTO new_visita_id;
    
    -- Update mesa status
    UPDATE mesas SET estado = 'Ocupada' WHERE id = mesa_record.id;
    
    -- If mesa was reserved, mark reservation as completed
    IF mesa_record.estado = 'Reservada' THEN
        UPDATE reservas 
        SET estado = 'Completada' 
        WHERE mesa_id = mesa_record.id 
        AND estado = 'Confirmada';
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'visita_id', new_visita_id,
        'message', '¡Check-in exitoso!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;