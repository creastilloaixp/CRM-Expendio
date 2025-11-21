-- Script para eliminar las mesas que no existen en el restaurante
-- Eliminar mesas numéricas 1-8 que no están en el croquis real
-- Mantener solo mesas con letras (A-G) y terraza

-- PASO 1: Verificar qué mesas tenemos actualmente
SELECT id, nombre, capacidad, estado, 
       CASE 
           WHEN nombre ~ '^[0-9]+$' THEN 'Numérica'
           WHEN nombre ~ '^Mesa [0-9]+$' THEN 'Formato antiguo'
           WHEN nombre ~ '^[A-G][0-9]+$' THEN 'Formato letras (correcto)'
           WHEN nombre ~ '^Terraza [0-9]+$' THEN 'Terraza (correcto)'
           ELSE 'Otro formato'
       END as tipo_mesa
FROM mesas 
ORDER BY nombre;

-- PASO 2: Eliminar mesas numéricas que no existen en el croquis (1-8)
-- Estas mesas no existen físicamente en el restaurante
DELETE FROM mesas 
WHERE nombre IN ('1', '2', '3', '4', '5', '6', '7', '8') 
   OR nombre IN ('Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8');

-- PASO 3: Verificar que tenemos las mesas correctas después de la eliminación
SELECT id, nombre, capacidad, estado,
       CASE 
           WHEN nombre ~ '^[A-G][0-9]+$' THEN 'Formato letras (correcto)'
           WHEN nombre ~ '^Terraza [0-9]+$' THEN 'Terraza (correcto)'
           ELSE 'REVISAR'
       END as tipo_mesa
FROM mesas 
ORDER BY nombre;

-- PASO 4: Si no hay mesas con formato correcto, insertar las mesas reales
-- Las mesas del croquis real son:
-- Zona A: A1-A5 (capacidad 4)
-- Zona B: B1-B5 (capacidad 4) 
-- Zona C: C1-C5 (capacidad 2)
-- Zona D: D1-D5 (capacidad 4)
-- Zona E: E1-E4 (capacidad 2)
-- Zona F: F1-F5 (capacidad 4)
-- Zona G: G1-G6 (capacidad 6)
-- Terraza: Terraza 1-3 (capacidad 2)

-- Solo ejecutar este INSERT si la tabla está vacía o solo tiene mesas incorrectas
INSERT INTO mesas (nombre, capacidad, estado) VALUES
-- Zona A (5 mesas, capacidad 4)
('A1', 4, 'Libre'),
('A2', 4, 'Libre'),
('A3', 4, 'Libre'),
('A4', 4, 'Libre'),
('A5', 4, 'Libre'),

-- Zona B (5 mesas, capacidad 4)
('B1', 4, 'Libre'),
('B2', 4, 'Libre'),
('B3', 4, 'Libre'),
('B4', 4, 'Libre'),
('B5', 4, 'Libre'),

-- Zona C (5 mesas, capacidad 2)
('C1', 2, 'Libre'),
('C2', 2, 'Libre'),
('C3', 2, 'Libre'),
('C4', 2, 'Libre'),
('C5', 2, 'Libre'),

-- Zona D (5 mesas, capacidad 4)
('D1', 4, 'Libre'),
('D2', 4, 'Libre'),
('D3', 4, 'Libre'),
('D4', 4, 'Libre'),
('D5', 4, 'Libre'),

-- Zona E (4 mesas, capacidad 2)
('E1', 2, 'Libre'),
('E2', 2, 'Libre'),
('E3', 2, 'Libre'),
('E4', 2, 'Libre'),

-- Zona F (5 mesas, capacidad 4)
('F1', 4, 'Libre'),
('F2', 4, 'Libre'),
('F3', 4, 'Libre'),
('F4', 4, 'Libre'),
('F5', 4, 'Libre'),

-- Zona G (6 mesas, capacidad 6)
('G1', 6, 'Libre'),
('G2', 6, 'Libre'),
('G3', 6, 'Libre'),
('G4', 6, 'Libre'),
('G5', 6, 'Libre'),
('G6', 6, 'Libre'),

-- Terraza (3 mesas, capacidad 2)
('Terraza 1', 2, 'Libre'),
('Terraza 2', 2, 'Libre'),
('Terraza 3', 2, 'Libre')

ON CONFLICT (nombre) DO NOTHING;

-- PASO 5: Verificar el resultado final
SELECT COUNT(*) as total_mesas,
       COUNT(CASE WHEN nombre ~ '^[A-G][0-9]+$' THEN 1 END) as mesas_letras,
       COUNT(CASE WHEN nombre ~ '^Terraza [0-9]+$' THEN 1 END) as mesas_terraza
FROM mesas;

-- PASO 6: Listado final de mesas correctas
SELECT nombre, capacidad, estado
FROM mesas 
ORDER BY 
    CASE 
        WHEN nombre ~ '^[A-G][0-9]+$' THEN SUBSTRING(nombre FROM 1 FOR 1)  -- Ordenar por letra
        WHEN nombre ~ '^Terraza [0-9]+$' THEN 'Z'  -- Terrazas al final
    END,
    CASE 
        WHEN nombre ~ '^[A-G][0-9]+$' THEN CAST(SUBSTRING(nombre FROM 2) AS INTEGER)  -- Ordenar por número
        WHEN nombre ~ '^Terraza [0-9]+$' THEN CAST(SUBSTRING(nombre FROM 9) AS INTEGER)  -- Número de terraza
    END;