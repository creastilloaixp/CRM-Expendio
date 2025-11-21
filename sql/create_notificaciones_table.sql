-- Tabla de Notificaciones para el Staff
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notificaciones_mesa_id ON notificaciones(mesa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_visita_id ON notificaciones(visita_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida) WHERE leida = false;
CREATE INDEX IF NOT EXISTS idx_notificaciones_atendida ON notificaciones(atendida) WHERE atendida = false;
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- Trigger para actualizar updated_at
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

CREATE TRIGGER trigger_notificaciones_updated_at
    BEFORE UPDATE ON notificaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_notificaciones_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE notificaciones IS 'Notificaciones y alertas para el personal del restaurante';
COMMENT ON COLUMN notificaciones.tipo IS 'Tipo de notificación: Llamar Mesero, Pedir Cuenta, Urgente';
COMMENT ON COLUMN notificaciones.leida IS 'Indica si la notificación ha sido vista por el staff';
COMMENT ON COLUMN notificaciones.atendida IS 'Indica si la solicitud ha sido completamente atendida';
COMMENT ON COLUMN notificaciones.atendida_por IS 'Nombre o ID del staff que atendió la notificación';
