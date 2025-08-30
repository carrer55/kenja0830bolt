import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

interface ApplicationDetailProps {
  onBack: () => void;
  type: 'business-trip' | 'expense';
  applicationId: string;
}

interface BusinessTripApplication extends Tables<'business_trip_applications'> {
  user?: {
    full_name: string;
    department: string;
  };
}

interface ExpenseApplication extends Tables<'expense_applications'> {
  user?: {
    full_name: string;
    department: string;
  };
  items?: Tables<'expense_application_items'>[];
}

function ApplicationDetail({ onBack, type, applicationId }: ApplicationDetailProps) {
  const [application, setApplication] = useState<BusinessTripApplication | ExpenseApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 申請データを読み込む
  useEffect(() => {
    loadApplicationData();
  }, [type, applicationId]);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      
      if (type === 'business-trip') {
        // 出張申請の詳細を取得
        const { data: appData, error: appError } = await supabase
          .from('business_trip_applications')
          .select(`
            *,
            user:profiles!business_trip_applications_user_id_fkey (
              full_name,
              department
            )
          `)
          .eq('id', applicationId)
          .single();

        if (appError) {
          throw appError;
        }

        setApplication(appData);
      } else if (type === 'expense') {
        // 経費申請の詳細を取得
        const { data: appData, error: appError } = await supabase
          .from('expense_applications')
          .select(`
            *,
            user:profiles!expense_applications_user_id_fkey (
              full_name,
              department
            ),
            items:expense_application_items(*)
          `)
          .eq('id', applicationId)
          .single();

        if (appError) {
          throw appError;
        }

        setApplication(appData);
      }
    } catch (err: any) {
      setError(err.message || '申請詳細の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ステータスを日本語テキストに変換
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待機中';
      case 'approved': return '承認済み';
      case 'rejected': return '却下';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  // ステータスに応じた色を返す
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-700 bg-amber-100';
      case 'approved': return 'text-emerald-700 bg-emerald-100';
      case 'rejected': return 'text-red-700 bg-red-100';
      case 'cancelled': return 'text-gray-700 bg-gray-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 日時をフォーマット
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 申請IDを生成
  const generateApplicationId = (id: string, type: string) => {
    const prefix = type === 'business-trip' ? 'BT' : 'EX';
    return `${prefix}-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`;
  };

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-300 rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-slate-300 rounded"></div>
              </div>
              <div className="h-64 bg-slate-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // エラー時
  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">エラーが発生しました</h2>
            <p className="text-slate-600 mb-4">{error || '申請が見つかりません'}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  // 承認状況のタイムラインを生成
  const getApprovalTimeline = () => {
    const timeline = [];
    
    // 申請提出
    timeline.push({
      date: application.submitted_at || '',
      action: '申請提出',
      status: 'completed' as const,
      user: (application as any).user?.full_name || '不明'
    });

    // 承認済みの場合
    if (application.status === 'approved' && (application as any).approved_at) {
      timeline.push({
        date: (application as any).approved_at || '',
        action: '最終承認',
        status: 'completed' as const,
        user: '承認者'
      });
    }

    // 却下の場合
    if (application.status === 'rejected') {
      timeline.push({
        date: (application as any).updated_at || '',
        action: '却下',
        status: 'rejected' as const,
        user: '承認者'
      });
    }

    return timeline;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="relative z-10 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>戻る</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-navy-600 to-navy-800 text-white rounded-lg font-medium hover:from-navy-700 hover:to-navy-900 transition-all duration-200">
              <Download className="w-4 h-4" />
              <span>PDF出力</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 基本情報 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-slate-800">
                    {type === 'business-trip' 
                      ? `出張申請 - ${(application as BusinessTripApplication).destination}`
                      : '経費申請'
                    }
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                    {getStatusText(application.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">申請ID</p>
                    <p className="font-medium text-slate-800">{generateApplicationId(application.id, type)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">申請者</p>
                    <p className="font-medium text-slate-800">
                      {(application as any).user?.full_name || '不明'} ({(application as any).user?.department || '不明'})
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">申請日</p>
                    <p className="font-medium text-slate-800">{formatDate(application.submitted_at || '')}</p>
                  </div>
                  {type === 'business-trip' && (
                    <>
                      <div>
                        <p className="text-slate-600">出張期間</p>
                        <p className="font-medium text-slate-800">
                          {formatDate((application as BusinessTripApplication).start_date || '')} ～ {formatDate((application as BusinessTripApplication).end_date || '')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">訪問先</p>
                        <p className="font-medium text-slate-800">{(application as BusinessTripApplication).destination}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">予定金額</p>
                        <p className="font-medium text-slate-800">¥{Number((application as BusinessTripApplication).estimated_cost || 0).toLocaleString()}</p>
                      </div>
                    </>
                  )}
                  {type === 'expense' && (
                    <div>
                      <p className="text-slate-600">合計金額</p>
                      <p className="font-medium text-slate-800">¥{Number((application as ExpenseApplication).amount || 0).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {type === 'business-trip' && (
                  <div className="mt-4">
                    <p className="text-slate-600 text-sm mb-2">出張目的</p>
                    <p className="text-slate-800">{(application as BusinessTripApplication).purpose}</p>
                  </div>
                )}

                {type === 'expense' && (
                  <div className="mt-4">
                    <p className="text-slate-600 text-sm mb-3">経費詳細</p>
                    <div className="space-y-2">
                      {(application as ExpenseApplication).items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white/30 rounded-lg p-3">
                          <div>
                            <p className="font-medium text-slate-800">{item.category_code}</p>
                            <p className="text-sm text-slate-600">{item.description || '詳細なし'}</p>
                          </div>
                          <p className="font-bold text-slate-800">¥{Number(item.amount).toLocaleString()}</p>
                        </div>
                      )) || (
                        <p className="text-slate-500 text-sm">経費項目がありません</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 承認状況・履歴 */}
            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">承認状況</h2>
                <div className="space-y-4">
                  {getApprovalTimeline().map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{item.action}</p>
                        <p className="text-xs text-slate-600">{item.user}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(item.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {type === 'expense' && (
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">領収書プレビュー</h2>
                  <div className="space-y-3">
                    <div className="bg-white/30 rounded-lg p-3 text-center">
                      <div className="w-full h-32 bg-slate-200 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-slate-500 text-sm">領収書画像</span>
                      </div>
                      <p className="text-xs text-slate-600">receipt_001.jpg</p>
                    </div>
                    <div className="bg-white/30 rounded-lg p-3 text-center">
                      <div className="w-full h-32 bg-slate-200 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-slate-500 text-sm">領収書画像</span>
                      </div>
                      <p className="text-xs text-slate-600">receipt_002.jpg</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationDetail;