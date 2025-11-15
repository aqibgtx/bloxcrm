import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string | null
          client_id: string | null
          description: string | null
          status: string | null
          progress: number
          due_date: string | null
          created_at: string
          quick_description: string | null
          whatsapp_group_name: string | null
          initial_project_scope: string | null
          case_study_link: string | null
          target_revenue: number
        }
        Insert: {
          id?: string
          name?: string | null
          client_id?: string | null
          description?: string | null
          status?: string | null
          progress?: number
          due_date?: string | null
          created_at?: string
          quick_description?: string | null
          whatsapp_group_name?: string | null
          initial_project_scope?: string | null
          case_study_link?: string | null
          target_revenue?: number
        }
        Update: {
          id?: string
          name?: string | null
          client_id?: string | null
          description?: string | null
          status?: string | null
          progress?: number
          due_date?: string | null
          created_at?: string
          quick_description?: string | null
          whatsapp_group_name?: string | null
          initial_project_scope?: string | null
          case_study_link?: string | null
          target_revenue?: number
        }
      }
      clients: {
        Row: {
          id: string
          name: string | null
          company: string | null
          email: string | null
          phone: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          company?: string | null
          email?: string | null
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          company?: string | null
          email?: string | null
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          name: string | null
          role: string | null
          status: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string | null
          type: string | null
          target: number | null
          progress: number
          deadline: string | null
          title: string | null
          created_at: string
          category: string | null
          description: string | null
          color: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id?: string | null
          type?: string | null
          target?: number | null
          progress?: number
          deadline?: string | null
          title?: string | null
          created_at?: string
          category?: string | null
          description?: string | null
          color?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string | null
          target?: number | null
          progress?: number
          deadline?: string | null
          title?: string | null
          created_at?: string
          category?: string | null
          description?: string | null
          color?: string | null
          is_active?: boolean
        }
      }
      daily_tasks: {
        Row: {
          id: string
          goal_id: string | null
          title: string
          description: string | null
          completed: boolean
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          goal_id?: string | null
          title: string
          description?: string | null
          completed?: boolean
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string | null
          title?: string
          description?: string | null
          completed?: boolean
          date?: string
          created_at?: string
        }
      }
      daily_progress: {
        Row: {
          id: string
          goal_id: string | null
          date: string
          notes: string | null
          metrics: any
          created_at: string
        }
        Insert: {
          id?: string
          goal_id?: string | null
          date?: string
          notes?: string | null
          metrics?: any
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string | null
          date?: string
          notes?: string | null
          metrics?: any
          created_at?: string
        }
      }
      goal_categories: {
        Row: {
          id: string
          name: string
          color: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      goal_metrics: {
        Row: {
          id: string
          goal_id: string | null
          metric_name: string
          metric_value: number
          target_value: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          goal_id?: string | null
          metric_name: string
          metric_value?: number
          target_value?: number
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string | null
          metric_name?: string
          metric_value?: number
          target_value?: number
          date?: string
          created_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          title: string | null
          start_time: string | null
          end_time: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          start_time?: string | null
          end_time?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          start_time?: string | null
          end_time?: string | null
          description?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          project_id: string | null
          amount: number
          status: string | null
          date_issued: string | null
          due_date: string | null
          paid: boolean
          created_at: string
          pdf_url: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          amount?: number
          status?: string | null
          date_issued?: string | null
          due_date?: string | null
          paid?: boolean
          created_at?: string
          pdf_url?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          amount?: number
          status?: string | null
          date_issued?: string | null
          due_date?: string | null
          paid?: boolean
          created_at?: string
          pdf_url?: string | null
        }
      }
      project_costs: {
        Row: {
          id: string
          project_id: string | null
          title: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          title: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string
          amount?: number
          created_at?: string
        }
      }
      project_phases: {
        Row: {
          id: string
          project_id: string | null
          title: string | null
          description: string | null
          milestone: string | null
          due_date: string | null
          progress: number
          created_at: string
          completed: boolean
        }
        Insert: {
          id?: string
          project_id?: string | null
          title?: string | null
          description?: string | null
          milestone?: string | null
          due_date?: string | null
          progress?: number
          created_at?: string
          completed?: boolean
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string | null
          description?: string | null
          milestone?: string | null
          due_date?: string | null
          progress?: number
          created_at?: string
          completed?: boolean
        }
      }
    }
  }
}