export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  plan: string;
  expiration_date: string;
  status: string;
  user_id: string;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  client_id: string;
  color: string;
  leads?: Lead[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
  client_id: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  interest: string;
  notes: string;
  column_id: string;
  client_id: string;
  created_at: string;
  has_followup?: boolean;
  labels?: Label[];
}

export interface Followup {
  id: string;
  lead_id: string;
  scheduled_for: string;
  message_template: string;
  created_at: string;
  status: 'scheduled' | 'sent' | 'cancelled';
  leads?: {
    name: string;
    phone: string;
    column_id?: string;
  };
  columns?: Array<{
    name: string;
  }>;
}

export interface AuthState {
  user: User | null;
  client: Client | null;
  isAdmin: boolean;
  isLoading: boolean;
}