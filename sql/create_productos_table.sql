-- Tabla de Productos para el Menú
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

-- Índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- Índice para productos disponibles
CREATE INDEX IF NOT EXISTS idx_productos_disponible ON productos(disponible);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_productos_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE productos IS 'Catálogo de productos disponibles en el menú';
COMMENT ON COLUMN productos.categoria IS 'Categoría del producto: Cervezas, Hamburguesas, Tacos, Alitas, Bebidas, Postres, Entradas';
COMMENT ON COLUMN productos.disponible IS 'Indica si el producto está actualmente disponible para ordenar';
