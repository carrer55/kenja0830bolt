import React from 'react';
import { 
  Home, 
  Plane, 
  Receipt, 
  FolderOpen, 
  Calculator, 
  Settings, 
  LogOut,
  User,
  X,
  Shield,
  Users
} from 'lucide-react';
import { useUserData } from '../hooks/useUserData';
import { supabaseAuth } from '../lib/supabaseAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  currentView?: string;
}

function Sidebar({ isOpen, onClose, onNavigate, currentView = 'dashboard' }: SidebarProps) {
  const { userData } = useUserData();
  const handleLogout = async () => {
    try {
      await supabaseAuth.logout();
      // ログアウト後の処理は必要に応じて追加
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // ユーザーの役割に基づいてメニュー項目を生成
  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'ホーム', view: 'dashboard', show: true },
      { icon: Plane, label: '出張申請', view: 'business-trip', show: true },
      { icon: Receipt, label: '経費申請', view: 'expense', show: true },
      { icon: FolderOpen, label: '書類管理', view: 'document-management', show: true },
      { icon: Calculator, label: '節税シミュレーション', view: 'tax-simulation', show: true },
      { icon: Settings, label: '出張規定管理', view: 'travel-regulation-management', show: true },
      { icon: User, label: 'マイページ（設定）', view: 'my-page', show: true },
    ];

    // 管理者・マネージャーのみ表示する項目
    const adminItems = [
      { icon: Shield, label: '管理者ダッシュボード', view: 'admin-dashboard', show: userData.profile?.role === 'admin' },
      { icon: Users, label: 'ユーザー管理', view: 'user-management', show: userData.profile?.role === 'admin' || userData.profile?.role === 'manager' },
    ];

    return [...baseItems, ...adminItems].filter(item => item.show);
  };

  const handleMenuClick = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
    // Close sidebar on mobile when item is clicked
    if (window.innerWidth < 1024) {
      onClose();
    }
  };



  const menuItems = getMenuItems();

  return (
    <div className="w-64 h-full backdrop-blur-xl bg-white/20 border-r border-white/30 flex flex-col shadow-2xl relative overflow-hidden">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/5 backdrop-blur-xl"></div>
      
      <div className="p-4 flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* ユーザー情報表示 */}
        {userData.profile && (
          <div className="mt-4 p-3 bg-white/20 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {userData.profile.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {userData.profile.full_name || 'ユーザー'}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {userData.profile.role === 'admin' ? '管理者' : 
                   userData.profile.role === 'manager' ? 'マネージャー' : '一般ユーザー'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 relative z-10 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            
            return (
              <li key={index}>
                <button
                  onClick={() => handleMenuClick(item.view)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-navy-600 to-navy-800 text-white shadow-lg' 
                      : 'text-slate-700 hover:bg-white/30 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-800'}`} />
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ログアウトボタン */}
      <div className="p-3 flex-shrink-0 relative z-10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-3 px-3 py-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">ログアウト</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;