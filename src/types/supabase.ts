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
      // 出張規程テーブル
      travel_expense_regulations: {
        Row: {
          id: string
          user_id: string
          regulation_name: string
          regulation_type: string
          company_name: string | null
          company_address: string | null
          representative: string | null
          distance_threshold: number | null
          implementation_date: string | null
          revision_number: number | null
          regulation_text: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          regulation_name: string
          regulation_type: string
          company_name?: string | null
          company_address?: string | null
          representative?: string | null
          distance_threshold?: number | null
          implementation_date?: string | null
          revision_number?: number | null
          regulation_text?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          regulation_name?: string
          regulation_type?: string
          company_name?: string | null
          company_address?: string | null
          representative?: string | null
          distance_threshold?: number | null
          implementation_date?: string | null
          revision_number?: number | null
          regulation_text?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // 規程役職設定テーブル
      regulation_positions: {
        Row: {
          id: string
          regulation_id: string
          position_name: string
          domestic_daily_allowance: number
          domestic_accommodation_allowance: number
          domestic_transportation_allowance: number
          overseas_daily_allowance: number
          overseas_accommodation_allowance: number
          overseas_preparation_allowance: number
          overseas_transportation_allowance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          regulation_id: string
          position_name: string
          domestic_daily_allowance?: number
          domestic_accommodation_allowance?: number
          domestic_transportation_allowance?: number
          overseas_daily_allowance?: number
          overseas_accommodation_allowance?: number
          overseas_preparation_allowance?: number
          overseas_transportation_allowance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          regulation_id?: string
          position_name?: string
          domestic_daily_allowance?: number
          domestic_accommodation_allowance?: number
          domestic_transportation_allowance?: number
          overseas_daily_allowance?: number
          overseas_accommodation_allowance?: number
          overseas_preparation_allowance?: number
          overseas_transportation_allowance?: number
          created_at?: string
          updated_at?: string
        }
      }
      // 日当設定テーブル
      allowance_settings: {
        Row: {
          id: string
          user_id: string
          domestic_daily_allowance: number
          overseas_daily_allowance: number
          transportation_daily_allowance: number
          accommodation_daily_allowance: number
          use_transportation_allowance: boolean
          use_accommodation_allowance: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domestic_daily_allowance?: number
          overseas_daily_allowance?: number
          transportation_daily_allowance?: number
          accommodation_daily_allowance?: number
          use_transportation_allowance?: boolean
          use_accommodation_allowance?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domestic_daily_allowance?: number
          overseas_daily_allowance?: number
          transportation_daily_allowance?: number
          accommodation_daily_allowance?: number
          use_transportation_allowance?: boolean
          use_accommodation_allowance?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // 通知設定テーブル
      notification_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          approval_notifications: boolean
          reminder_notifications: boolean
          system_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          approval_notifications?: boolean
          reminder_notifications?: boolean
          system_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          approval_notifications?: boolean
          reminder_notifications?: boolean
          system_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // 経費カテゴリテーブル
      expense_categories: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // 経費申請項目テーブル
      expense_application_items: {
        Row: {
          id: string
          expense_application_id: string
          category_code: string
          date: string
          amount: number
          description: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expense_application_id: string
          category_code: string
          date: string
          amount: number
          description?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expense_application_id?: string
          category_code?: string
          date?: string
          amount?: number
          description?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 出張報告書テーブル
      business_trip_reports: {
        Row: {
          id: string
          user_id: string
          business_trip_application_id: string
          report_title: string
          destination: string
          start_date: string
          end_date: string
          purpose: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_trip_application_id: string
          report_title: string
          destination: string
          start_date: string
          end_date: string
          purpose: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_trip_application_id?: string
          report_title?: string
          destination?: string
          start_date?: string
          end_date?: string
          purpose?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // 日当支給明細テーブル
      daily_allowance_statements: {
        Row: {
          id: string
          user_id: string
          statement_title: string
          period_start: string
          period_end: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          statement_title: string
          period_start: string
          period_end: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          statement_title?: string
          period_start?: string
          period_end?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // 旅費精算書テーブル
      travel_expense_statements: {
        Row: {
          id: string
          user_id: string
          statement_title: string
          destination: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          statement_title: string
          destination: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          statement_title?: string
          destination?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // 出張添付ファイルテーブル
      business_trip_attachments: {
        Row: {
          id: string
          business_trip_application_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string | null
          file_path: string
          created_at: string
        }
        Insert: {
          id?: string
          business_trip_application_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url?: string | null
          file_path: string
          created_at?: string
        }
        Update: {
          id?: string
          business_trip_application_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string | null
          file_path?: string
          created_at?: string
        }
      }
      // 経費添付ファイルテーブル
      expense_attachments: {
        Row: {
          id: string
          expense_application_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string | null
          file_path: string
          created_at: string
        }
        Insert: {
          id?: string
          expense_application_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url?: string | null
          file_path: string
          created_at?: string
        }
        Update: {
          id?: string
          expense_application_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string | null
          file_path?: string
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
