import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Building, Phone, Briefcase, Users, Bell, Shield, Calculator, Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { supabaseAuth } from '../lib/supabaseAuth';
import { supabase } from '../lib/supabase';

interface MyPageProps {
  onNavigate: (view: string) => void;
}

interface AllowanceSettings {
  domestic_daily_allowance: number;
  overseas_daily_allowance: number;
  transportation_daily_allowance: number;
  accommodation_daily_allowance: number;
  use_transportation_allowance: boolean;
  use_accommodation_allowance: boolean;
}

function MyPage({ onNavigate }: MyPageProps) {
  const authState = supabaseAuth.getAuthState();
  const { user } = authState;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    company: '',
    position: '',
    phone: '',
    department: '',
    role: 'user' as 'user' | 'admin' | 'manager'
  });

  const [allowanceSettings, setAllowanceSettings] = useState<AllowanceSettings>({
    domestic_daily_allowance: 15000,
    overseas_daily_allowance: 25000,
    transportation_daily_allowance: 6000,
    accommodation_daily_allowance: 16000,
    use_transportation_allowance: true,
    use_accommodation_allowance: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    approval_notifications: true,
    reminder_notifications: true,
    system_notifications: true
  });

  // プロフィールデータを読み込み
  useEffect(() => {
    if (user) {
      loadProfileData();
      loadAllowanceSettings();
      loadNotificationSettings();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('プロフィール読み込みエラー:', error);
        return;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          company: data.company || '',
          position: data.position || '',
          phone: data.phone || '',
          department: data.department || '',
          role: data.role || 'user'
        });
      }
    } catch (err) {
      console.error('プロフィール読み込みエラー:', err);
    }
  };

  const loadAllowanceSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('allowance_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('日当設定読み込みエラー:', error);
        return;
      }

      if (data) {
        setAllowanceSettings({
          domestic_daily_allowance: data.domestic_daily_allowance || 15000,
          overseas_daily_allowance: data.overseas_daily_allowance || 25000,
          transportation_daily_allowance: data.transportation_daily_allowance || 6000,
          accommodation_daily_allowance: data.accommodation_daily_allowance || 16000,
          use_transportation_allowance: data.use_transportation_allowance ?? true,
          use_accommodation_allowance: data.use_accommodation_allowance ?? true
        });
      }
    } catch (err) {
      console.error('日当設定読み込みエラー:', err);
    }
  };

  const loadNotificationSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('通知設定読み込みエラー:', error);
        return;
      }

      if (data) {
        setNotificationSettings({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          approval_notifications: data.approval_notifications ?? true,
          reminder_notifications: data.reminder_notifications ?? true,
          system_notifications: data.system_notifications ?? true
        });
      }
    } catch (err) {
      console.error('通知設定読み込みエラー:', err);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          company: profileData.company,
          position: profileData.position,
          phone: profileData.phone,
          department: profileData.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('プロフィールが更新されました');
    } catch (err: any) {
      setError('プロフィールの更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAllowanceSave = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('allowance_settings')
        .upsert({
          user_id: user.id,
          ...allowanceSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('日当設定が更新されました');
    } catch (err: any) {
      setError('日当設定の更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...notificationSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('通知設定が更新されました');
    } catch (err: any) {
      setError('通知設定の更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            氏名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profileData.full_name}
            onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            placeholder="田中 太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            会社名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profileData.company}
            onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            placeholder="株式会社サンプル"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Briefcase className="w-4 h-4 inline mr-1" />
            役職 <span className="text-red-500">*</span>
          </label>
          <select
            value={profileData.position}
            onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          >
            <option value="">役職を選択してください</option>
            <option value="代表取締役">代表取締役</option>
            <option value="取締役">取締役</option>
            <option value="部長">部長</option>
            <option value="課長">課長</option>
            <option value="主任">主任</option>
            <option value="一般職">一般職</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            部署 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profileData.department}
            onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            placeholder="営業部"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            電話番号
          </label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            placeholder="090-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Shield className="w-4 h-4 inline mr-1" />
            権限レベル
          </label>
          <select
            value={profileData.role}
            onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' | 'manager' }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            disabled={profileData.role !== 'admin'}
          >
            <option value="user">一般ユーザー</option>
            <option value="manager">マネージャー</option>
            <option value="admin">管理者</option>
          </select>
          {profileData.role !== 'admin' && (
            <p className="text-xs text-slate-500 mt-1">権限レベルの変更は管理者のみ可能です</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProfileSave}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{loading ? '保存中...' : 'プロフィールを保存'}</span>
        </button>
      </div>
    </div>
  );

  const renderAllowanceTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">日当設定について</h3>
        <p className="text-blue-700 text-sm">
          ここで設定した日当額は、出張申請時の自動計算に使用されます。
          会社の出張規程に合わせて適切な金額を設定してください。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calculator className="w-4 h-4 inline mr-1" />
            国内出張日当（円）
          </label>
          <input
            type="number"
            value={allowanceSettings.domestic_daily_allowance}
            onChange={(e) => setAllowanceSettings(prev => ({ 
              ...prev, 
              domestic_daily_allowance: parseInt(e.target.value) || 0 
            }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            min="0"
            step="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calculator className="w-4 h-4 inline mr-1" />
            海外出張日当（円）
          </label>
          <input
            type="number"
            value={allowanceSettings.overseas_daily_allowance}
            onChange={(e) => setAllowanceSettings(prev => ({ 
              ...prev, 
              overseas_daily_allowance: parseInt(e.target.value) || 0 
            }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            min="0"
            step="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            交通費日当（円）
          </label>
          <input
            type="number"
            value={allowanceSettings.transportation_daily_allowance}
            onChange={(e) => setAllowanceSettings(prev => ({ 
              ...prev, 
              transportation_daily_allowance: parseInt(e.target.value) || 0 
            }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            min="0"
            step="1000"
            disabled={!allowanceSettings.use_transportation_allowance}
          />
          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={allowanceSettings.use_transportation_allowance}
              onChange={(e) => setAllowanceSettings(prev => ({ 
                ...prev, 
                use_transportation_allowance: e.target.checked 
              }))}
              className="mr-2"
            />
            <span className="text-sm text-slate-600">交通費日当を使用する</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            宿泊費日当（円）
          </label>
          <input
            type="number"
            value={allowanceSettings.accommodation_daily_allowance}
            onChange={(e) => setAllowanceSettings(prev => ({ 
              ...prev, 
              accommodation_daily_allowance: parseInt(e.target.value) || 0 
            }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
            min="0"
            step="1000"
            disabled={!allowanceSettings.use_accommodation_allowance}
          />
          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={allowanceSettings.use_accommodation_allowance}
              onChange={(e) => setAllowanceSettings(prev => ({ 
                ...prev, 
                use_accommodation_allowance: e.target.checked 
              }))}
              className="mr-2"
            />
            <span className="text-sm text-slate-600">宿泊費日当を使用する</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleAllowanceSave}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{loading ? '保存中...' : '日当設定を保存'}</span>
        </button>
      </div>
    </div>
  );

  const renderNotificationTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">メール通知</h3>
            <p className="text-sm text-slate-600">重要な更新をメールで受信</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.email_notifications}
              onChange={(e) => setNotificationSettings(prev => ({ 
                ...prev, 
                email_notifications: e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">プッシュ通知</h3>
            <p className="text-sm text-slate-600">ブラウザでのプッシュ通知</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.push_notifications}
              onChange={(e) => setNotificationSettings(prev => ({ 
                ...prev, 
                push_notifications: e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">承認通知</h3>
            <p className="text-sm text-slate-600">申請の承認・却下通知</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.approval_notifications}
              onChange={(e) => setNotificationSettings(prev => ({ 
                ...prev, 
                approval_notifications: e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">リマインド通知</h3>
            <p className="text-sm text-slate-600">申請期限のリマインド</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.reminder_notifications}
              onChange={(e) => setNotificationSettings(prev => ({ 
                ...prev, 
                reminder_notifications: e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">システム通知</h3>
            <p className="text-sm text-slate-600">システムメンテナンス等の通知</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.system_notifications}
              onChange={(e) => setNotificationSettings(prev => ({ 
                ...prev, 
                system_notifications: e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNotificationSave}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{loading ? '保存中...' : '通知設定を保存'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>戻る</span>
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">マイページ（設定）</h1>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="backdrop-blur-xl bg-white/20 rounded-xl border border-white/30 shadow-xl mb-6">
          <div className="flex border-b border-white/30">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'text-navy-700 border-b-2 border-navy-600 bg-white/20'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
              }`}
            >
              <User className="w-5 h-5" />
              <span>プロフィール</span>
            </button>
            <button
              onClick={() => setActiveTab('allowance')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === 'allowance'
                  ? 'text-navy-700 border-b-2 border-navy-600 bg-white/20'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
              }`}
            >
              <Calculator className="w-5 h-5" />
              <span>日当設定</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === 'notifications'
                  ? 'text-navy-700 border-b-2 border-navy-600 bg-white/20'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>通知設定</span>
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50/50 border border-red-200/50 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'allowance' && renderAllowanceTab()}
            {activeTab === 'notifications' && renderNotificationTab()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPage;