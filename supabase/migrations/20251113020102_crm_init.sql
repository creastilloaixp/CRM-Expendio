create extension if not exists pgcrypto;

create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  capacidad integer not null,
  estado text not null check (estado in ('Libre','Ocupada','Reservada','Limpiando')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique,
  telefono text,
  fecha_nacimiento date,
  fecha_creacion timestamptz not null default now(),
  marketing_opt_in boolean default false,
  created_by uuid default auth.uid()
);

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete restrict,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  hora_llegada timestamptz not null,
  hora_salida timestamptz,
  numero_personas integer not null,
  consumo_total numeric(12,2),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete restrict,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  fecha_hora timestamptz not null,
  numero_personas integer not null,
  estado text not null check (estado in ('Confirmada','Completada','Cancelada')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists visitas_cliente_idx on public.visitas (cliente_id);
create index if not exists visitas_mesa_idx on public.visitas (mesa_id);
create index if not exists visitas_created_at_idx on public.visitas (created_at);
create index if not exists reservas_mesa_idx on public.reservas (mesa_id);
create index if not exists reservas_cliente_idx on public.reservas (cliente_id);
create index if not exists reservas_fecha_idx on public.reservas (fecha_hora desc);

alter table public.mesas enable row level security;
alter table public.clientes enable row level security;
alter table public.visitas enable row level security;
alter table public.reservas enable row level security;

create policy mesas_select on public.mesas for select using (created_by = auth.uid());
create policy mesas_insert on public.mesas for insert with check (created_by = auth.uid());
create policy mesas_update on public.mesas for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy mesas_delete on public.mesas for delete using (created_by = auth.uid());

create policy clientes_select on public.clientes for select using (created_by = auth.uid());
create policy clientes_insert on public.clientes for insert with check (created_by = auth.uid());
create policy clientes_update on public.clientes for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy clientes_delete on public.clientes for delete using (created_by = auth.uid());

create policy visitas_select on public.visitas for select using (created_by = auth.uid());
create policy visitas_insert on public.visitas for insert with check (created_by = auth.uid());
create policy visitas_update on public.visitas for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy visitas_delete on public.visitas for delete using (created_by = auth.uid());

create policy reservas_select on public.reservas for select using (created_by = auth.uid());
create policy reservas_insert on public.reservas for insert with check (created_by = auth.uid());
create policy reservas_update on public.reservas for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy reservas_delete on public.reservas for delete using (created_by = auth.uid());