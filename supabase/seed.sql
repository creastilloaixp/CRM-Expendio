insert into public.mesas (nombre, capacidad, estado) values
('A1',4,'Libre'),
('A2',4,'Libre'),
('B2',4,'Ocupada'),
('F3',4,'Ocupada'),
('G1',6,'Reservada'),
('Terraza 2',2,'Ocupada');

insert into public.clientes (nombre, email, telefono, marketing_opt_in) values
('Juan Pérez','juan.perez@email.com','5512345678',true),
('Ana García','ana.garcia@email.com','5587654321',false);

insert into public.reservas (mesa_id, cliente_id, fecha_hora, numero_personas, estado)
select m.id, c.id, now() + interval '3 hours', 5, 'Confirmada'
from public.mesas m, public.clientes c
where m.nombre = 'G1' and c.email = 'ana.garcia@email.com';

insert into public.visitas (mesa_id, cliente_id, hora_llegada, numero_personas)
select m.id, c.id, now() - interval '1 hour', 3
from public.mesas m, public.clientes c
where m.nombre = 'B2' and c.email = 'juan.perez@email.com';

insert into public.visitas (mesa_id, cliente_id, hora_llegada, hora_salida, consumo_total, numero_personas)
select m.id, c.id, now() - interval '2 days', now() - interval '2 days' + interval '2 hours', 850.50, 4
from public.mesas m, public.clientes c
where m.nombre = 'A1' and c.email = 'juan.perez@email.com';