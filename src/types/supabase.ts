// Supabaseデータベースの型定義
export interface Database {
  public: {
    Tables: {
      // ユーザープロフィールテーブル
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          position: string | null
          phone: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'manager'
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company?: string | null
          position?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'manager'
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company?: string | null
          position?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'manager'
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 経費申請テーブル
      expense_applications: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          amount: number
          currency: string
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          category: string
          receipt_url: string | null
          submitted_at: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          category: string
          receipt_url?: string | null
          submitted_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          category?: string
          receipt_url?: string | null
          submitted_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 出張申請テーブル
      business_trip_applications: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          destination: string
          start_date: string
          end_date: string
          purpose: string
          estimated_cost: number
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          submitted_at: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          destination: string
          start_date: string
          end_date: string
          purpose: string
          estimated_cost: number
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          submitted_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          destination?: string
          start_date?: string
          end_date?: string
          purpose?: string
          estimated_cost?: number
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          submitted_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 通知テーブル
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_at?: string
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

// 型のエクスポート
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
