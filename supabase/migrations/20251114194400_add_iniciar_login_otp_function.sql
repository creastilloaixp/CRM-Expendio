-- Add missing iniciar_login_otp function
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