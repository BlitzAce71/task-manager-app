export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  category_id?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  category?: Category
}

// Database schema types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'category'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'category'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_status: TaskStatus
      task_priority: TaskPriority
    }
  }
}