import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAuth } from '../lib/supabaseAuth';
import type { Tables } from '../types/supabase';

export interface UserData {
  profile: Tables<'profiles'> | null;
  applications: {
    expense: Tables<'expense_applications'>[];
    businessTrip: Tables<'business_trip_applications'>[];
  };
  notifications: Tables<'notifications'>[];
  stats: {
    monthlyExpenses: number;
    monthlyBusinessTrips: number;
    pendingApplications: number;
    approvedApplications: number;
    approvedAmount: number;
  };
}

export function useUserData() {
  const authState = supabaseAuth.getAuthState();
  const { user, isAuthenticated } = authState;
  const [userData, setUserData] = useState<UserData>({
    profile: null,
    applications: { expense: [], businessTrip: [] },
    notifications: [],
    stats: {
      monthlyExpenses: 0,
      monthlyBusinessTrips: 0,
      pendingApplications: 0,
      approvedApplications: 0,
      approvedAmount: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザープロフィールを取得
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUserData(prev => ({
        ...prev,
        profile: data
      }));
    } catch (err: any) {
      console.error('プロフィール取得エラー:', err);
      setError(err.message);
    }
  }, [user?.id]);

  // 経費申請を取得
  const fetchExpenseApplications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('expense_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserData(prev => ({
        ...prev,
        applications: {
          ...prev.applications,
          expense: data || []
        }
      }));
    } catch (err: any) {
      console.error('経費申請取得エラー:', err);
      setError(err.message);
    }
  }, [user?.id]);

  // 出張申請を取得
  const fetchBusinessTripApplications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('business_trip_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserData(prev => ({
        ...prev,
        applications: {
          ...prev.applications,
          businessTrip: data || []
        }
      }));
    } catch (err: any) {
      console.error('出張申請取得エラー:', err);
      setError(err.message);
    }
  }, [user?.id]);

  // 通知を取得
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setUserData(prev => ({
        ...prev,
        notifications: data || []
      }));
    } catch (err: any) {
      console.error('通知取得エラー:', err);
      setError(err.message);
    }
  }, [user?.id]);

  // 統計データを計算
  const calculateStats = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = userData.applications.expense
      .filter(app => {
        const appDate = new Date(app.created_at);
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
      })
      .reduce((sum, app) => sum + app.amount, 0);

    const monthlyBusinessTrips = userData.applications.businessTrip
      .filter(app => {
        const appDate = new Date(app.created_at);
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
      })
      .reduce((sum, app) => sum + app.estimated_cost, 0);

    const pendingApplications = [
      ...userData.applications.expense.filter(app => app.status === 'pending'),
      ...userData.applications.businessTrip.filter(app => app.status === 'pending')
    ].length;

    const approvedApplications = [
      ...userData.applications.expense.filter(app => app.status === 'approved'),
      ...userData.applications.businessTrip.filter(app => app.status === 'approved')
    ].length;

    const approvedAmount = [
      ...userData.applications.expense.filter(app => app.status === 'approved'),
      ...userData.applications.businessTrip.filter(app => app.status === 'approved')
    ].reduce((sum, app) => {
      if ('amount' in app) {
        return sum + app.amount;
      } else if ('estimated_cost' in app) {
        return sum + app.estimated_cost;
      }
      return sum;
    }, 0);

    setUserData(prev => ({
      ...prev,
      stats: {
        monthlyExpenses,
        monthlyBusinessTrips,
        pendingApplications,
        approvedApplications,
        approvedAmount
      }
    }));
  }, [userData.applications]);

  // 全データを取得
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchUserProfile(),
        fetchExpenseApplications(),
        fetchBusinessTripApplications(),
        fetchNotifications()
      ]);
    } catch (err: any) {
      console.error('データ取得エラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchUserProfile, fetchExpenseApplications, fetchBusinessTripApplications, fetchNotifications]);

  // 統計データを更新（依存関係を修正）
  useEffect(() => {
    if (userData.applications.expense.length > 0 || userData.applications.businessTrip.length > 0) {
      calculateStats();
    }
  }, [userData.applications.expense, userData.applications.businessTrip]);

  // 認証状態が変更されたときにデータを取得
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('User authenticated, fetching data for:', user.id);
      fetchAllData();
    } else {
      console.log('User not authenticated or no user ID');
    }
  }, [isAuthenticated, user?.id, fetchAllData]);

  // データを更新
  const refreshData = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 特定のデータを更新
  const refreshApplications = useCallback(() => {
    Promise.all([
      fetchExpenseApplications(),
      fetchBusinessTripApplications()
    ]);
  }, [fetchExpenseApplications, fetchBusinessTripApplications]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    userData,
    loading,
    error,
    refreshData,
    refreshApplications,
    refreshNotifications,
    fetchUserProfile,
    fetchExpenseApplications,
    fetchBusinessTripApplications,
    fetchNotifications
  };
}

