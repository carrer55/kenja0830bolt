import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://caxyyctagcjvgqfdijxc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheHl5Y3RhZ2NqdmdxZmRpanhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzc1ODcsImV4cCI6MjA3MTc1MzU4N30.Q6Nq9YHSoK16aFYo18qTGwjYSXaH7DrM2Fs-nqn99-w'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'kenja-auth-v2',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'kenja-app'
    }
  }
})

// エラーハンドリング用のユーティリティ
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  return {
    error: error.message || 'An error occurred',
    details: error
  }
}
