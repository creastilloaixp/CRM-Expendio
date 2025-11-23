-- Sistema de Niveles VIP para Gamificación
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas de gamificación a la tabla clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS vip_level VARCHAR(20) DEFAULT 'bronce' CHECK (vip_level IN ('bronce', 'plata', 'oro', 'platino')),
ADD COLUMN IF NOT EXISTS total_visitas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gastado DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS nivel_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Índice para búsquedas por nivel VIP
CREATE INDEX IF NOT EXISTS idx_clientes_vip_level ON clientes(vip_level);

-- Función para calcular y actualizar nivel VIP automáticamente
CREATE OR REPLACE FUNCTION update_vip_level(cliente_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  visitas INTEGER;
  gastado DECIMAL(10,2);
  nuevo_nivel VARCHAR(20);
BEGIN
  -- Obtener estadísticas del cliente
  SELECT
    COUNT(*) as total_visitas,
    COALESCE(SUM(total), 0) as total_gastado
  INTO visitas, gastado
  FROM visitas
  WHERE cliente_id = cliente_uuid;

  -- Determinar nivel según criterios
  -- Platino: 50+ visitas O $10,000+ gastados
  -- Oro: 20+ visitas O $5,000+ gastados
  -- Plata: 10+ visitas O $2,000+ gastados
  -- Bronce: menos de lo anterior
  IF visitas >= 50 OR gastado >= 10000 THEN
    nuevo_nivel := 'platino';
  ELSIF visitas >= 20 OR gastado >= 5000 THEN
    nuevo_nivel := 'oro';
  ELSIF visitas >= 10 OR gastado >= 2000 THEN
    nuevo_nivel := 'plata';
  ELSE
    nuevo_nivel := 'bronce';
  END IF;

  -- Actualizar cliente
  UPDATE clientes
  SET
    vip_level = nuevo_nivel,
    total_visitas = visitas,
    total_gastado = gastado,
    nivel_updated_at = NOW()
  WHERE id = cliente_uuid;

  RETURN nuevo_nivel;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar nivel VIP cuando se crea o actualiza una visita
CREATE OR REPLACE FUNCTION trigger_update_vip_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar nivel del cliente
  PERFORM update_vip_level(NEW.cliente_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en visitas
DROP TRIGGER IF EXISTS update_vip_after_visit ON visitas;
CREATE TRIGGER update_vip_after_visit
AFTER INSERT OR UPDATE ON visitas
FOR EACH ROW
EXECUTE FUNCTION trigger_update_vip_level();

-- Vista para estadísticas de niveles VIP
CREATE OR REPLACE VIEW vip_stats AS
SELECT
  vip_level,
  COUNT(*) as total_clientes,
  ROUND(AVG(total_visitas), 2) as promedio_visitas,
  ROUND(AVG(total_gastado), 2) as promedio_gastado
FROM clientes
GROUP BY vip_level
ORDER BY
  CASE vip_level
    WHEN 'platino' THEN 4
    WHEN 'oro' THEN 3
    WHEN 'plata' THEN 2
    WHEN 'bronce' THEN 1
  END DESC;

-- Comentarios
COMMENT ON COLUMN clientes.vip_level IS 'Nivel VIP del cliente (bronce, plata, oro, platino)';
COMMENT ON COLUMN clientes.total_visitas IS 'Contador de visitas totales del cliente';
COMMENT ON COLUMN clientes.total_gastado IS 'Total acumulado gastado por el cliente';
COMMENT ON FUNCTION update_vip_level IS 'Calcula y actualiza el nivel VIP de un cliente basado en visitas y gasto';
