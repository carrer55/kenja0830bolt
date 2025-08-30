import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUserData } from './useUserData';
import type { Tables } from '../types/supabase';

export interface CreateExpenseData {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  receipt_url?: string;
}

export interface CreateBusinessTripData {
  title: string;
  description?: string;
  destination: string;
  start_date: string;
  end_date: string;
  purpose: string;
  estimated_cost: number;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function useDataOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshData, refreshApplications, refreshNotifications } = useUserData();

  // 経費申請を作成
  const createExpenseApplication = useCallback(async (data: CreateExpenseData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error } = await supabase
        .from('expense_applications')
        .insert({
          ...data,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // 成功通知を作成
      await createNotification({
        title: '経費申請が作成されました',
        message: `${data.title}の申請が正常に作成されました。`,
        type: 'success'
      });

      // データを更新
      refreshApplications();
      
      return { success: true, data: result };
    } catch (err: any) {
      console.error('経費申請作成エラー:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [refreshApplications]);

  // 出張申請を作成
  const createBusinessTripApplication = useCallback(async (data: CreateBusinessTripData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error } = await supabase
        .from('business_trip_applications')
        .insert({
          ...data,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // 成功通知を作成
      await createNotification({
        title: '出張申請が作成されました',
        message: `${data.title}の申請が正常に作成されました。`,
        type: 'success'
      });

      // データを更新
      refreshApplications();
      
      return { success: true, data: result };
    } catch (err: any) {
      console.error('出張申請作成エラー:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [refreshApplications]);

  // 通知を作成
  const createNotification = useCallback(async (data: CreateNotificationData) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...data,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // 通知データを更新
      refreshNotifications();
      
      return { success: true };
    } catch (err: any) {
      console.error('通知作成エラー:', err);
      return { success: false, error: err.message };
    }
  }, [refreshNotifications]);

  // 申請のステータスを更新
  const updateApplicationStatus = useCallback(async (
    type: 'expense' | 'business-trip',
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const tableName = type === 'expense' ? 'expense_applications' : 'business_trip_applications';
      const { error } = await supabase
        .from(tableName)
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'approved' && { approved_at: new Date().toISOString() })
        })
        .eq('id', id);

      if (error) throw error;

      // ステータス変更通知を作成
      const statusText = {
        'pending': '待機中',
        'approved': '承認済み',
        'rejected': '却下',
        'cancelled': 'キャンセル'
      }[status];

      await createNotification({
        title: '申請ステータスが更新されました',
        message: `申請が${statusText}に更新されました。`,
        type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'
      });

      // データを更新
      refreshApplications();
      
      return { success: true };
    } catch (err: any) {
      console.error('ステータス更新エラー:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [refreshApplications, createNotification]);

  // 通知を既読にする
  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      // 通知データを更新
      refreshNotifications();
      
      return { success: true };
    } catch (err: any) {
      console.error('通知既読エラー:', err);
      return { success: false, error: err.message };
    }
  }, [refreshNotifications]);

  // 申請を削除
  const deleteApplication = useCallback(async (
    type: 'expense' | 'business-trip',
    id: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const tableName = type === 'expense' ? 'expense_applications' : 'business_trip_applications';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 削除通知を作成
      await createNotification({
        title: '申請が削除されました',
        message: '申請が正常に削除されました。',
        type: 'info'
      });

      // データを更新
      refreshApplications();
      
      return { success: true };
    } catch (err: any) {
      console.error('申請削除エラー:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [refreshApplications, createNotification]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createExpenseApplication,
    createBusinessTripApplication,
    createNotification,
    updateApplicationStatus,
    markNotificationAsRead,
    deleteApplication,
    clearError
  };
}

