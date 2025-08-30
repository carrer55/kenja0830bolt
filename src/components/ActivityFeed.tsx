import { Bell, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { useUserData } from '../hooks/useUserData';

function ActivityFeed() {
  const { userData, loading } = useUserData();

  // 通知タイプに応じたアイコンを取得
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  // 通知タイプに応じた色を取得
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/50';
      case 'warning':
        return 'border-amber-200 bg-amber-50/50';
      case 'error':
        return 'border-red-200 bg-red-50/50';
      default:
        return 'border-blue-200 bg-blue-50/50';
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '今日';
    } else if (diffDays === 2) {
      return '昨日';
    } else if (diffDays <= 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  // データが読み込み中の場合はスケルトン表示
  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-6 w-6 bg-slate-300 rounded animate-pulse"></div>
          <div className="h-6 bg-slate-300 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-white/30">
              <div className="h-5 w-5 bg-slate-300 rounded animate-pulse flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-300 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-300 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 通知がない場合の表示
  if (userData.notifications.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
        
        <div className="flex items-center space-x-2 mb-6 relative z-10">
          <Bell className="w-6 h-6 text-slate-600" />
          <h2 className="text-lg lg:text-xl font-semibold text-slate-800">アクティビティ</h2>
        </div>
        
        <div className="text-center py-8 text-slate-500 relative z-10">
          <Bell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>通知はありません</p>
          <p className="text-sm mt-2">新しい申請や更新があるとここに表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
      
      <div className="flex items-center space-x-2 mb-6 relative z-10">
        <Bell className="w-6 h-6 text-slate-600" />
        <h2 className="text-lg lg:text-xl font-semibold text-slate-800">アクティビティ</h2>
      </div>
      
      <div className="space-y-3 relative z-10">
        {userData.notifications.slice(0, 5).map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:bg-white/20 ${getNotificationColor(notification.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-slate-800 mb-1">
                  {notification.title}
                </h3>
                <span className="text-xs text-slate-500 ml-2">
                  {formatDate(notification.created_at)}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>
        ))}
        
        {userData.notifications.length > 5 && (
          <div className="text-center pt-2">
            <button className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              さらに{userData.notifications.length - 5}件の通知を表示
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;