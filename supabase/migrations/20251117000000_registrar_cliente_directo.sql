-- Function to register cliente directly without OTP
CREATE OR REPLACE FUNCTION registrar_cliente_directo(
    p_nombre TEXT,
    p_email TEXT,
    p_telefono TEXT,
    p_fecha_nacimiento TEXT,
    p_marketing_opt_in BOOLEAN
)
RETURNS JSON AS $$
DECLARE
    cliente_existe UUID;
    new_cliente_id UUID;
    es_nuevo BOOLEAN;
    result JSON;
BEGIN
    -- Check if cliente already exists by email
    SELECT id INTO cliente_existe
    FROM clientes
    WHERE email = p_email
    LIMIT 1;
    
    IF cliente_existe IS NOT NULL THEN
        -- Client exists, update info and return existing ID
        UPDATE clientes SET
            nombre = p_nombre,
            telefono = p_telefono,
            fecha_nacimiento = p_fecha_nacimiento::DATE,
            marketing_opt_in = p_marketing_opt_in,
            fecha_actualizacion = NOW()
        WHERE id = cliente_existe;
        
        new_cliente_id := cliente_existe;
        es_nuevo := false;
    ELSE
        -- New cliente, create record
        INSERT INTO clientes (nombre, email, telefono, fecha_nacimiento, fecha_creacion, marketing_opt_in)
        VALUES (p_nombre, p_email, p_telefono, p_fecha_nacimiento::DATE, NOW(), p_marketing_opt_in)
        RETURNING id INTO new_cliente_id;
        
        es_nuevo := true;
    END IF;
    
    -- Return cliente ID and welcome message
    result := json_build_object(
        'cliente_id', new_cliente_id,
        'es_nuevo', es_nuevo,
        'message', CASE 
            WHEN es_nuevo THEN '¡Bienvenido a Expendio! Tu registro ha sido exitoso.'
            ELSE '¡Bienvenido de vuelta a Expendio!'
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add column to track last visit if not exists
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster email lookup
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);