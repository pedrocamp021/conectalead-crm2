export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          plan: string
          expiration_date: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          plan: string
          expiration_date: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          plan?: string
          expiration_date?: string
          status?: string
          user_id?: string
        }
      }
      columns: {
        Row: {
          id: string
          created_at: string
          name: string
          order: number
          client_id: string
          color: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          order: number
          client_id: string
          color: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          order?: number
          client_id?: string
          color?: string
        }
      }
      leads: {
        Row: {
          id: string
          created_at: string
          name: string
          phone: string
          interest: string
          notes: string
          column_id: string
          client_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          phone: string
          interest: string
          notes?: string
          column_id: string
          client_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          phone?: string
          interest?: string
          notes?: string
          column_id?: string
          client_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}