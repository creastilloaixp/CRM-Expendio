-- Function to get mesa by name (for QR check-in)
CREATE OR REPLACE FUNCTION get_mesa_by_nombre(
    p_nombre TEXT
)
RETURNS JSON AS $$
DECLARE
    mesa_data JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'nombre', nombre,
        'capacidad', capacidad,
        'estado', estado
    ) INTO mesa_data
    FROM mesas
    WHERE nombre = p_nombre;
    
    RETURN mesa_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start login with OTP
CREATE OR REPLACE FUNCTION iniciar_login_otp(
    p_nombre TEXT,
    p_email TEXT,
    p_telefono TEXT,
    p_fecha_nacimiento TEXT,
    p_marketing_opt_in BOOLEAN
)
RETURNS JSON AS $$
DECLARE
    new_cliente_id UUID;
    otp_id UUID;
    otp_code TEXT;
    result JSON;
BEGIN
    -- Generate OTP code (6 digits)
    otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Create or update cliente
    INSERT INTO clientes (nombre, email, telefono, fecha_nacimiento, fecha_creacion, marketing_opt_in)
    VALUES (p_nombre, p_email, p_telefono, p_fecha_nacimiento::DATE, NOW(), p_marketing_opt_in)
    ON CONFLICT (email) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        fecha_nacimiento = EXCLUDED.fecha_nacimiento,
        marketing_opt_in = EXCLUDED.marketing_opt_in
    RETURNING id INTO new_cliente_id;
    
    -- Create OTP record
    INSERT INTO otps (cliente_id, codigo, telefono, expira_en, creado_en)
    VALUES (new_cliente_id, otp_code, p_telefono, NOW() + INTERVAL '5 minutes', NOW())
    RETURNING id INTO otp_id;
    
    -- Return OTP ID and code (in real implementation, code would be sent via SMS)
    result := json_build_object(
        'otp_id', otp_id,
        'otp_code', otp_code,
        'message', 'Se ha enviado un código a ' || p_telefono
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verificar_otp(
    p_otp_id UUID,
    p_codigo TEXT
)
RETURNS JSON AS $$
DECLARE
    otp_record RECORD;
    result JSON;
BEGIN
    -- Get OTP record
    SELECT * INTO otp_record
    FROM otps
    WHERE id = p_otp_id AND codigo = p_codigo;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Código incorrecto');
    END IF;
    
    IF otp_record.expira_en < NOW() THEN
        RETURN json_build_object('success', false, 'message', 'El código ha expirado');
    END IF;
    
    -- Mark OTP as used
    UPDATE otps SET usado_en = NOW() WHERE id = p_otp_id;
    
    -- Return success with cliente_id for session creation
    RETURN json_build_object(
        'success', true,
        'cliente_id', otp_record.cliente_id,
        'message', 'Verificación exitosa'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start visit (check-in)
CREATE OR REPLACE FUNCTION iniciar_visita(
    p_mesa_nombre TEXT,
    p_numero_personas INTEGER,
    p_cliente_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create otps table if it doesn't exist
CREATE TABLE IF NOT EXISTS otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    telefono TEXT NOT NULL,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usado_en TIMESTAMP WITH TIME ZONE
);

-- RLS for otps table
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create OTPs" ON otps FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own OTPs" ON otps FOR SELECT USING (cliente_id = auth.uid());
CREATE POLICY "Users can update their own OTPs" ON otps FOR UPDATE USING (cliente_id = auth.uid());