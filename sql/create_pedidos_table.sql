-- Tabla de Pedidos
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pedidos_visita_id ON pedidos(visita_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_producto_id ON pedidos(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pedidos_updated_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_pedidos_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE pedidos IS 'Registro de pedidos realizados durante las visitas';
COMMENT ON COLUMN pedidos.estado IS 'Estado del pedido: Pendiente (recién creado), En Preparación (cocina trabajando), Listo (listo para servir), Entregado (servido al cliente), Cancelado';
COMMENT ON COLUMN pedidos.subtotal IS 'Calculado automáticamente: cantidad × precio_unitario';
