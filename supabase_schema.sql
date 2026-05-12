-- HSV Pegnitz – Inventarverwaltung
-- Dieses SQL im Supabase SQL-Editor ausführen

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  role text not null check (role in ('VISITOR', 'MEMBER', 'ADMIN')) default 'VISITOR',
  created_at timestamptz default now(),
  push_subscription text
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cabinets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room_id uuid not null references rooms(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  count integer not null default 1 check (count >= 1),
  room_id uuid not null references rooms(id),
  cabinet_id uuid references cabinets(id) on delete set null,
  sport text,
  description text,
  status text not null check (status in ('OK', 'DEFECT', 'IN_REPAIR')) default 'OK',
  defect_note text,
  updated_at timestamptz default now()
);

create table if not exists change_log (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  user_id uuid not null references users(id),
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz default now()
);

-- Row-Level-Security aktivieren
alter table users enable row level security;
alter table rooms enable row level security;
alter table cabinets enable row level security;
alter table equipment enable row level security;
alter table change_log enable row level security;

-- Alle angemeldeten Benutzer (Anon-Key reicht) dürfen lesen
create policy "Alle lesen users" on users for select using (true);
create policy "Alle lesen rooms" on rooms for select using (true);
create policy "Alle lesen cabinets" on cabinets for select using (true);
create policy "Alle lesen equipment" on equipment for select using (true);
create policy "Alle lesen change_log" on change_log for select using (true);

-- Schreib-Rechte: Alles über den Anon-Key (Rollen-Check im Frontend; für MVP ok)
-- Für produktiven Einsatz: RLS-Policies mit user_id aus JWT erweitern

create policy "Alle schreiben rooms" on rooms for all using (true) with check (true);
create policy "Alle schreiben cabinets" on cabinets for all using (true) with check (true);
create policy "Alle schreiben equipment" on equipment for all using (true) with check (true);
create policy "Alle schreiben change_log" on change_log for all using (true) with check (true);
create policy "Alle schreiben users" on users for all using (true) with check (true);

-- Admin-Benutzer anlegen (Sabine)
insert into users (username, role) values ('sabine', 'ADMIN')
on conflict (username) do nothing;
