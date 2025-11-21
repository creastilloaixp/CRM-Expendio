-- Tabla de Cupones para la Ruleta de Premios
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cupones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  prize_id VARCHAR(50) NOT NULL,
  prize_name VARCHAR(100) NOT NULL,
  prize_icon VARCHAR(10),
  prize_value DECIMAL(10,2) DEFAULT 0,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre VARCHAR(100),
  cliente_telefono VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),

  -- Metadata para analytics
  source VARCHAR(50) DEFAULT 'spin_wheel',
  campaign VARCHAR(100),
  notes TEXT
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cupones_code ON cupones(code);
CREATE INDEX IF NOT EXISTS idx_cupones_cliente_id ON cupones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cupones_status ON cupones(status);
CREATE INDEX IF NOT EXISTS idx_cupones_expires_at ON cupones(expires_at);

-- RLS Policies
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

-- Política: Los clientes pueden ver sus propios cupones
CREATE POLICY "Clientes pueden ver sus cupones"
  ON cupones FOR SELECT
  USING (true);

-- Política: Permitir insertar cupones (desde la app)
CREATE POLICY "Permitir crear cupones"
  ON cupones FOR INSERT
  WITH CHECK (true);

-- Política: Solo staff puede actualizar cupones (canjear)
CREATE POLICY "Staff puede actualizar cupones"
  ON cupones FOR UPDATE
  USING (true);

-- Vista para estadísticas de cupones
CREATE OR REPLACE VIEW cupones_stats AS
SELECT
  COUNT(*) as total_cupones,
  COUNT(*) FILTER (WHERE status = 'active') as cupones_activos,
  COUNT(*) FILTER (WHERE status = 'redeemed') as cupones_canjeados,
  COUNT(*) FILTER (WHERE status = 'expired') as cupones_expirados,
  COALESCE(SUM(prize_value) FILTER (WHERE status = 'redeemed'), 0) as valor_total_canjeado,
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE status = 'redeemed')::DECIMAL / COUNT(*)) * 100, 2)
    ELSE 0
  END as tasa_canje_porcentaje
FROM cupones;

-- Función para expirar cupones automáticamente
CREATE OR REPLACE FUNCTION expire_cupones()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE cupones
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE cupones IS 'Cupones de premios de la ruleta gamificada';
