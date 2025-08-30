import React from 'react';
import { Bell, HelpCircle, MessageCircle, User, Menu } from 'lucide-react';
import { useUserData } from '../hooks/useUserData';

interface TopBarProps {
  onMenuClick: () => void;
  onNavigate?: (view: string) => void;
}

function TopBar({ onMenuClick, onNavigate }: TopBarProps) {
  const { userData, loading } = useUserData();

  // ユーザーのプラン情報を取得
  const getCurrentPlan = () => {
    if (!userData.profile) return 'Free';
    
    // 役割に基づいてプランを決定
    switch (userData.profile.role) {
      case 'admin':
        return 'Enterprise';
      case 'manager':
        return 'Pro';
      default:
        return 'Standard';
    }
  };

  // 未読通知数を取得
  const getUnreadNotificationCount = () => {
    return userData.notifications.filter(notification => !notification.is_read).length;
  };

  const currentPlan = getCurrentPlan();
  const unreadCount = getUnreadNotificationCount();

  return (
    <div className="h-16 backdrop-blur-xl bg-white/10 border-b border-white/20 flex items-center justify-between px-4 lg:px-6 shadow-xl relative overflow-hidden w-full z-50">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-indigo-50/20"></div>
      
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button - 最優先で左端に配置 */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm hover:shadow-lg relative z-10 touch-manipulation"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Logo */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <img 
            src="/賢者の精算Logo2_Transparent_NoBuffer copy.png" 
            alt="賢者の精算ロゴ" 
            className="w-24 h-6 sm:w-32 sm:h-8 lg:w-40 lg:h-10 object-contain"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 lg:space-x-4 relative z-10">
        <div className="flex items-center space-x-1 lg:space-x-2">
          <div className="relative group">
            <button 
              onClick={() => onNavigate && onNavigate('notification-history')}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm hover:shadow-lg relative"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* ツールチップ */}
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              お知らせ
              {unreadCount > 0 && ` (${unreadCount}件の未読)`}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-slate-800 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
            </div>
          </div>
          <div className="relative group">
            <button 
              onClick={() => onNavigate && onNavigate('help')}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {/* ツールチップ */}
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              ヘルプ
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-slate-800 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
            </div>
          </div>
          <div className="relative group">
            <button 
              onClick={() => onNavigate && onNavigate('support')}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {/* ツールチップ */}
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              お問い合わせ
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-slate-800 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
            </div>
          </div>
          <div className="w-20 h-10 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center ml-2 shadow-lg px-4">
            <span className="text-white text-xs sm:text-sm font-bold">{currentPlan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopBar;