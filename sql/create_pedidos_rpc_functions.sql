-- =====================================================
-- FUNCIONES RPC PARA GESTIÓN DE PEDIDOS
-- =====================================================

-- Función para crear un nuevo pedido
CREATE OR REPLACE FUNCTION crear_pedido(
    p_visita_id UUID,
    p_producto_id UUID,
    p_cantidad INTEGER,
    p_notas TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_precio_unitario DECIMAL(10,2);
    v_producto_disponible BOOLEAN;
    v_result JSON;
BEGIN
    -- Verificar que el producto existe y está disponible
    SELECT precio, disponible
    INTO v_precio_unitario, v_producto_disponible
    FROM productos
    WHERE id = p_producto_id;

    IF v_precio_unitario IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado';
    END IF;

    IF NOT v_producto_disponible THEN
        RAISE EXCEPTION 'Producto no disponible actualmente';
    END IF;

    -- Verificar que la visita existe y está activa
    IF NOT EXISTS (
        SELECT 1 FROM visitas
        WHERE id = p_visita_id
        AND hora_salida IS NULL
    ) THEN
        RAISE EXCEPTION 'Visita no encontrada o ya finalizada';
    END IF;

    -- Crear el pedido
    INSERT INTO pedidos (
        visita_id,
        producto_id,
        cantidad,
        precio_unitario,
        estado,
        notas
    )
    VALUES (
        p_visita_id,
        p_producto_id,
        p_cantidad,
        v_precio_unitario,
        'Pendiente',
        p_notas
    )
    RETURNING row_to_json(pedidos.*) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para actualizar el estado de un pedido
CREATE OR REPLACE FUNCTION actualizar_estado_pedido(
    p_pedido_id UUID,
    p_nuevo_estado TEXT
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Validar el estado
    IF p_nuevo_estado NOT IN ('Pendiente', 'En Preparación', 'Listo', 'Entregado', 'Cancelado') THEN
        RAISE EXCEPTION 'Estado inválido: %', p_nuevo_estado;
    END IF;

    -- Actualizar el pedido
    UPDATE pedidos
    SET estado = p_nuevo_estado
    WHERE id = p_pedido_id
    RETURNING row_to_json(pedidos.*) INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Pedido no encontrado';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para obtener pedidos de una visita
CREATE OR REPLACE FUNCTION obtener_pedidos_visita(
    p_visita_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'producto_nombre', prod.nombre,
            'producto_precio', p.precio_unitario,
            'cantidad', p.cantidad,
            'subtotal', p.subtotal,
            'estado', p.estado,
            'notas', p.notas,
            'created_at', p.created_at
        )
        ORDER BY p.created_at DESC
    )
    INTO v_result
    FROM pedidos p
    JOIN productos prod ON p.producto_id = prod.id
    WHERE p.visita_id = p_visita_id;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para calcular el total de pedidos de una visita
CREATE OR REPLACE FUNCTION calcular_total_pedidos(
    p_visita_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(subtotal), 0)
    INTO v_total
    FROM pedidos
    WHERE visita_id = p_visita_id
    AND estado != 'Cancelado';

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Comentarios para documentación
COMMENT ON FUNCTION crear_pedido IS 'Crea un nuevo pedido validando disponibilidad del producto y existencia de visita activa';
COMMENT ON FUNCTION actualizar_estado_pedido IS 'Actualiza el estado de un pedido existente';
COMMENT ON FUNCTION obtener_pedidos_visita IS 'Obtiene todos los pedidos de una visita con información del producto';
COMMENT ON FUNCTION calcular_total_pedidos IS 'Calcula el total de todos los pedidos no cancelados de una visita';
