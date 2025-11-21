-- RPCs para iniciar visitas
-- Ejecutar en Supabase SQL Editor

-- Función para iniciar visita CON cliente
CREATE OR REPLACE FUNCTION iniciar_visita_con_cliente(
  p_mesa_nombre VARCHAR,
  p_numero_personas INTEGER,
  p_cliente_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_mesa_id UUID;
  v_visita_id UUID;
BEGIN
  -- Obtener mesa por nombre
  SELECT id INTO v_mesa_id FROM mesas WHERE nombre = p_mesa_nombre;

  IF v_mesa_id IS NULL THEN
    RETURN json_build_object('error', 'Mesa no encontrada');
  END IF;

  -- Crear la visita
  INSERT INTO visitas (mesa_id, cliente_id, numero_personas, hora_llegada)
  VALUES (v_mesa_id, p_cliente_id, p_numero_personas, NOW())
  RETURNING id INTO v_visita_id;

  -- Actualizar estado de la mesa
  UPDATE mesas SET estado = 'Ocupada' WHERE id = v_mesa_id;

  -- Sumar puntos al cliente (1 punto por persona)
  UPDATE clientes
  SET puntos_lealtad = COALESCE(puntos_lealtad, 0) + p_numero_personas
  WHERE id = p_cliente_id;

  RETURN json_build_object(
    'visita_id', v_visita_id,
    'mesa_id', v_mesa_id,
    'cliente_id', p_cliente_id,
    'success', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para iniciar visita SIN cliente (anónimo)
CREATE OR REPLACE FUNCTION iniciar_visita(
  p_mesa_nombre VARCHAR,
  p_numero_personas INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_mesa_id UUID;
  v_visita_id UUID;
BEGIN
  -- Obtener mesa por nombre
  SELECT id INTO v_mesa_id FROM mesas WHERE nombre = p_mesa_nombre;

  IF v_mesa_id IS NULL THEN
    RETURN json_build_object('error', 'Mesa no encontrada');
  END IF;

  -- Crear la visita sin cliente
  INSERT INTO visitas (mesa_id, numero_personas, hora_llegada)
  VALUES (v_mesa_id, p_numero_personas, NOW())
  RETURNING id INTO v_visita_id;

  -- Actualizar estado de la mesa
  UPDATE mesas SET estado = 'Ocupada' WHERE id = v_mesa_id;

  RETURN json_build_object(
    'visita_id', v_visita_id,
    'mesa_id', v_mesa_id,
    'success', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos para llamar las funciones
GRANT EXECUTE ON FUNCTION iniciar_visita_con_cliente TO anon, authenticated;
GRANT EXECUTE ON FUNCTION iniciar_visita TO anon, authenticated;
