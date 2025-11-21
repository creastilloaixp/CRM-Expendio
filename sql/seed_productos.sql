-- =====================================================
-- DATOS SEED PARA PRODUCTOS DEL MENÚ
-- =====================================================

-- Limpiar tabla si existe (solo para desarrollo)
-- TRUNCATE TABLE productos CASCADE;

-- CERVEZAS
INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
('Corona Extra', 'Cerveza clara mexicana 355ml', 45.00, 'Cervezas', true),
('Modelo Especial', 'Cerveza clara mexicana 355ml', 45.00, 'Cervezas', true),
('Victoria', 'Cerveza tipo vienna 355ml', 40.00, 'Cervezas', true),
('Pacifico', 'Cerveza clara tipo pilsner 355ml', 45.00, 'Cervezas', true),
('Heineken', 'Cerveza lager importada 355ml', 55.00, 'Cervezas', true),
('Stella Artois', 'Cerveza lager belga 330ml', 60.00, 'Cervezas', true),
('Indio', 'Cerveza oscura tipo vienna 355ml', 40.00, 'Cervezas', true),
('Dos Equis Lager', 'Cerveza lager clara 355ml', 45.00, 'Cervezas', true),
('Michelada Clásica', 'Cerveza preparada con limón y sal', 65.00, 'Cervezas', true),
('Michelada Chamoy', 'Cerveza con chamoy y tamarindo', 70.00, 'Cervezas', true);

-- HAMBURGUESAS
INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
('Hamburguesa Clásica', 'Carne de res 150g, lechuga, tomate, cebolla, pepinillos', 120.00, 'Hamburguesas', true),
('Hamburguesa con Queso', 'Carne de res 150g, queso cheddar, lechuga, tomate', 135.00, 'Hamburguesas', true),
('Hamburguesa BBQ', 'Carne de res 150g, tocino, queso, salsa BBQ, aros de cebolla', 155.00, 'Hamburguesas', true),
('Hamburguesa Mexicana', 'Carne de res 150g, guacamole, jalapeños, queso manchego', 160.00, 'Hamburguesas', true),
('Hamburguesa Doble', 'Doble carne de res 300g, doble queso, tocino', 180.00, 'Hamburguesas', true),
('Hamburguesa de Pollo', 'Pechuga de pollo empanizada, lechuga, tomate, mayonesa', 115.00, 'Hamburguesas', true),
('Hamburguesa Vegetariana', 'Medallón de lentejas y quinoa, vegetales asados', 110.00, 'Hamburguesas', true);

-- TACOS
INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
('Orden de Tacos al Pastor', '3 tacos con carne al pastor, piña, cebolla, cilantro', 85.00, 'Tacos', true),
('Orden de Tacos de Asada', '3 tacos de carne asada, cebolla, cilantro, limón', 90.00, 'Tacos', true),
('Orden de Tacos de Pollo', '3 tacos de pollo marinado, pico de gallo', 80.00, 'Tacos', true),
('Orden de Tacos de Carnitas', '3 tacos de carnitas estilo Michoacán', 85.00, 'Tacos', true),
('Orden de Tacos de Pescado', '3 tacos de pescado empanizado, repollo, chipotle', 95.00, 'Tacos', true),
('Orden de Tacos Vegetarianos', '3 tacos de hongos y queso, frijoles, aguacate', 75.00, 'Tacos', true);

-- ALITAS
INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
('Alitas BBQ (6 pzas)', 'Alitas con salsa BBQ casera', 110.00, 'Alitas', true),
('Alitas Buffalo (6 pzas)', 'Alitas picantes estilo Buffalo', 110.00, 'Alitas', true),
('Alitas Mango Habanero (6 pzas)', 'Alitas con salsa dulce y picante', 115.00, 'Alitas', true),
('Alitas Naturales (6 pzas)', 'Alitas al natural con limón y sal', 100.00, 'Alitas', true),
('Alitas BBQ (12 pzas)', 'Alitas con salsa BBQ casera', 200.00, 'Alitas', true),
('Alitas Buffalo (12 pzas)', 'Alitas picantes estilo Buffalo', 200.00, 'Alitas', true);

-- BEBIDAS
INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
('Refresco 600ml', 'Coca-Cola, Sprite, Fanta, Manzanita', 30.00, 'Bebidas', true),
('Agua Natural 1L', 'Agua purificada', 25.00, 'Bebidas', true),
('Agua Mineral', 'Agua con gas 355ml', 35.00, 'Bebidas', true),
('Limonada Natural', 'Limonada recién preparada 500ml', 40.00, 'Bebidas', true),
('Naranjada Natural', 'Jugo de naranja recién exprimido 500ml', 45.00, 'Bebidas', true),
('Café Americano', 'Café recién preparado', 35.00, 'Bebidas', true),
('Café Capuchino', 'Café con espuma de leche', 45.00, 'Bebidas', true),
('Té Helado', 'Té negro frío con limón', 35.00, 'Bebidas', true);

-- ENTRADAS
INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
('Nachos con Queso', 'Totopos con queso cheddar fundido', 85.00, 'Entradas', true),
('Nachos Supremos', 'Totopos con queso, carne, frijoles, guacamole, crema', 125.00, 'Entradas', true),
('Papas a la Francesa', 'Papas fritas crujientes', 60.00, 'Entradas', true),
('Papas Gajo', 'Papas en gajos con especias', 65.00, 'Entradas', true),
('Guacamole con Totopos', 'Guacamole fresco con chips', 75.00, 'Entradas', true),
('Queso Fundido', 'Queso manchego fundido con chorizo', 95.00, 'Entradas', true),
('Dedos de Queso', '6 piezas de queso mozzarella empanizado', 90.00, 'Entradas', true),
('Aros de Cebolla', 'Aros de cebolla empanizados crujientes', 70.00, 'Entradas', true);

-- POSTRES
INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES
('Helado (2 bolas)', 'Chocolate, vainilla o fresa', 50.00, 'Postres', true),
('Brownie con Helado', 'Brownie de chocolate caliente con helado de vainilla', 75.00, 'Postres', true),
('Churros (4 pzas)', 'Churros con cajeta o chocolate', 60.00, 'Postres', true),
('Pay de Queso', 'Rebanada de pay de queso con frutos rojos', 70.00, 'Postres', true),
('Flan Napolitano', 'Flan casero', 55.00, 'Postres', true);

-- Verificar inserción
SELECT
    categoria,
    COUNT(*) as total_productos,
    AVG(precio)::DECIMAL(10,2) as precio_promedio
FROM productos
GROUP BY categoria
ORDER BY categoria;
