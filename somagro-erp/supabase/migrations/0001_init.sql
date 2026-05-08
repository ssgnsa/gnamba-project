-- SomAgro ERP base schema

create extension if not exists "pgcrypto";

-- Tenants
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  subscription_tier text default 'basic',
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users
create table if not exists users (
  id uuid primary key references auth.users(id),
  tenant_id uuid references tenants(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null,
  phone text,
  avatar_url text,
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now()
);

alter table tenants enable row level security;
alter table users enable row level security;

create policy tenant_isolation on users
  using (tenant_id = (select tenant_id from users where id = auth.uid()));

create policy tenant_self on tenants
  using (id = (select tenant_id from users where id = auth.uid()));

-- Inventory categories
create table if not exists inventory_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text not null,
  unit text
);

-- Inventory items
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  category_id uuid references inventory_categories(id),
  name text not null,
  sku text unique,
  unit text not null,
  current_stock decimal(10,2) default 0,
  min_stock_threshold decimal(10,2),
  max_stock_threshold decimal(10,2),
  unit_price decimal(10,2),
  location text,
  expiry_date date,
  supplier text,
  created_at timestamptz default now()
);

-- Inventory movements
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  item_id uuid references inventory_items(id),
  movement_type text not null,
  quantity decimal(10,2) not null,
  unit_price decimal(10,2),
  total_cost decimal(12,2),
  reference_type text,
  reference_id uuid,
  movement_date date not null,
  notes text,
  created_by uuid references users(id)
);

-- Building types
create table if not exists building_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text not null,
  category text
);

-- Buildings
create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  building_type_id uuid references building_types(id),
  name text not null,
  code text,
  construction_date date,
  dimensions jsonb,
  capacity int,
  current_occupancy int,
  gps_coordinates jsonb,
  status text default 'operational',
  notes text
);

-- Equipment
create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  building_id uuid references buildings(id),
  name text not null,
  equipment_type text,
  brand text,
  model text,
  serial_number text,
  installation_date date,
  warranty_end date,
  maintenance_interval_days int,
  last_maintenance_date date,
  status text default 'operational',
  notes text
);

-- Construction projects
create table if not exists construction_projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  building_id uuid references buildings(id),
  project_name text not null,
  project_type text,
  start_date date,
  end_date date,
  budget decimal(12,2),
  actual_cost decimal(12,2),
  contractor text,
  status text default 'planned',
  documents_urls text[],
  notes text
);

-- Species
create table if not exists species (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text not null,
  category text,
  default_lifespan_days int,
  unique (tenant_id, name)
);

-- Breeds
create table if not exists breeds (
  id uuid primary key default gen_random_uuid(),
  species_id uuid references species(id),
  name text not null,
  avg_adult_weight_kg decimal(8,2),
  characteristics jsonb
);

-- Lots
create table if not exists lots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  species_id uuid references species(id),
  breed_id uuid references breeds(id),
  building_id uuid references buildings(id),
  name text not null,
  batch_code text unique,
  start_date date not null,
  end_date date,
  initial_count int not null,
  current_count int,
  status text default 'active',
  notes text,
  created_at timestamptz default now()
);

-- Animals
create table if not exists animals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  lot_id uuid references lots(id),
  identification_number text unique,
  rfid_tag text,
  birth_date date,
  weight_kg decimal(8,2),
  health_status text default 'healthy',
  notes text
);

-- Livestock events
create table if not exists livestock_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  lot_id uuid references lots(id),
  animal_id uuid references animals(id),
  event_type text not null,
  quantity int not null,
  event_date date not null,
  reason text,
  weight_kg decimal(8,2),
  price decimal(10,2),
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Health records
create table if not exists health_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  lot_id uuid references lots(id),
  animal_id uuid references animals(id),
  record_type text not null,
  diagnosis text,
  treatment text,
  medication_id uuid references inventory_items(id),
  dosage text,
  withdrawal_days int,
  administered_by uuid references users(id),
  administered_date date not null,
  next_due_date date,
  notes text,
  created_at timestamptz default now()
);

-- Fields
create table if not exists fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text not null,
  area_hectares decimal(10,2) not null,
  soil_type text,
  gps_coordinates jsonb,
  status text default 'active',
  notes text
);

-- Crop cycles
create table if not exists crop_cycles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  field_id uuid references fields(id),
  crop_type text not null,
  variety text,
  planting_date date not null,
  expected_harvest_date date,
  actual_harvest_date date,
  area_planted decimal(10,2),
  status text default 'active',
  notes text
);

-- Crop interventions
create table if not exists crop_interventions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  crop_cycle_id uuid references crop_cycles(id),
  intervention_type text not null,
  product_id uuid references inventory_items(id),
  quantity_used decimal(10,2),
  unit text,
  application_date date not null,
  applied_by uuid references users(id),
  notes text
);

-- Harvests
create table if not exists harvests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  crop_cycle_id uuid references crop_cycles(id),
  harvest_date date not null,
  quantity decimal(10,2) not null,
  unit text not null,
  quality_grade text,
  destination text,
  notes text
);

-- Cameras
create table if not exists cameras (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  building_id uuid references buildings(id),
  name text not null,
  rtsp_url text,
  model text,
  location_description text,
  species_targeted text[],
  counting_line_points jsonb,
  direction_config jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Counting sessions
create table if not exists counting_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  camera_id uuid references cameras(id),
  lot_id uuid references lots(id),
  start_time timestamptz not null,
  end_time timestamptz,
  mode text,
  status text default 'processing',
  confidence_score decimal(3,2),
  entries_count int,
  exits_count int,
  net_change int,
  video_url text,
  error_message text,
  created_at timestamptz default now()
);

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  payment_terms text,
  created_at timestamptz default now()
);

-- Sales
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  customer_id uuid references customers(id),
  sale_date date not null,
  invoice_number text unique,
  total_amount decimal(12,2) not null,
  status text default 'draft',
  notes text
);

-- Sale items
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id),
  product_type text,
  product_id uuid,
  quantity decimal(10,2) not null,
  unit_price decimal(10,2) not null,
  total decimal(12,2) generated always as (quantity * unit_price) stored
);

-- Financial transactions
create table if not exists financial_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  transaction_type text not null,
  category text,
  amount decimal(12,2) not null,
  transaction_date date not null,
  reference_type text,
  reference_id uuid,
  description text,
  created_by uuid references users(id)
);
