-- Script SQL alternativo para insertar las mesas correctas si la tabla está vacía o tiene nombres incorrectos
-- Este script puede usarse si el primer script no funciona o si necesitas recrear las mesas

-- Opción 1: Si la tabla está vacía, insertar todas las mesas
INSERT INTO mesas (nombre, capacidad, estado) VALUES
-- Zona A (5 mesas, capacidad 4)
('A1', 4, 'Libre'),
('A2', 4, 'Libre'),
('A3', 4, 'Libre'),
('A4', 4, 'Libre'),
('A5', 4, 'Libre'),

-- Zona B (5 mesas, capacidad 4)
('B1', 4, 'Libre'),
('B2', 4, 'Ocupada'), -- Mesa ocupada inicialmente para demo
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
('F3', 4, 'Ocupada'), -- Mesa ocupada inicialmente para demo
('F4', 4, 'Libre'),
('F5', 4, 'Libre'),

-- Zona G (6 mesas, capacidad 6)
('G1', 6, 'Reservada'), -- Mesa reservada inicialmente para demo
('G2', 6, 'Libre'),
('G3', 6, 'Libre'),
('G4', 6, 'Libre'),
('G5', 6, 'Libre'),
('G6', 6, 'Libre'),

-- Terraza (3 mesas, capacidad 2)
('Terraza 1', 2, 'Libre'),
('Terraza 2', 2, 'Ocupada'), -- Mesa ocupada inicialmente para demo
('Terraza 3', 2, 'Libre');

-- Opción 2: Si necesitas limpiar y reinsertar (DESCOMENTAR SI ES NECESARIO)
-- DELETE FROM mesas;
-- Luego ejecutar el INSERT de arriba

-- Verificar los datos insertados
SELECT * FROM mesas ORDER BY nombre;