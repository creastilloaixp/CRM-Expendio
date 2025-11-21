-- Create RPC function to get all mesas (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_mesas()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(row_to_json(m))
        FROM public.mesas m
        ORDER BY m.nombre
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get mesas with their current status
CREATE OR REPLACE FUNCTION get_mesas_with_status()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', m.id,
                'nombre', m.nombre,
                'capacidad', m.capacidad,
                'estado', m.estado,
                'created_at', m.created_at,
                'active_visita', (
                    SELECT json_build_object(
                        'id', v.id,
                        'hora_llegada', v.hora_llegada,
                        'numero_personas', v.numero_personas,
                        'consumo_total', v.consumo_total
                    )
                    FROM public.visitas v
                    WHERE v.mesa_id = m.id AND v.hora_salida IS NULL
                    LIMIT 1
                ),
                'active_reserva', (
                    SELECT json_build_object(
                        'id', r.id,
                        'fecha_hora', r.fecha_hora,
                        'numero_personas', r.numero_personas,
                        'estado', r.estado
                    )
                    FROM public.reservas r
                    WHERE r.mesa_id = m.id AND r.estado = 'Confirmada'
                    LIMIT 1
                )
            )
        )
        FROM public.mesas m
        ORDER BY m.nombre
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;