# Eliminar Mesas de Prueba (1-8)

## Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Table Editor** → **mesas**
4. Filtra o busca las mesas con nombres "1", "2", "3", "4", "5", "6", "7", "8"
5. Selecciona cada una y elimínala

## Opción 2: SQL Query (Más rápido)

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta esta query:

```sql
-- Ver las mesas que se van a eliminar
SELECT * FROM mesas
WHERE nombre IN ('1', '2', '3', '4', '5', '6', '7', '8');

-- Si las mesas mostradas son correctas, elimínalas:
DELETE FROM mesas
WHERE nombre IN ('1', '2', '3', '4', '5', '6', '7', '8');
```

## Opción 3: Eliminar TODAS las mesas y regenerar

Si quieres empezar desde cero con las mesas correctas:

```sql
-- ⚠️ ADVERTENCIA: Esto eliminará TODAS las mesas, visitas y reservas relacionadas

-- 1. Ver cuántas mesas hay
SELECT COUNT(*) FROM mesas;

-- 2. Eliminar todas las mesas (esto también eliminará visitas y reservas por CASCADE)
DELETE FROM mesas;

-- 3. Insertar las mesas correctas
INSERT INTO mesas (nombre, capacidad, estado) VALUES
-- Zona A (4 personas)
('A1', 4, 'Libre'),
('A2', 4, 'Libre'),
('A3', 4, 'Libre'),
('A4', 4, 'Libre'),
('A5', 4, 'Libre'),

-- Zona B (4 personas)
('B1', 4, 'Libre'),
('B2', 4, 'Libre'),
('B3', 4, 'Libre'),
('B4', 4, 'Libre'),
('B5', 4, 'Libre'),

-- Zona C (2 personas)
('C1', 2, 'Libre'),
('C2', 2, 'Libre'),
('C3', 2, 'Libre'),
('C4', 2, 'Libre'),
('C5', 2, 'Libre'),

-- Zona D (4 personas)
('D1', 4, 'Libre'),
('D2', 4, 'Libre'),
('D3', 4, 'Libre'),
('D4', 4, 'Libre'),
('D5', 4, 'Libre'),

-- Zona E (2 personas)
('E1', 2, 'Libre'),
('E2', 2, 'Libre'),
('E3', 2, 'Libre'),
('E4', 2, 'Libre'),

-- Zona F (4 personas)
('F1', 4, 'Libre'),
('F2', 4, 'Libre'),
('F3', 4, 'Libre'),
('F4', 4, 'Libre'),
('F5', 4, 'Libre'),

-- Zona G (6 personas - mesas grandes)
('G1', 6, 'Libre'),
('G2', 6, 'Libre'),
('G3', 6, 'Libre'),
('G4', 6, 'Libre'),
('G5', 6, 'Libre'),
('G6', 6, 'Libre'),

-- Terraza (2 personas)
('Terraza 1', 2, 'Libre'),
('Terraza 2', 2, 'Libre'),
('Terraza 3', 2, 'Libre');
```

## Verificar que las mesas están correctas

```sql
-- Contar mesas por zona
SELECT
  SUBSTRING(nombre, 1, 1) as zona,
  COUNT(*) as cantidad,
  MAX(capacidad) as capacidad
FROM mesas
WHERE nombre NOT LIKE 'Terraza%'
GROUP BY SUBSTRING(nombre, 1, 1)
ORDER BY zona;

-- Ver todas las mesas
SELECT * FROM mesas ORDER BY nombre;
```

**Resultado esperado:**
- 38 mesas en total
- Zonas A-D y F: 5 mesas de 4 personas cada una
- Zona C y E: 5 y 4 mesas de 2 personas
- Zona G: 6 mesas de 6 personas
- Terraza: 3 mesas de 2 personas

## ⚠️ IMPORTANTE

Después de ejecutar cualquiera de estas opciones, **recarga la página** en tu aplicación para que se actualicen los datos.

Si usaste la Opción 3 (eliminar todas las mesas), ten en cuenta que:
- Se eliminarán todas las visitas actuales
- Se eliminarán todas las reservas actuales
- Los clientes NO se eliminarán (están en otra tabla)
