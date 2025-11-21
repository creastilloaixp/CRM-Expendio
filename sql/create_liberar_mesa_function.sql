-- RPC Function to liberate a table (end a visit)
CREATE OR REPLACE FUNCTION liberar_mesa(p_visit_id UUID, p_consumo DECIMAL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
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
    WHERE id = (SELECT mesa_id FROM visitas WHERE id = p_visit_id);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;