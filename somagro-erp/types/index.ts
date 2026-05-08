export type UUID = string;

export type SubscriptionTier = "basic" | "pro" | "enterprise";
export type UserRole =
  | "admin"
  | "manager"
  | "technician"
  | "veterinarian"
  | "accountant"
  | "worker"
  | "visitor";

export interface Tenant {
  id: UUID;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_tier: SubscriptionTier;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: UUID;
  tenant_id: UUID;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface Species {
  id: UUID;
  tenant_id: UUID;
  name: string;
  category: string | null;
  default_lifespan_days: number | null;
}

export interface Breed {
  id: UUID;
  species_id: UUID;
  name: string;
  avg_adult_weight_kg: number | null;
  characteristics: Record<string, unknown> | null;
}

export interface Lot {
  id: UUID;
  tenant_id: UUID;
  species_id: UUID;
  breed_id: UUID | null;
  building_id: UUID | null;
  name: string;
  batch_code: string | null;
  start_date: string;
  end_date: string | null;
  initial_count: number;
  current_count: number | null;
  status: "active" | "completed" | "culled";
  notes: string | null;
  created_at: string;
}

export interface Animal {
  id: UUID;
  tenant_id: UUID;
  lot_id: UUID | null;
  identification_number: string | null;
  rfid_tag: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  health_status: string | null;
  notes: string | null;
}

export interface LivestockEvent {
  id: UUID;
  tenant_id: UUID;
  lot_id: UUID | null;
  animal_id: UUID | null;
  event_type:
    | "birth"
    | "death"
    | "sale"
    | "purchase"
    | "transfer_in"
    | "transfer_out";
  quantity: number;
  event_date: string;
  reason: string | null;
  weight_kg: number | null;
  price: number | null;
  created_by: UUID | null;
  created_at: string;
}

export interface HealthRecord {
  id: UUID;
  tenant_id: UUID;
  lot_id: UUID | null;
  animal_id: UUID | null;
  record_type: "treatment" | "vaccination" | "checkup" | "symptom";
  diagnosis: string | null;
  treatment: string | null;
  medication_id: UUID | null;
  dosage: string | null;
  withdrawal_days: number | null;
  administered_by: UUID | null;
  administered_date: string;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Field {
  id: UUID;
  tenant_id: UUID;
  name: string;
  area_hectares: number;
  soil_type: string | null;
  gps_coordinates: Record<string, unknown> | null;
  status: "active" | "fallow" | "retired";
  notes: string | null;
}

export interface CropCycle {
  id: UUID;
  tenant_id: UUID;
  field_id: UUID;
  crop_type: string;
  variety: string | null;
  planting_date: string;
  expected_harvest_date: string | null;
  actual_harvest_date: string | null;
  area_planted: number | null;
  status: "planned" | "growing" | "harvested" | "failed";
  notes: string | null;
}

export interface CropIntervention {
  id: UUID;
  tenant_id: UUID;
  crop_cycle_id: UUID;
  intervention_type: "irrigation" | "fertilization" | "pesticide" | "weeding";
  product_id: UUID | null;
  quantity_used: number | null;
  unit: string | null;
  application_date: string;
  applied_by: UUID | null;
  notes: string | null;
}

export interface Harvest {
  id: UUID;
  tenant_id: UUID;
  crop_cycle_id: UUID;
  harvest_date: string;
  quantity: number;
  unit: string;
  quality_grade: string | null;
  destination: string | null;
  notes: string | null;
}

export interface BuildingType {
  id: UUID;
  tenant_id: UUID;
  name: string;
  category: string | null;
}

export interface Building {
  id: UUID;
  tenant_id: UUID;
  building_type_id: UUID | null;
  name: string;
  code: string | null;
  construction_date: string | null;
  dimensions: Record<string, unknown> | null;
  capacity: number | null;
  current_occupancy: number | null;
  gps_coordinates: Record<string, unknown> | null;
  status: "operational" | "maintenance" | "construction" | "retired";
  notes: string | null;
}

export interface Equipment {
  id: UUID;
  tenant_id: UUID;
  building_id: UUID | null;
  name: string;
  equipment_type: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  installation_date: string | null;
  warranty_end: string | null;
  maintenance_interval_days: number | null;
  last_maintenance_date: string | null;
  status: string | null;
  notes: string | null;
}

export interface ConstructionProject {
  id: UUID;
  tenant_id: UUID;
  building_id: UUID | null;
  project_name: string;
  project_type: "new" | "renovation" | "extension" | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  actual_cost: number | null;
  contractor: string | null;
  status: "planned" | "in_progress" | "completed" | "on_hold";
  documents_urls: string[] | null;
  notes: string | null;
}

export interface Camera {
  id: UUID;
  tenant_id: UUID;
  building_id: UUID | null;
  name: string;
  rtsp_url: string | null;
  model: string | null;
  location_description: string | null;
  species_targeted: string[] | null;
  counting_line_points: Record<string, unknown> | null;
  direction_config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface CountingSession {
  id: UUID;
  tenant_id: UUID;
  camera_id: UUID | null;
  lot_id: UUID | null;
  start_time: string;
  end_time: string | null;
  mode: "live" | "uploaded_video" | "batch_photos" | null;
  status: "processing" | "completed" | "failed" | "pending_review";
  confidence_score: number | null;
  entries_count: number | null;
  exits_count: number | null;
  net_change: number | null;
  video_url: string | null;
  error_message: string | null;
  created_at: string;
}

export interface InventoryCategory {
  id: UUID;
  tenant_id: UUID;
  name: string;
  unit: string | null;
}

export interface InventoryItem {
  id: UUID;
  tenant_id: UUID;
  category_id: UUID | null;
  name: string;
  sku: string | null;
  unit: string;
  current_stock: number;
  min_stock_threshold: number | null;
  max_stock_threshold: number | null;
  unit_price: number | null;
  location: string | null;
  expiry_date: string | null;
  supplier: string | null;
  created_at: string;
}

export interface InventoryMovement {
  id: UUID;
  tenant_id: UUID;
  item_id: UUID;
  movement_type: "purchase" | "consumption" | "loss" | "return";
  quantity: number;
  unit_price: number | null;
  total_cost: number | null;
  reference_type: string | null;
  reference_id: UUID | null;
  movement_date: string;
  notes: string | null;
  created_by: UUID | null;
}

export interface Customer {
  id: UUID;
  tenant_id: UUID;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  created_at: string;
}

export interface Sale {
  id: UUID;
  tenant_id: UUID;
  customer_id: UUID | null;
  sale_date: string;
  invoice_number: string | null;
  total_amount: number;
  status: "draft" | "confirmed" | "paid" | "cancelled";
  notes: string | null;
}

export interface SaleItem {
  id: UUID;
  sale_id: UUID;
  product_type: "animal" | "crop" | "processed_good" | null;
  product_id: UUID | null;
  quantity: number;
  unit_price: number;
  total: number | null;
}

export interface FinancialTransaction {
  id: UUID;
  tenant_id: UUID;
  transaction_type: "income" | "expense";
  category: string | null;
  amount: number;
  transaction_date: string;
  reference_type: string | null;
  reference_id: UUID | null;
  description: string | null;
  created_by: UUID | null;
}

export interface Task {
  id: UUID;
  tenant_id: UUID;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "completed";
  priority: string | null;
  due_date: string | null;
  assigned_to: UUID | null;
  created_at: string;
}
