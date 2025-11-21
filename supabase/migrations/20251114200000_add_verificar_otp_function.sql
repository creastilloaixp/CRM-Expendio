-- Add missing verificar_otp function
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
    WHERE id = p_otp_id
    AND usado_en IS NULL;
    
    -- Check if OTP exists
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'Código OTP no válido o ya usado'
        );
        RETURN result;
    END IF;
    
    -- Check if OTP is expired
    IF otp_record.expira_en < NOW() THEN
        result := json_build_object(
            'success', false,
            'message', 'Código OTP expirado'
        );
        RETURN result;
    END IF;
    
    -- Check if code matches
    IF otp_record.codigo != p_codigo THEN
        result := json_build_object(
            'success', false,
            'message', 'Código incorrecto'
        );
        RETURN result;
    END IF;
    
    -- Mark OTP as used
    UPDATE otps
    SET usado_en = NOW()
    WHERE id = p_otp_id;
    
    -- Return success
    result := json_build_object(
        'success', true,
        'message', 'Código verificado exitosamente',
        'cliente_id', otp_record.cliente_id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;