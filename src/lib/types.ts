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

export interface Lead {
  id: string;
  name: string;
  phone: string;
  interest: string;
  notes: string;
  column_id: string;
  client_id: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  client: Client | null;
  isAdmin: boolean;
  isLoading: boolean;
}