-- Site vitrine: blog + album photo

create table if not exists site_blog_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  title text not null,
  slug text unique,
  excerpt text,
  content text,
  cover_url text,
  published_at timestamptz,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists site_album_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  title text,
  caption text,
  image_url text not null,
  taken_at date,
  is_public boolean default true,
  created_at timestamptz default now()
);

alter table site_blog_posts enable row level security;
alter table site_album_photos enable row level security;

drop policy if exists site_blog_public on site_blog_posts;
create policy site_blog_public on site_blog_posts
  for select
  using (is_published = true);

drop policy if exists site_blog_tenant on site_blog_posts;
create policy site_blog_tenant on site_blog_posts
  using (tenant_id = (select tenant_id from users where id = auth.uid()))
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));

drop policy if exists site_album_public on site_album_photos;
create policy site_album_public on site_album_photos
  for select
  using (is_public = true);

drop policy if exists site_album_tenant on site_album_photos;
create policy site_album_tenant on site_album_photos
  using (tenant_id = (select tenant_id from users where id = auth.uid()))
  with check (tenant_id = (select tenant_id from users where id = auth.uid()));
