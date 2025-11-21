-- Script SQL para actualizar los nombres de las mesas en la base de datos de Supabase
-- Este script actualiza los nombres de las mesas para que coincidan con el croquis real del expendio

-- Actualizar mesas de la zona A (5 mesas, capacidad 4)
UPDATE mesas SET nombre = 'A1' WHERE nombre = 'mesa 1';
UPDATE mesas SET nombre = 'A2' WHERE nombre = 'mesa 2';
UPDATE mesas SET nombre = 'A3' WHERE nombre = 'mesa 3';
UPDATE mesas SET nombre = 'A4' WHERE nombre = 'mesa 4';
UPDATE mesas SET nombre = 'A5' WHERE nombre = 'mesa 5';

-- Actualizar mesas de la zona B (5 mesas, capacidad 4)
UPDATE mesas SET nombre = 'B1' WHERE nombre = 'mesa 6';
UPDATE mesas SET nombre = 'B2' WHERE nombre = 'mesa 7';
UPDATE mesas SET nombre = 'B3' WHERE nombre = 'mesa 8';
UPDATE mesas SET nombre = 'B4' WHERE nombre = 'mesa 9';
UPDATE mesas SET nombre = 'B5' WHERE nombre = 'mesa 10';

-- Actualizar mesas de la zona C (5 mesas, capacidad 2)
UPDATE mesas SET nombre = 'C1' WHERE nombre = 'mesa 11';
UPDATE mesas SET nombre = 'C2' WHERE nombre = 'mesa 12';
UPDATE mesas SET nombre = 'C3' WHERE nombre = 'mesa 13';
UPDATE mesas SET nombre = 'C4' WHERE nombre = 'mesa 14';
UPDATE mesas SET nombre = 'C5' WHERE nombre = 'mesa 15';

-- Actualizar mesas de la zona D (5 mesas, capacidad 4)
UPDATE mesas SET nombre = 'D1' WHERE nombre = 'mesa 16';
UPDATE mesas SET nombre = 'D2' WHERE nombre = 'mesa 17';
UPDATE mesas SET nombre = 'D3' WHERE nombre = 'mesa 18';
UPDATE mesas SET nombre = 'D4' WHERE nombre = 'mesa 19';
UPDATE mesas SET nombre = 'D5' WHERE nombre = 'mesa 20';

-- Actualizar mesas de la zona E (4 mesas, capacidad 2)
UPDATE mesas SET nombre = 'E1' WHERE nombre = 'mesa 21';
UPDATE mesas SET nombre = 'E2' WHERE nombre = 'mesa 22';
UPDATE mesas SET nombre = 'E3' WHERE nombre = 'mesa 23';
UPDATE mesas SET nombre = 'E4' WHERE nombre = 'mesa 24';

-- Actualizar mesas de la zona F (5 mesas, capacidad 4)
UPDATE mesas SET nombre = 'F1' WHERE nombre = 'mesa 25';
UPDATE mesas SET nombre = 'F2' WHERE nombre = 'mesa 26';
UPDATE mesas SET nombre = 'F3' WHERE nombre = 'mesa 27';
UPDATE mesas SET nombre = 'F4' WHERE nombre = 'mesa 28';
UPDATE mesas SET nombre = 'F5' WHERE nombre = 'mesa 29';

-- Actualizar mesas de la zona G (6 mesas, capacidad 6)
UPDATE mesas SET nombre = 'G1' WHERE nombre = 'mesa 30';
UPDATE mesas SET nombre = 'G2' WHERE nombre = 'mesa 31';
UPDATE mesas SET nombre = 'G3' WHERE nombre = 'mesa 32';
UPDATE mesas SET nombre = 'G4' WHERE nombre = 'mesa 33';
UPDATE mesas SET nombre = 'G5' WHERE nombre = 'mesa 34';
UPDATE mesas SET nombre = 'G6' WHERE nombre = 'mesa 35';

-- Actualizar mesas de la terraza (3 mesas, capacidad 2)
UPDATE mesas SET nombre = 'Terraza 1' WHERE nombre = 'mesa 36';
UPDATE mesas SET nombre = 'Terraza 2' WHERE nombre = 'mesa 37';
UPDATE mesas SET nombre = 'Terraza 3' WHERE nombre = 'mesa 38';

-- Si hay más mesas, puedes agregar más actualizaciones aquí

-- Verificar los cambios
SELECT id, nombre, capacidad, estado FROM mesas ORDER BY nombre;