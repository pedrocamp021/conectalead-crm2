export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  expiredClients: number;
  planDistribution: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

export interface ClientStatusData {
  name: string;
  value: number;
  color: string;
}

export interface PlanDistributionData {
  name: string;
  value: number;
}