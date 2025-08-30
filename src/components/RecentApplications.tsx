import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useUserData } from '../hooks/useUserData';

interface RecentApplicationsProps {
  onShowDetail: (type: 'business-trip' | 'expense', id: string) => void;
  onNavigate: (view: string) => void;
}

function RecentApplications({ onShowDetail, onNavigate }: RecentApplicationsProps) {
  const { userData, loading } = useUserData();

  // 最近の申請データを生成（経費申請と出張申請を統合）
  const getRecentApplications = () => {
    const allApplications = [
      ...userData.applications.expense.map(app => ({
        id: app.id,
        date: app.created_at,
        type: '経費申請',
        amount: `¥${app.amount.toLocaleString()}`,
        status: getStatusText(app.status),
        statusColor: getStatusColor(app.status),
        originalType: 'expense' as const
      })),
      ...userData.applications.businessTrip.map(app => ({
        id: app.id,
        date: app.created_at,
        type: '出張申請',
        amount: `¥${app.estimated_cost.toLocaleString()}`,
        status: getStatusText(app.status),
        statusColor: getStatusColor(app.status),
        originalType: 'business-trip' as const
      }))
    ];

    // 日付順でソートして最新5件を返す
    return allApplications
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
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
      month: '2-digit',
      day: '2-digit'
    });
  };

  const applications = getRecentApplications();

  // データが読み込み中の場合はスケルトン表示
  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-slate-300 rounded w-32 animate-pulse"></div>
          <div className="h-5 w-5 bg-slate-300 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 lg:gap-4 text-xs font-medium text-slate-600 pb-2 border-b border-white/30">
            <span>申請日</span>
            <span>種別</span>
            <span>金額</span>
            <span>ステータス</span>
          </div>
                      {[1, 2, 3].map((index) => (
              <div key={index} className="grid grid-cols-4 gap-2 lg:gap-4 items-center py-3">
                <div className="h-4 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-6 bg-slate-300 rounded animate-pulse"></div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg lg:text-xl font-semibold text-slate-800 relative z-10">最近の申請</h2>
        <button 
          onClick={() => onNavigate('application-status')}
          className="text-slate-400 hover:text-slate-600 relative z-10"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 lg:gap-4 text-xs font-medium text-slate-600 pb-2 border-b border-white/30 min-w-max">
              <span>申請日</span>
              <span>種別</span>
              <span>金額</span>
              <span>ステータス</span>
            </div>
            {applications.length > 0 ? (
              applications.map((app) => (
                <div 
                  key={app.id} 
                  className="grid grid-cols-4 gap-2 lg:gap-4 items-center py-3 rounded-lg px-2 min-w-max cursor-pointer"
                  onClick={() => onShowDetail(app.originalType, app.id)}
                >
                  <span className="text-slate-700 text-sm">{formatDate(app.date)}</span>
                  <span className="text-slate-700 text-sm">{app.type}</span>
                  <span className="text-slate-900 font-medium text-sm">{app.amount}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.statusColor}`}>
                    {app.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>申請データがありません</p>
                <p className="text-sm mt-2">新しい申請を作成してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecentApplications;