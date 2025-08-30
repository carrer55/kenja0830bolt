import { useState, useEffect } from 'react';
import { User, Settings, CreditCard, Bell, Users, Edit, Save, Link } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabase';

interface MyPageProps {
  onNavigate: (view: string) => void;
}

interface UserProfile {
  name: string;
  position: string;
  email: string;
  phone: string;
  company: string;
  department: string;
  allowances: {
    domestic: number;
    overseas: number;
    transportation: number;
    accommodation: number;
  };
  allowanceFlags: {
    useTransportation: boolean;
    useAccommodation: boolean;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderTime: string;
  approvalOnly: boolean;
}

function MyPage({ onNavigate }: MyPageProps) {
  const { userData, refreshData } = useUserData();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [] = useState(false);
  const [] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    position: '',
    email: '',
    phone: '',
    company: '',
    department: '',
    allowances: {
      domestic: 5000,
      overseas: 10000,
      transportation: 2000,
      accommodation: 10000
    },
    allowanceFlags: {
      useTransportation: true,
      useAccommodation: true
    }
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    reminderTime: '09:00',
    approvalOnly: false
  });

  const [] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // ユーザーデータからプロフィール情報を取得
  useEffect(() => {
    if (userData.profile) {
      setUserProfile({
        name: userData.profile.full_name || '',
        position: userData.profile.position || '',
        email: userData.profile.email || '',
        phone: userData.profile.phone || '',
        company: userData.profile.company || '',
        department: userData.profile.department || '',
        allowances: {
          domestic: 5000,
          overseas: 10000,
          transportation: 2000,
          accommodation: 10000
        }
      });

      // 既存の日当設定を読み込み
      loadAllowanceSettings();
    }
  }, [userData.profile]);

  // 日当設定を読み込む関数
  const loadAllowanceSettings = async () => {
    if (!userData.profile) return;
    
    try {
      const { data: existingSettings } = await supabase
        .from('allowance_settings')
        .select('*')
        .eq('user_id', userData.profile.id)
        .single();

      if (existingSettings) {
        setUserProfile(prev => ({
          ...prev,
          allowances: {
            domestic: existingSettings.domestic_daily_allowance || 5000,
            overseas: existingSettings.overseas_daily_allowance || 10000,
            transportation: existingSettings.transportation_daily_allowance || 2000,
            accommodation: existingSettings.accommodation_daily_allowance || 10000
          },
          allowanceFlags: {
            useTransportation: existingSettings.use_transportation_allowance ?? true,
            useAccommodation: existingSettings.use_accommodation_allowance ?? true
          }
        }));
      }
    } catch (err) {
      console.log('日当設定の読み込みに失敗しました（新規ユーザーの可能性）:', err);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleProfileSave = async () => {
    if (!userData.profile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userProfile.name,
          position: userProfile.position,
          phone: userProfile.phone,
          company: userProfile.company,
          department: userProfile.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.profile.id);

      if (error) {
        alert('プロフィールの更新に失敗しました: ' + error.message);
        return;
      }

      // データを再取得
      await refreshData();
      alert('プロフィールが更新されました');
    } catch (err) {
      alert('プロフィールの更新に失敗しました');
      console.error('Profile update error:', err);
    }
  };

  const handleAllowancesSave = async () => {
    console.log('handleAllowancesSave called');
    
    if (!userData.profile) {
      console.log('No user profile available');
      alert('ユーザープロフィールが取得できません');
      return;
    }
    
    console.log('Saving allowance settings for user:', userData.profile.id);
    console.log('Current allowance settings:', userProfile.allowances);
    console.log('Current allowance flags:', userProfile.allowanceFlags);
    
    try {
      // 既存の設定を確認
      const { data: existingSettings, error: selectError } = await supabase
        .from('allowance_settings')
        .select('*')
        .eq('user_id', userData.profile.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing settings:', selectError);
        alert('日当設定の確認に失敗しました: ' + selectError.message);
        return;
      }

      if (existingSettings) {
        console.log('Updating existing allowance settings');
        // 既存の設定を更新
        const { error } = await supabase
          .from('allowance_settings')
          .update({
            domestic_daily_allowance: userProfile.allowances.domestic,
            overseas_daily_allowance: userProfile.allowances.overseas,
            transportation_daily_allowance: userProfile.allowances.transportation,
            accommodation_daily_allowance: userProfile.allowances.accommodation,
            use_transportation_allowance: userProfile.allowanceFlags.useTransportation,
            use_accommodation_allowance: userProfile.allowanceFlags.useAccommodation,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userData.profile.id);

        if (error) {
          console.error('Update error:', error);
          alert('日当設定の更新に失敗しました: ' + error.message);
          return;
        }
        
        console.log('Allowance settings updated successfully');
      } else {
        console.log('Creating new allowance settings');
        // 新規作成
        const { error } = await supabase
          .from('allowance_settings')
          .insert({
            user_id: userData.profile.id,
            domestic_daily_allowance: userProfile.allowances.domestic,
            overseas_daily_allowance: userProfile.allowances.overseas,
            transportation_daily_allowance: userProfile.allowances.transportation,
            accommodation_daily_allowance: userProfile.allowances.accommodation,
            use_transportation_allowance: userProfile.allowanceFlags.useTransportation,
            use_accommodation_allowance: userProfile.allowanceFlags.useAccommodation
          });

        if (error) {
          console.error('Insert error:', error);
          alert('日当設定の作成に失敗しました: ' + error.message);
          return;
        }
        
        console.log('Allowance settings created successfully');
      }

      // データを再読み込み
      console.log('Reloading allowance settings');
      await loadAllowanceSettings();
      
      console.log('Showing success alert');
      alert('日当設定が保存されました');
    } catch (err) {
      console.error('Unexpected error in handleAllowancesSave:', err);
      alert('日当設定の保存に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'));
    }
  };


  const handleNotificationSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    alert('通知設定が更新されました');
  };


  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: User },
    { id: 'allowances', label: '日当設定', icon: Settings },
    { id: 'notifications', label: '通知設定', icon: Bell },
    { id: 'accounting', label: '会計ソフト設定', icon: Link },
    { id: 'users', label: 'ユーザー管理', icon: Users },
    { id: 'plan', label: 'プラン管理', icon: CreditCard }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">氏名</label>
          <input
            type="text"
            value={userProfile.name}
            onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">役職</label>
          <select
            value={userProfile.position}
            onChange={(e) => setUserProfile(prev => ({ ...prev, position: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          >
            <option value="">選択してください</option>
            <option value="代表取締役">代表取締役</option>
            <option value="取締役">取締役</option>
            <option value="部長">部長</option>
            <option value="課長">課長</option>
            <option value="主任">主任</option>
            <option value="一般社員">一般社員</option>
            <option value="アルバイト">アルバイト</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">メールアドレス</label>
          <input
            type="email"
            value={userProfile.email}
            onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">電話番号</label>
          <input
            type="tel"
            value={userProfile.phone}
            onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">会社名</label>
          <input
            type="text"
            value={userProfile.company}
            onChange={(e) => setUserProfile(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">部署</label>
          <input
            type="text"
            value={userProfile.department}
            onChange={(e) => setUserProfile(prev => ({ ...prev, department: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          />
        </div>
      </div>

      {/* パスワード変更セクション */}
      <div className="border-t border-white/30 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">パスワード変更</h3>
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-lg font-medium hover:from-slate-700 hover:to-slate-900 transition-all duration-200"
          >
            <Edit className="w-4 h-4" />
            <span>パスワード変更</span>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProfileSave}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
        >
          <Save className="w-5 h-5" />
          <span>保存</span>
        </button>
      </div>
    </div>
  );

  const renderAllowancesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">国内出張日当（円）</label>
          <input
            type="number"
            value={userProfile.allowances.domestic}
            onChange={(e) => setUserProfile(prev => ({ 
              ...prev, 
              allowances: { ...prev.allowances, domestic: parseInt(e.target.value) || 0 }
            }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          />
          <p className="text-xs text-slate-500 mt-1">1日あたりの国内出張日当</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">海外出張日当（円）</label>
          <input
            type="number"
            value={userProfile.allowances.overseas}
            onChange={(e) => setUserProfile(prev => ({ 
              ...prev, 
              allowances: { ...prev.allowances, overseas: parseInt(e.target.value) || 0 }
            }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          />
          <p className="text-xs text-slate-500 mt-1">1日あたりの海外出張日当</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">交通費日当（円）</label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!userProfile.allowanceFlags.useTransportation}
                onChange={(e) => setUserProfile(prev => ({
                  ...prev,
                  allowanceFlags: { ...prev.allowanceFlags, useTransportation: !e.target.checked },
                  allowances: {
                    ...prev.allowances,
                    transportation: e.target.checked ? 0 : prev.allowances.transportation
                  }
                }))}
                className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500 focus:ring-2"
              />
              <span className="text-xs text-slate-600">日当を使用しない</span>
            </label>
          </div>
          <input
            type="number"
            value={userProfile.allowances.transportation}
            onChange={(e) => setUserProfile(prev => ({ 
              ...prev, 
              allowances: { ...prev.allowances, transportation: parseInt(e.target.value) || 0 }
            }))}
            disabled={!userProfile.allowanceFlags.useTransportation}
            className={`w-full px-4 py-3 border border-white/40 rounded-lg backdrop-blur-xl ${
              userProfile.allowanceFlags.useTransportation 
                ? 'bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400' 
                : 'bg-slate-100/50 text-slate-400 cursor-not-allowed'
            }`}
          />
          <p className="text-xs text-slate-500 mt-1">
            {userProfile.allowanceFlags.useTransportation 
              ? '1日あたりの交通費日当' 
              : '交通費日当は使用されません（0円）'
            }
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">宿泊日当（円）</label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!userProfile.allowanceFlags.useAccommodation}
                onChange={(e) => setUserProfile(prev => ({
                  ...prev,
                  allowanceFlags: { ...prev.allowanceFlags, useAccommodation: !e.target.checked },
                  allowances: {
                    ...prev.allowances,
                    accommodation: e.target.checked ? 0 : prev.allowances.accommodation
                  }
                }))}
                className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500 focus:ring-2"
              />
              <span className="text-xs text-slate-600">日当を使用しない</span>
            </label>
          </div>
          <input
            type="number"
            value={userProfile.allowances.accommodation}
            onChange={(e) => setUserProfile(prev => ({ 
              ...prev, 
              allowances: { ...prev.allowances, accommodation: parseInt(e.target.value) || 0 }
            }))}
            disabled={!userProfile.allowanceFlags.useAccommodation}
            className={`w-full px-4 py-3 border border-white/40 rounded-lg backdrop-blur-xl ${
              userProfile.allowanceFlags.useAccommodation 
                ? 'bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400' 
                : 'bg-slate-100/50 text-slate-400 cursor-not-allowed'
            }`}
          />
          <p className="text-xs text-slate-500 mt-1">
            {userProfile.allowanceFlags.useAccommodation 
              ? '1泊あたりの宿泊日当' 
              : '宿泊日当は使用されません（0円）'
            }
          </p>
        </div>
      </div>

      <div className="bg-white/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">日当計算例</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-slate-600 mb-1">国内日帰り出張</p>
            <p className="text-xl font-bold text-slate-800">
              ¥{(userProfile.allowances.domestic + (userProfile.allowanceFlags.useTransportation ? userProfile.allowances.transportation : 0)).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 mb-1">海外日帰り出張</p>
            <p className="text-xl font-bold text-slate-800">
              ¥{(userProfile.allowances.overseas + (userProfile.allowanceFlags.useTransportation ? userProfile.allowances.transportation : 0)).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 mb-1">国内1泊2日出張</p>
            <p className="text-xl font-bold text-slate-800">
              ¥{((userProfile.allowances.domestic + (userProfile.allowanceFlags.useTransportation ? userProfile.allowances.transportation : 0)) * 2 + (userProfile.allowanceFlags.useAccommodation ? userProfile.allowances.accommodation : 0)).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 mb-1">海外2泊3日出張</p>
            <p className="text-xl font-bold text-slate-800">
              ¥{((userProfile.allowances.overseas + (userProfile.allowanceFlags.useTransportation ? userProfile.allowances.transportation : 0)) * 3 + (userProfile.allowanceFlags.useAccommodation ? userProfile.allowances.accommodation * 2 : 0)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleAllowancesSave}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
        >
          <Save className="w-5 h-5" />
          <span>日当設定を保存</span>
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">メール通知</h3>
            <p className="text-sm text-slate-600">申請状況や承認通知をメールで受信</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.emailNotifications}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">プッシュ通知</h3>
            <p className="text-sm text-slate-600">ブラウザでのプッシュ通知を受信</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.pushNotifications}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>

        <div className="p-4 bg-white/30 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-3">リマインド時間</h3>
          <select
            value={notificationSettings.reminderTime}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
          >
            <option value="08:00">08:00</option>
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
            <option value="17:00">17:00</option>
            <option value="18:00">18:00</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/30 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">承認通知のみ</h3>
            <p className="text-sm text-slate-600">承認が必要な通知のみ受信</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.approvalOnly}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, approvalOnly: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNotificationSave}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
        >
          <Save className="w-5 h-5" />
          <span>通知設定を保存</span>
        </button>
      </div>
    </div>
  );

  const renderAccountingTab = () => (
    <div className="space-y-6">
      <div className="bg-white/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">会計ソフト連携</h3>
        <p className="text-slate-600 mb-6">
          現在、会計ソフトとの連携機能は開発中です。今後、以下のソフトウェアとの連携を予定しています。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white/20 rounded-lg">
            <Link className="w-5 h-5 text-navy-600" />
            <span className="font-medium text-slate-800">freee</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/20 rounded-lg">
            <Link className="w-5 h-5 text-navy-600" />
            <span className="font-medium text-slate-800">弥生会計</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/20 rounded-lg">
            <Link className="w-5 h-5 text-navy-600" />
            <span className="font-medium text-slate-800">勘定奉行</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/20 rounded-lg">
            <Link className="w-5 h-5 text-navy-600" />
            <span className="font-medium text-slate-800">MFクラウド</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="bg-white/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">ユーザー管理</h3>
        <p className="text-slate-600 mb-6">
          現在、ユーザー管理機能は開発中です。管理者権限を持つユーザーのみが利用できます。
        </p>
        <div className="flex items-center space-x-2 text-slate-500">
          <Users className="w-5 h-5" />
          <span>管理者権限が必要です</span>
        </div>
      </div>
    </div>
  );

  const renderPlanTab = () => (
    <div className="space-y-6">
      <div className="bg-white/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">現在のプラン</h3>
        <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg mb-6">
          <div>
            <p className="font-medium text-slate-800">Standard</p>
            <p className="text-sm text-slate-600">基本機能付きプラン</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-slate-800">¥4,900</p>
            <p className="text-sm text-slate-600">月額</p>
          </div>
        </div>

        <h4 className="text-md font-semibold text-slate-800 mb-3">利用履歴</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-white/20">
            <div>
              <p className="font-medium text-slate-800">2024年7月分</p>
              <p className="text-sm text-slate-600">Standard プラン</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-800">¥4,900</p>
              <button className="text-sm text-navy-600 hover:text-navy-800">領収書DL</button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/20">
            <div>
              <p className="font-medium text-slate-800">2024年6月分</p>
              <p className="text-sm text-slate-600">Standard プラン</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-800">¥4,900</p>
              <button className="text-sm text-navy-600 hover:text-navy-800">領収書DL</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="flex h-screen relative">
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="my-page" />
        </div>

        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="my-page" />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-8">マイページ（設定）</h1>

              {/* タブナビゲーション */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl border border-white/30 shadow-xl mb-6">
                <div className="flex flex-wrap border-b border-white/30">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 font-medium transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'text-navy-800 border-b-2 border-navy-600 bg-white/20'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* タブコンテンツ */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'allowances' && renderAllowancesTab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab === 'accounting' && renderAccountingTab()}
                {activeTab === 'users' && renderUsersTab()}
                {activeTab === 'plan' && renderPlanTab()}
              </div>
            </div>
          </div>

          {/* パスワード変更モーダル */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">パスワード変更</h3>
                <p className="text-slate-600 mb-6">
                  セキュリティのため、パスワード変更はメール経由で行います。
                  登録済みのメールアドレスにパスワードリセット用のリンクを送信いたします。
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      onNavigate('password-reset');
                    }}
                    className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors"
                  >
                    リセットメールを送信
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyPage;
