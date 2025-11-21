-- =====================================================
-- RLS POLICIES MEJORADAS CON PERMISOS GRANULARES
-- =====================================================

-- ========== PRODUCTOS ==========
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver productos disponibles
CREATE POLICY "Cualquiera puede ver productos disponibles"
    ON productos FOR SELECT
    USING (disponible = true);

-- Solo usuarios autenticados (staff) pueden ver todos los productos
CREATE POLICY "Staff puede ver todos los productos"
    ON productos FOR SELECT
    TO authenticated
    USING (true);

-- Solo usuarios autenticados pueden modificar productos
CREATE POLICY "Staff puede insertar productos"
    ON productos FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Staff puede actualizar productos"
    ON productos FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Staff puede eliminar productos"
    ON productos FOR DELETE
    TO authenticated
    USING (true);


-- ========== PEDIDOS ==========
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver todos los pedidos
CREATE POLICY "Staff puede ver todos los pedidos"
    ON pedidos FOR SELECT
    TO authenticated
    USING (true);

-- Clientes pueden ver solo pedidos de su visita activa
CREATE POLICY "Clientes pueden ver sus propios pedidos"
    ON pedidos FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM visitas v
            WHERE v.id = pedidos.visita_id
            AND v.cliente_id = auth.uid()
            AND v.hora_salida IS NULL
        )
    );

-- Clientes pueden crear pedidos en su visita activa
CREATE POLICY "Clientes pueden crear pedidos en su visita"
    ON pedidos FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM visitas v
            WHERE v.id = pedidos.visita_id
            AND v.hora_salida IS NULL
        )
    );

-- Solo staff puede actualizar estado de pedidos
CREATE POLICY "Staff puede actualizar pedidos"
    ON pedidos FOR UPDATE
    TO authenticated
    USING (true);

-- Solo staff puede eliminar pedidos
CREATE POLICY "Staff puede eliminar pedidos"
    ON pedidos FOR DELETE
    TO authenticated
    USING (true);


-- ========== NOTIFICACIONES ==========
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Staff puede ver todas las notificaciones
CREATE POLICY "Staff puede ver todas las notificaciones"
    ON notificaciones FOR SELECT
    TO authenticated
    USING (true);

-- Clientes pueden crear notificaciones en su visita activa
CREATE POLICY "Clientes pueden crear notificaciones en su visita"
    ON notificaciones FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM visitas v
            WHERE v.id = notificaciones.visita_id
            AND v.hora_salida IS NULL
        )
    );

-- Clientes pueden ver sus propias notificaciones
CREATE POLICY "Clientes pueden ver sus notificaciones"
    ON notificaciones FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM visitas v
            WHERE v.id = notificaciones.visita_id
            AND v.cliente_id = auth.uid()
        )
    );

-- Solo staff puede actualizar notificaciones (marcar como leída/atendida)
CREATE POLICY "Staff puede actualizar notificaciones"
    ON notificaciones FOR UPDATE
    TO authenticated
    USING (true);

-- Solo staff puede eliminar notificaciones
CREATE POLICY "Staff puede eliminar notificaciones"
    ON notificaciones FOR DELETE
    TO authenticated
    USING (true);


-- ========== MESAS (Actualizar políticas existentes) ==========
-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON mesas;
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON mesas;

-- Todos pueden ver mesas (para QR check-in)
CREATE POLICY "Todos pueden ver estado de mesas"
    ON mesas FOR SELECT
    USING (true);

-- Solo staff puede modificar mesas
CREATE POLICY "Solo staff puede actualizar mesas"
    ON mesas FOR UPDATE
    TO authenticated
    USING (true);


-- ========== VISITAS (Mejorar políticas existentes) ==========
-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Allow read access to visitas for authenticated users" ON visitas;
DROP POLICY IF EXISTS "Allow insert access to visitas for authenticated users" ON visitas;
DROP POLICY IF EXISTS "Allow update access to visitas for authenticated users" ON visitas;

-- Staff puede ver todas las visitas
CREATE POLICY "Staff puede ver todas las visitas"
    ON visitas FOR SELECT
    TO authenticated
    USING (true);

-- Clientes pueden ver solo sus visitas
CREATE POLICY "Clientes pueden ver sus visitas"
    ON visitas FOR SELECT
    TO anon
    USING (cliente_id = auth.uid());

-- Todos pueden crear visitas (check-in público)
CREATE POLICY "Permitir creación de visitas"
    ON visitas FOR INSERT
    USING (true);

-- Solo staff puede actualizar visitas
CREATE POLICY "Solo staff puede actualizar visitas"
    ON visitas FOR UPDATE
    TO authenticated
    USING (true);


-- ========== RESERVAS (Mejorar políticas existentes) ==========
-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Allow read access to reservas for authenticated users" ON reservas;
DROP POLICY IF EXISTS "Allow insert access to reservas for authenticated users" ON reservas;
DROP POLICY IF EXISTS "Allow update access to reservas for authenticated users" ON reservas;

-- Staff puede ver todas las reservas
CREATE POLICY "Staff puede ver todas las reservas"
    ON reservas FOR SELECT
    TO authenticated
    USING (true);

-- Clientes pueden ver solo sus reservas
CREATE POLICY "Clientes pueden ver sus reservas"
    ON reservas FOR SELECT
    TO anon
    USING (cliente_id = auth.uid());

-- Staff puede crear reservas
CREATE POLICY "Staff puede crear reservas"
    ON reservas FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Staff puede actualizar reservas
CREATE POLICY "Staff puede actualizar reservas"
    ON reservas FOR UPDATE
    TO authenticated
    USING (true);


-- ========== CLIENTES (Mejorar políticas existentes) ==========
-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Allow read access to clientes for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Allow insert access to clientes for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Allow update access to clientes for authenticated users" ON clientes;

-- Staff puede ver todos los clientes
CREATE POLICY "Staff puede ver todos los clientes"
    ON clientes FOR SELECT
    TO authenticated
    USING (true);

-- Clientes pueden ver solo su propia información
CREATE POLICY "Clientes pueden ver su información"
    ON clientes FOR SELECT
    TO anon
    USING (id = auth.uid());

-- Permitir creación de clientes (registro público)
CREATE POLICY "Permitir registro de clientes"
    ON clientes FOR INSERT
    USING (true);

-- Clientes pueden actualizar solo su información
CREATE POLICY "Clientes pueden actualizar su información"
    ON clientes FOR UPDATE
    TO anon
    USING (id = auth.uid());

-- Staff puede actualizar cualquier cliente
CREATE POLICY "Staff puede actualizar clientes"
    ON clientes FOR UPDATE
    TO authenticated
    USING (true);


-- Verificar que todas las políticas estén activas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('productos', 'pedidos', 'notificaciones', 'mesas', 'visitas', 'reservas', 'clientes')
ORDER BY tablename, policyname;
