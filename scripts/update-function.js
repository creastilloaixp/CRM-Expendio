// Script para ejecutar SQL en Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL() {
  try {
    console.log('🔄 Ejecutando actualización de función iniciar_visita...');
    
    const sql = `
CREATE OR REPLACE FUNCTION iniciar_visita(
    p_mesa_nombre TEXT,
    p_numero_personas INTEGER,
    p_cliente_id UUID DEFAULT NULL
)
RETURNS JSON AS \$\$
DECLARE
    mesa_record RECORD;
    cliente_id UUID;
    new_visita_id UUID;
    result JSON;
BEGIN
    -- Get cliente_id from parameter or session
    IF p_cliente_id IS NOT NULL THEN
        cliente_id := p_cliente_id;
    ELSE
        -- Fallback to session if no parameter provided
        cliente_id := auth.uid();
    END IF;
    
    IF cliente_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'No hay sesión de cliente activa');
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
    
    -- Create visita
    INSERT INTO visitas (mesa_id, cliente_id, hora_llegada, numero_personas)
    VALUES (mesa_record.id, cliente_id, NOW(), p_numero_personas)
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
\$\$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ Función iniciar_visita actualizada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

executeSQL();