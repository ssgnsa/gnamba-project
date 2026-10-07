import { apiClient } from "../api/client";

export interface MonthlyAgg {
  month: string;
  recettes: number;
  depenses: number;
}

export interface CategoryAgg {
  label: string;
  value: number;
  color: string;
}

export interface RecentTx {
  id: string;
  type_transaction: "recette" | "depense";
  description: string;
  categorie: string;
  montant: number;
  date_transaction: string;
}

export interface AlertItem {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  message: string;
  sub?: string;
}

export interface ServiceLink {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: any;
  color: string;
  category: "application" | "database" | "api" | "tool";
  status: "online" | "offline";
}

export interface DashboardData {
  currentRecettes: number;
  prevRecettes: number;
  currentDepenses: number;
  prevDepenses: number;
  beneficeNet: number;
  totalClients: number;
  projetsActifs: number;
  biensImmobiliers: number;
  loyersEnAttente: number;
  tachesUrgentes: number;
  monthly: MonthlyAgg[];
  recettesByCategory: CategoryAgg[];
  depensesByCategory: CategoryAgg[];
  recentTransactions: RecentTx[];
  alerts: AlertItem[];
}

export const dashboardService = {
  async fetchDashboardData(): Promise<DashboardData> {
    const response = await apiClient.request<DashboardData>("/dashboard");
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as DashboardData;
  },
};
