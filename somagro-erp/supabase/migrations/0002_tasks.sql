-- Tasks module

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  title text not null,
  description text,
  status text default 'open',
  priority text,
  due_date date,
  assigned_to uuid references users(id),
  created_at timestamptz default now()
);

alter table tasks enable row level security;

create policy tasks_tenant on tasks
  using (tenant_id = (select tenant_id from users where id = auth.uid()))
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));
