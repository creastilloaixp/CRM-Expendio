-- Script para verificar el estado actual de las mesas en Supabase
-- Este script te ayudará a ver qué nombres tienen actualmente las mesas

-- Ver todas las mesas con su estado actual
SELECT 
    id, 
    nombre, 
    capacidad, 
    estado,
    created_at
FROM mesas 
ORDER BY nombre;

-- Contar mesas por estado
SELECT 
    estado,
    COUNT(*) as cantidad
FROM mesas 
GROUP BY estado
ORDER BY cantidad DESC;

-- Verificar si hay mesas con nombres que no coinciden con el formato esperado
SELECT 
    id, 
    nombre,
    CASE 
        WHEN nombre ~ '^[A-G][1-9]$' THEN 'Formato correcto (A1, B2, etc.)'
        WHEN nombre ~ '^Terraza [1-9]$' THEN 'Formato terraza correcto'
        WHEN nombre ~ '^mesa [0-9]+$' THEN 'Formato antiguo (mesa X)'
        ELSE 'Otro formato'
    END as tipo_formato
FROM mesas
ORDER BY tipo_formato, nombre;