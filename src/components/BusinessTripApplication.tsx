import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Upload, Calculator, Save, Loader2, Globe } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { supabaseAuth } from '../lib/supabaseAuth';

import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

interface BusinessTripApplicationProps {
  onNavigate: (view: 'dashboard' | 'business-trip' | 'expense') => void;
}

function BusinessTripApplication({ onNavigate }: BusinessTripApplicationProps) {
  const authState = supabaseAuth.getAuthState();
  const { user } = authState;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    purpose: '',
    startDate: '',
    endDate: '',
    destination: '',
    isOverseas: false,
    estimatedExpenses: {
      dailyAllowance: 0,
      transportation: 0,
      accommodation: 0,
      total: 0
    },
    attachments: [] as File[]
  });

  const [allowanceSettings, setAllowanceSettings] = useState({
    domestic_daily_allowance: 15000,
    overseas_daily_allowance: 25000,
    transportation_daily_allowance: 6000,
    accommodation_daily_allowance: 16000,
    use_transportation_allowance: true,
    use_accommodation_allowance: true
  });

  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // マイページの日当設定を読み込む
  useEffect(() => {
    const loadAllowanceSettings = async () => {
      if (!user?.id) {
        console.log('No user ID available for loading allowance settings');
        return;
      }
      
      console.log('Loading allowance settings for user:', user.id);
      
      try {
        const { data: existingSettings, error } = await supabase
          .from('allowance_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.log('Error loading allowance settings:', error);
          return;
        }

        if (existingSettings) {
          console.log('Loaded allowance settings:', existingSettings);
          setAllowanceSettings({
            domestic_daily_allowance: existingSettings.domestic_daily_allowance || 15000,
            overseas_daily_allowance: existingSettings.overseas_daily_allowance || 25000,
            transportation_daily_allowance: existingSettings.transportation_daily_allowance || 6000,
            accommodation_daily_allowance: existingSettings.accommodation_daily_allowance || 16000,
            use_transportation_allowance: existingSettings.use_transportation_allowance ?? true,
            use_accommodation_allowance: existingSettings.use_accommodation_allowance ?? true
          });
        } else {
          console.log('No allowance settings found, using defaults');
        }
      } catch (err) {
        console.log('日当設定の読み込みに失敗しました（デフォルト値を使用）:', err);
      }
    };

    loadAllowanceSettings();
  }, [user?.id]);

  // 出張日当の自動計算（マイページの日当設定を使用）
  const calculateDailyAllowance = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // マイページの日当設定を使用
      const dailyRate = formData.isOverseas 
        ? allowanceSettings.overseas_daily_allowance 
        : allowanceSettings.domestic_daily_allowance;
      const transportationRate = allowanceSettings.transportation_daily_allowance;
      const accommodationRate = allowanceSettings.accommodation_daily_allowance;

      // 計算式：
      // 出張日当 = 日数 × 出張日当（国内/海外）
      // 交通費 = 日数 × 交通費日当（使用フラグがtrueの場合のみ）
      // 宿泊費 = (日数 - 1) × 宿泊日当（使用フラグがtrueで1泊以上の場合のみ）
      const dailyAllowance = days * dailyRate;
      const transportation = allowanceSettings.use_transportation_allowance ? days * transportationRate : 0;
      const accommodation = (allowanceSettings.use_accommodation_allowance && days > 1) ? (days - 1) * accommodationRate : 0;
      const total = dailyAllowance + transportation + accommodation;

      setFormData(prev => ({
        ...prev,
        estimatedExpenses: {
          dailyAllowance,
          transportation,
          accommodation,
          total
        }
      }));
    }
  };

  React.useEffect(() => {
    calculateDailyAllowance();
  }, [formData.startDate, formData.endDate, formData.isOverseas, allowanceSettings]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitError('ユーザー情報が取得できません');
      return;
    }

    if (!formData.purpose || !formData.startDate || !formData.endDate || !formData.destination) {
      setSubmitError('必須項目を入力してください');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 1. 出張申請を作成
      const businessTripData: Tables<'business_trip_applications'> = {
        user_id: user.id,
        title: `出張申請 - ${formData.destination}`,
        description: formData.purpose,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        purpose: formData.purpose,
        estimated_cost: formData.estimatedExpenses.total,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        approved_at: null,
        approved_by: null
      };

      const { data, error } = await supabase
        .from('business_trip_applications')
        .insert(businessTripData)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }

      const applicationId = data?.id;
      if (!applicationId) {
        throw new Error('出張申請の作成に失敗しました');
      }

      // 2. 添付ファイル情報を保存（Storageバケットが利用できない場合の対応）
      if (formData.attachments.length > 0) {
        for (const file of formData.attachments) {
          try {
            // ファイル名をユニークにする
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}_${file.name}`;
            
            // データベースに添付ファイル情報を保存
            const { error: dbError } = await supabase
              .from('business_trip_attachments')
              .insert({
                business_trip_application_id: applicationId,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                file_url: null, // Storageバケットが利用できない場合はnull
                file_path: `business_trip_attachments/${user.id}/${applicationId}/${uniqueFileName}` // 将来のStorageアップロード用パス
              });

            if (dbError) {
              console.error('添付ファイル情報の保存エラー:', dbError);
            } else {
              console.log(`ファイル情報を保存しました: ${file.name}`);
            }
          } catch (fileError) {
            console.error('ファイル処理エラー:', fileError);
            // 個別のファイルエラーはスキップして続行
          }
        }
      }

      alert('出張申請が正常に送信されました！');
      onNavigate('dashboard');
    } catch (error: any) {
      setSubmitError(error.message || '出張申請の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBack = () => {
    onNavigate('dashboard');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="flex h-screen relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="business-trip" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="business-trip" />
            </div>
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-8">出張申請</h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 基本情報 */}
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">基本情報</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        出張目的 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.purpose}
                        onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent backdrop-blur-xl"
                        placeholder="出張の目的を入力してください"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          出発日 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent backdrop-blur-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          帰着日 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent backdrop-blur-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          訪問先 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.destination}
                          onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent backdrop-blur-xl"
                          placeholder="訪問先を入力してください"
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isOverseas}
                            onChange={(e) => setFormData(prev => ({ ...prev, isOverseas: e.target.checked }))}
                            className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500 focus:ring-2"
                          />
                          <Globe className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">海外出張</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 予定経費 */}
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">
                    <Calculator className="w-5 h-5 inline mr-2" />
                    予定経費（自動計算）
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/30 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm text-slate-600 mb-1">
                        出張日当
                        <span className="text-xs text-slate-500 ml-2">
                          ({formData.isOverseas ? '海外' : '国内'})
                        </span>
                      </p>
                      <p className="text-2xl font-bold text-slate-800">¥{formData.estimatedExpenses.dailyAllowance.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        ¥{formData.isOverseas ? allowanceSettings.overseas_daily_allowance : allowanceSettings.domestic_daily_allowance}/日
                      </p>
                    </div>
                    <div className={`bg-white/30 rounded-lg p-4 backdrop-blur-sm ${
                      !allowanceSettings.use_transportation_allowance ? 'opacity-50' : ''
                    }`}>
                      <p className="text-sm text-slate-600 mb-1">交通費</p>
                      <p className="text-2xl font-bold text-slate-800">¥{formData.estimatedExpenses.transportation.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {allowanceSettings.use_transportation_allowance 
                          ? `¥${allowanceSettings.transportation_daily_allowance}/日`
                          : '使用しない（0円）'
                        }
                      </p>
                    </div>
                    <div className={`bg-white/30 rounded-lg p-4 backdrop-blur-sm ${
                      !allowanceSettings.use_accommodation_allowance ? 'opacity-50' : ''
                    }`}>
                      <p className="text-sm text-slate-600 mb-1">宿泊費</p>
                      <p className="text-2xl font-bold text-slate-800">¥{formData.estimatedExpenses.accommodation.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {allowanceSettings.use_accommodation_allowance 
                          ? `¥${allowanceSettings.accommodation_daily_allowance}/泊`
                          : '使用しない（0円）'
                        }
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-navy-600 to-navy-800 rounded-lg p-4 text-white">
                      <p className="text-sm text-navy-100 mb-1">合計</p>
                      <p className="text-2xl font-bold">¥{formData.estimatedExpenses.total.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* 計算詳細 */}
                  <div className="mt-4 p-4 bg-white/20 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">計算詳細</h3>
                    <div className="text-xs text-slate-600 space-y-1">
                      {formData.startDate && formData.endDate && (
                        <>
                          <p>出張期間: {formData.startDate} 〜 {formData.endDate}</p>
                          <p>日数: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}日</p>
                          <p>出張日当: {formData.isOverseas ? '海外' : '国内'} ¥{formData.isOverseas ? allowanceSettings.overseas_daily_allowance : allowanceSettings.domestic_daily_allowance}/日</p>
                          <p>交通費: {allowanceSettings.use_transportation_allowance 
                            ? `¥${allowanceSettings.transportation_daily_allowance}/日`
                            : '使用しない（0円）'
                          }</p>
                          <p>宿泊費: {allowanceSettings.use_accommodation_allowance 
                            ? `¥${allowanceSettings.accommodation_daily_allowance}/泊`
                            : '使用しない（0円）'
                          }</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 資料添付 */}
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">
                    <Upload className="w-5 h-5 inline mr-2" />
                    資料添付
                  </h2>
                  
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-navy-400 bg-navy-50/50' 
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">ファイルをドラッグ&ドロップするか、クリックして選択</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg cursor-pointer transition-colors backdrop-blur-sm"
                    >
                      ファイルを選択
                    </label>
                  </div>

                  {formData.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-slate-700">添付ファイル:</p>
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/30 rounded-lg p-3 backdrop-blur-sm">
                          <span className="text-sm text-slate-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* エラーメッセージ */}
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}

                {/* 送信ボタン */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-white/50 hover:bg-white/70 text-slate-700 rounded-lg font-medium transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{isSubmitting ? '送信中...' : '申請を送信'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessTripApplication;