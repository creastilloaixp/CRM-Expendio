-- =====================================================
-- FUNCIONES RPC PARA GESTIÓN DE NOTIFICACIONES
-- =====================================================

-- Función para crear una notificación
CREATE OR REPLACE FUNCTION crear_notificacion(
    p_visita_id UUID,
    p_tipo TEXT,
    p_mensaje TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_mesa_id UUID;
    v_mesa_nombre TEXT;
    v_mensaje_final TEXT;
    v_result JSON;
BEGIN
    -- Validar el tipo
    IF p_tipo NOT IN ('Llamar Mesero', 'Pedir Cuenta', 'Urgente') THEN
        RAISE EXCEPTION 'Tipo de notificación inválido: %', p_tipo;
    END IF;

    -- Obtener la mesa de la visita
    SELECT v.mesa_id, m.nombre
    INTO v_mesa_id, v_mesa_nombre
    FROM visitas v
    JOIN mesas m ON v.mesa_id = m.id
    WHERE v.id = p_visita_id
    AND v.hora_salida IS NULL;

    IF v_mesa_id IS NULL THEN
        RAISE EXCEPTION 'Visita no encontrada o ya finalizada';
    END IF;

    -- Generar mensaje si no se proporcionó
    IF p_mensaje IS NULL THEN
        CASE p_tipo
            WHEN 'Llamar Mesero' THEN
                v_mensaje_final := 'Mesa ' || v_mesa_nombre || ' solicita atención';
            WHEN 'Pedir Cuenta' THEN
                v_mensaje_final := 'Mesa ' || v_mesa_nombre || ' solicita la cuenta';
            WHEN 'Urgente' THEN
                v_mensaje_final := 'Mesa ' || v_mesa_nombre || ' tiene una solicitud urgente';
            ELSE
                v_mensaje_final := 'Mesa ' || v_mesa_nombre || ' necesita atención';
        END CASE;
    ELSE
        v_mensaje_final := p_mensaje;
    END IF;

    -- Crear la notificación
    INSERT INTO notificaciones (
        visita_id,
        mesa_id,
        tipo,
        mensaje,
        leida,
        atendida
    )
    VALUES (
        p_visita_id,
        v_mesa_id,
        p_tipo,
        v_mensaje_final,
        false,
        false
    )
    RETURNING row_to_json(notificaciones.*) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(
    p_notificacion_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    UPDATE notificaciones
    SET leida = true
    WHERE id = p_notificacion_id
    RETURNING row_to_json(notificaciones.*) INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Notificación no encontrada';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para marcar notificación como atendida
CREATE OR REPLACE FUNCTION marcar_notificacion_atendida(
    p_notificacion_id UUID,
    p_atendida_por TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    UPDATE notificaciones
    SET
        atendida = true,
        leida = true,
        atendida_por = p_atendida_por
    WHERE id = p_notificacion_id
    RETURNING row_to_json(notificaciones.*) INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Notificación no encontrada';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para obtener notificaciones pendientes
CREATE OR REPLACE FUNCTION obtener_notificaciones_pendientes()
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', n.id,
            'mesa_nombre', m.nombre,
            'tipo', n.tipo,
            'mensaje', n.mensaje,
            'leida', n.leida,
            'atendida', n.atendida,
            'created_at', n.created_at,
            'atendida_por', n.atendida_por
        )
        ORDER BY n.created_at DESC
    )
    INTO v_result
    FROM notificaciones n
    JOIN mesas m ON n.mesa_id = m.id
    WHERE n.atendida = false;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para limpiar notificaciones antiguas atendidas
CREATE OR REPLACE FUNCTION limpiar_notificaciones_antiguas(
    p_dias_antiguedad INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
    v_eliminadas INTEGER;
BEGIN
    DELETE FROM notificaciones
    WHERE atendida = true
    AND atendida_at < NOW() - INTERVAL '1 day' * p_dias_antiguedad;

    GET DIAGNOSTICS v_eliminadas = ROW_COUNT;
    RETURN v_eliminadas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Comentarios para documentación
COMMENT ON FUNCTION crear_notificacion IS 'Crea una notificación para el staff del restaurante';
COMMENT ON FUNCTION marcar_notificacion_leida IS 'Marca una notificación como vista por el staff';
COMMENT ON FUNCTION marcar_notificacion_atendida IS 'Marca una notificación como completamente atendida';
COMMENT ON FUNCTION obtener_notificaciones_pendientes IS 'Obtiene todas las notificaciones no atendidas ordenadas por fecha';
COMMENT ON FUNCTION limpiar_notificaciones_antiguas IS 'Elimina notificaciones atendidas con más de X días de antigüedad';
