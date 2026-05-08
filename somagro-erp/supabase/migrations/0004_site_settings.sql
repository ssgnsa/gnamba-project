-- Parametres de vitrine (site_settings)

create table if not exists site_settings (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  site_name text,
  tagline text,
  primary_color text,
  secondary_color text,
  logo_url text,
  hero_title text,
  hero_subtitle text,
  cta_label text,
  cta_url text,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table site_settings enable row level security;

drop policy if exists site_settings_public on site_settings;
create policy site_settings_public
  on site_settings
  for select
  using (is_public = true);

drop policy if exists site_settings_tenant on site_settings;
create policy site_settings_tenant
  on site_settings
  using (tenant_id = (select tenant_id from users where id = auth.uid()))
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));
