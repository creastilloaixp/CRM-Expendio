-- =====================================================
-- SCRIPT COMPLETO DE SETUP V2 - SUPABASE COMPATIBLE
-- CRM Expendio Oficial - Base de Datos Completa
-- =====================================================
--
-- Este script configura toda la base de datos desde cero:
-- 1. Tablas de productos, pedidos y notificaciones
-- 2. Funciones RPC para operaciones
-- 3. RLS Policies mejoradas con seguridad granular
-- 4. Datos seed de productos
--
-- Ejecutar en: Supabase SQL Editor
-- =====================================================

-- ========== PASO 1: CREAR TABLAS ==========
-- Tabla de productos

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    categoria TEXT NOT NULL CHECK (categoria IN ('Cervezas', 'Hamburguesas', 'Tacos', 'Alitas', 'Bebidas', 'Postres', 'Entradas')),
    imagen_url TEXT,
    disponible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_disponible ON productos(disponible);

-- Tabla de pedidos

CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visita_id UUID NOT NULL REFERENCES visitas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Preparación', 'Listo', 'Entregado', 'Cancelado')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_visita_id ON pedidos(visita_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_producto_id ON pedidos(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- Tabla de notificaciones

CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visita_id UUID NOT NULL REFERENCES visitas(id) ON DELETE CASCADE,
    mesa_id UUID NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Llamar Mesero', 'Pedir Cuenta', 'Urgente')),
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    atendida BOOLEAN DEFAULT false,
    atendida_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atendida_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_mesa_id ON notificaciones(mesa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida) WHERE leida = false;
CREATE INDEX IF NOT EXISTS idx_notificaciones_atendida ON notificaciones(atendida) WHERE atendida = false;


-- ========== PASO 2: TRIGGERS PARA UPDATED_AT ==========

CREATE OR REPLACE FUNCTION update_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_productos_updated_at ON productos;
CREATE TRIGGER trigger_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_productos_updated_at();

CREATE OR REPLACE FUNCTION update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pedidos_updated_at ON pedidos;
CREATE TRIGGER trigger_pedidos_updated_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_pedidos_updated_at();

CREATE OR REPLACE FUNCTION update_notificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.atendida = true AND OLD.atendida = false THEN
        NEW.atendida_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notificaciones_updated_at ON notificaciones;
CREATE TRIGGER trigger_notificaciones_updated_at
    BEFORE UPDATE ON notificaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_notificaciones_updated_at();


-- ========== PASO 3: FUNCIONES RPC PARA PEDIDOS ==========

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
    SELECT precio, disponible INTO v_precio_unitario, v_producto_disponible
    FROM productos WHERE id = p_producto_id;

    IF v_precio_unitario IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado';
    END IF;
    IF NOT v_producto_disponible THEN
        RAISE EXCEPTION 'Producto no disponible';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM visitas WHERE id = p_visita_id AND hora_salida IS NULL) THEN
        RAISE EXCEPTION 'Visita no encontrada o finalizada';
    END IF;

    INSERT INTO pedidos (visita_id, producto_id, cantidad, precio_unitario, estado, notas)
    VALUES (p_visita_id, p_producto_id, p_cantidad, v_precio_unitario, 'Pendiente', p_notas)
    RETURNING row_to_json(pedidos.*) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION obtener_pedidos_visita(p_visita_id UUID)
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
        ) ORDER BY p.created_at DESC
    ) INTO v_result
    FROM pedidos p
    JOIN productos prod ON p.producto_id = prod.id
    WHERE p.visita_id = p_visita_id;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calcular_total_pedidos(p_visita_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(subtotal), 0) INTO v_total
    FROM pedidos
    WHERE visita_id = p_visita_id AND estado != 'Cancelado';

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========== PASO 4: FUNCIONES RPC PARA NOTIFICACIONES ==========

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
    IF p_tipo NOT IN ('Llamar Mesero', 'Pedir Cuenta', 'Urgente') THEN
        RAISE EXCEPTION 'Tipo inválido: %', p_tipo;
    END IF;

    SELECT v.mesa_id, m.nombre INTO v_mesa_id, v_mesa_nombre
    FROM visitas v
    JOIN mesas m ON v.mesa_id = m.id
    WHERE v.id = p_visita_id AND v.hora_salida IS NULL;

    IF v_mesa_id IS NULL THEN
        RAISE EXCEPTION 'Visita no encontrada';
    END IF;

    v_mensaje_final := COALESCE(p_mensaje, 'Mesa ' || v_mesa_nombre || ' ' ||
        CASE p_tipo
            WHEN 'Llamar Mesero' THEN 'solicita atención'
            WHEN 'Pedir Cuenta' THEN 'solicita la cuenta'
            ELSE 'necesita atención urgente'
        END
    );

    INSERT INTO notificaciones (visita_id, mesa_id, tipo, mensaje, leida, atendida)
    VALUES (p_visita_id, v_mesa_id, p_tipo, v_mensaje_final, false, false)
    RETURNING row_to_json(notificaciones.*) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION marcar_notificacion_atendida(
    p_notificacion_id UUID,
    p_atendida_por TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    UPDATE notificaciones
    SET atendida = true, leida = true, atendida_por = p_atendida_por
    WHERE id = p_notificacion_id
    RETURNING row_to_json(notificaciones.*) INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Notificación no encontrada';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
            'created_at', n.created_at
        ) ORDER BY n.created_at DESC
    ) INTO v_result
    FROM notificaciones n
    JOIN mesas m ON n.mesa_id = m.id
    WHERE n.atendida = false;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========== PASO 5: RLS POLICIES ==========

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- PRODUCTOS POLICIES
DROP POLICY IF EXISTS "Ver productos disponibles" ON productos;
CREATE POLICY "Ver productos disponibles" ON productos FOR SELECT USING (disponible = true);

