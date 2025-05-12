export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  expiredClients: number;
}

export interface WeeklyLeads {
  week: string;
  leads: number;
}