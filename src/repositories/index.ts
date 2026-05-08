/**
 * Repository Layer — Centralized data access for EGS
 *
 * Purpose:
 * - Abstract Supabase queries behind typed repository interfaces
 * - Enable future migration away from Supabase (only repository implementations change)
 * - Centralize error handling, logging, and retry logic
 * - Provide typed Insert/Update interfaces per entity
 *
 * Usage:
 *   import { clientRepository } from '../repositories/clientRepository'
 *   const clients = await clientRepository.getAll()
 */

import { supabase } from "../lib/supabase";
import type {
  Client,
  Project,
  Employee,
  Supplier,
  Product,
  Document,
  Task,
} from "../types";

// ============================================
// Insert/Update types (derived from table types)
// ============================================

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at"> & {
  id?: string;
};
export type ClientUpdate = Partial<
  Omit<Client, "id" | "created_at" | "updated_at">
>;

export type ProjectInsert = Omit<
  Project,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};
export type ProjectUpdate = Partial<
  Omit<Project, "id" | "created_at" | "updated_at" | "clients">
>;

export type EmployeeInsert = Omit<
  Employee,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};
export type EmployeeUpdate = Partial<
  Omit<Employee, "id" | "created_at" | "updated_at">
>;

export type SupplierInsert = Omit<
  Supplier,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};
export type SupplierUpdate = Partial<
  Omit<Supplier, "id" | "created_at" | "updated_at">
>;

export type ProductInsert = Omit<
  Product,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};
export type ProductUpdate = Partial<
  Omit<Product, "id" | "created_at" | "updated_at">
>;

export type DocumentInsert = Omit<Document, "id" | "created_at"> & {
  id?: string;
};
export type DocumentUpdate = Partial<Omit<Document, "id" | "created_at">>;

export type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at"> & {
  id?: string;
};
export type TaskUpdate = Partial<
  Omit<Task, "id" | "created_at" | "updated_at" | "employees" | "projects">
>;

// ============================================
// Generic error wrapper
// ============================================
const dbError = (
  context: string,
  error: { message?: string; code?: string } | null,
): Error =>
  new Error(
    `[DB:${context}] ${error?.message || "Unknown error"}${error?.code ? ` (code: ${error.code})` : ""}`,
  );

// ============================================
// ClientRepository
// ============================================
export class ClientRepository {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("nom", { ascending: true });
    if (error) throw dbError("clients:getAll", error);
    return data || [];
  }

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw dbError("clients:getById", error);
    return data;
  }

  async create(client: ClientInsert): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .insert(client)
      .select()
      .single();
    if (error) throw dbError("clients:create", error);
    return data;
  }

  async update(id: string, updates: ClientUpdate): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw dbError("clients:update", error);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw dbError("clients:delete", error);
  }

  async search(term: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .or(
        `nom.ilike.%${term}%,prenom.ilike.%${term}%,email.ilike.%${term}%,telephone.ilike.%${term}%`,
      )
      .limit(20);
    if (error) throw dbError("clients:search", error);
    return data || [];
  }
}

// ============================================
// ProjectRepository
// ============================================
export class ProjectRepository {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*, clients(nom, prenom)")
      .order("nom", { ascending: true });
    if (error) throw dbError("projects:getAll", error);
    return data || [];
  }

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*, clients(nom, prenom)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw dbError("projects:getById", error);
    return data;
  }

  async create(project: ProjectInsert): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();
    if (error) throw dbError("projects:create", error);
    return data;
  }

  async update(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw dbError("projects:update", error);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw dbError("projects:delete", error);
  }

  async getByClientId(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw dbError("projects:getByClientId", error);
    return data || [];
  }

  async getByStatus(status: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("statut", status)
      .order("created_at", { ascending: false });
    if (error) throw dbError("projects:getByStatus", error);
    return data || [];
  }
}

// ============================================
// EmployeeRepository
// ============================================
export class EmployeeRepository {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("nom", { ascending: true });
    if (error) throw dbError("employees:getAll", error);
    return data || [];
  }

  async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw dbError("employees:getById", error);
    return data;
  }

  async create(employee: EmployeeInsert): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .insert(employee)
      .select()
      .single();
    if (error) throw dbError("employees:create", error);
    return data;
  }

  async update(id: string, updates: EmployeeUpdate): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw dbError("employees:update", error);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw dbError("employees:delete", error);
  }

  async getByDepartment(department: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("department", department)
      .order("nom", { ascending: true });
    if (error) throw dbError("employees:getByDepartment", error);
    return data || [];
  }

  async search(term: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .or(
        `nom.ilike.%${term}%,prenom.ilike.%${term}%,email.ilike.%${term}%,poste.ilike.%${term}%`,
      )
      .limit(20);
    if (error) throw dbError("employees:search", error);
    return data || [];
  }
}

// ============================================
// TaskRepository
// ============================================
export class TaskRepository {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, employees(nom, prenom), projects(nom)")
      .order("created_at", { ascending: false });
    if (error) throw dbError("tasks:getAll", error);
    return data || [];
  }

  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, employees(nom, prenom), projects(nom)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw dbError("tasks:getById", error);
    return data;
  }

  async create(task: TaskInsert): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();
    if (error) throw dbError("tasks:create", error);
    return data;
  }

  async update(id: string, updates: TaskUpdate): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw dbError("tasks:update", error);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw dbError("tasks:delete", error);
  }

  async getByAssignee(assigneeId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("assignee_id", assigneeId)
      .order("created_at", { ascending: false });
    if (error) throw dbError("tasks:getByAssignee", error);
    return data || [];
  }

  async getByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw dbError("tasks:getByProject", error);
    return data || [];
  }

  async getByStatus(status: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("statut", status)
      .order("created_at", { ascending: false });
    if (error) throw dbError("tasks:getByStatus", error);
    return data || [];
  }
}

// ============================================
// Singleton exports (use these in page components)
// ============================================
export const clientRepository = new ClientRepository();
export const projectRepository = new ProjectRepository();
export const employeeRepository = new EmployeeRepository();
export const taskRepository = new TaskRepository();