DROP POLICY IF EXISTS "Staff puede ver todos productos" ON productos;
CREATE POLICY "Staff puede ver todos productos" ON productos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff puede insertar productos" ON productos;
CREATE POLICY "Staff puede insertar productos" ON productos FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Staff puede actualizar productos" ON productos;
CREATE POLICY "Staff puede actualizar productos" ON productos FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff puede eliminar productos" ON productos;
CREATE POLICY "Staff puede eliminar productos" ON productos FOR DELETE TO authenticated USING (true);

-- PEDIDOS POLICIES
DROP POLICY IF EXISTS "Staff ve todos los pedidos" ON pedidos;
CREATE POLICY "Staff ve todos los pedidos" ON pedidos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Crear pedidos" ON pedidos;
CREATE POLICY "Crear pedidos" ON pedidos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff puede actualizar pedidos" ON pedidos;
CREATE POLICY "Staff puede actualizar pedidos" ON pedidos FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff puede eliminar pedidos" ON pedidos;
CREATE POLICY "Staff puede eliminar pedidos" ON pedidos FOR DELETE TO authenticated USING (true);

-- NOTIFICACIONES POLICIES
DROP POLICY IF EXISTS "Staff ve notificaciones" ON notificaciones;
CREATE POLICY "Staff ve notificaciones" ON notificaciones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Crear notificaciones" ON notificaciones;
CREATE POLICY "Crear notificaciones" ON notificaciones FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff puede actualizar notificaciones" ON notificaciones;
CREATE POLICY "Staff puede actualizar notificaciones" ON notificaciones FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff puede eliminar notificaciones" ON notificaciones;
CREATE POLICY "Staff puede eliminar notificaciones" ON notificaciones FOR DELETE TO authenticated USING (true);


-- ========== PASO 6: DATOS SEED DE PRODUCTOS ==========

INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
-- Cervezas
('Corona Extra', 'Cerveza clara mexicana 355ml', 45.00, 'Cervezas', true),
('Modelo Especial', 'Cerveza clara mexicana 355ml', 45.00, 'Cervezas', true),
('Victoria', 'Cerveza tipo vienna 355ml', 40.00, 'Cervezas', true),
('Heineken', 'Cerveza lager importada 355ml', 55.00, 'Cervezas', true),
('Michelada Clásica', 'Cerveza preparada con limón', 65.00, 'Cervezas', true),
-- Hamburguesas
('Hamburguesa Clásica', 'Carne 150g, lechuga, tomate', 120.00, 'Hamburguesas', true),
('Hamburguesa con Queso', 'Carne 150g, queso cheddar', 135.00, 'Hamburguesas', true),
('Hamburguesa BBQ', 'Carne, tocino, queso, BBQ', 155.00, 'Hamburguesas', true),
('Hamburguesa Doble', 'Doble carne 300g, doble queso', 180.00, 'Hamburguesas', true),
-- Tacos
('Tacos al Pastor (3)', 'Con piña, cebolla, cilantro', 85.00, 'Tacos', true),
('Tacos de Asada (3)', 'Carne asada, cebolla, cilantro', 90.00, 'Tacos', true),
('Tacos de Pescado (3)', 'Pescado empanizado, repollo', 95.00, 'Tacos', true),
-- Alitas
('Alitas BBQ (6 pzas)', 'Con salsa BBQ casera', 110.00, 'Alitas', true),
('Alitas Buffalo (6 pzas)', 'Picantes estilo Buffalo', 110.00, 'Alitas', true),
-- Bebidas
('Refresco 600ml', 'Coca-Cola, Sprite, Fanta', 30.00, 'Bebidas', true),
('Agua Natural 1L', 'Agua purificada', 25.00, 'Bebidas', true),
('Limonada Natural', 'Recién preparada 500ml', 40.00, 'Bebidas', true),
-- Entradas
('Nachos con Queso', 'Totopos con queso fundido', 85.00, 'Entradas', true),
('Papas a la Francesa', 'Papas fritas crujientes', 60.00, 'Entradas', true),
('Guacamole con Totopos', 'Guacamole fresco', 75.00, 'Entradas', true),
-- Postres
('Helado (2 bolas)', 'Chocolate, vainilla o fresa', 50.00, 'Postres', true),
('Brownie con Helado', 'Brownie caliente con helado', 75.00, 'Postres', true),
('Churros (4 pzas)', 'Con cajeta o chocolate', 60.00, 'Postres', true)
ON CONFLICT DO NOTHING;


-- ========== PASO 7: VERIFICACIÓN ==========

SELECT 'Productos insertados' as info, COUNT(*) as total FROM productos
UNION ALL
SELECT 'Pedidos', COUNT(*) FROM pedidos
UNION ALL
SELECT 'Notificaciones', COUNT(*) FROM notificaciones;
