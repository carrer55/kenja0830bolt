import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, FileText, Calendar, MapPin, Search, CheckCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { supabaseAuth } from '../lib/supabaseAuth';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

interface BusinessTripReportCreationProps {
  onNavigate: (view: string) => void;
}

interface BusinessTripApplication extends Tables<'business_trip_applications'> {
  user?: {
    full_name: string;
    department: string;
  };
}

interface BusinessTripReport extends Tables<'business_trip_reports'> {}

function BusinessTripReportCreation({ onNavigate }: BusinessTripReportCreationProps) {
  const authState = supabaseAuth.getAuthState();
  const { user } = authState;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<BusinessTripApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<BusinessTripApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    report_title: '',
    destination: '',
    start_date: '',
    end_date: '',
    purpose: ''
  });

  // 出張申請一覧を読み込み（既に報告書が作成されていないもののみ）
  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    if (!user) return;
    
    try {
      // 承認済みの出張申請を取得（報告書がまだ作成されていないもの）
      const { data: apps, error: appsError } = await supabase
        .from('business_trip_applications')
        .select(`
          *,
          user:profiles!business_trip_applications_user_id_fkey (
            full_name,
            department
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('出張申請の読み込みエラー:', appsError);
        return;
      }

      // 既に報告書が作成されている申請を除外
      if (apps) {
        const { data: existingReports, error: reportsError } = await supabase
          .from('business_trip_reports')
          .select('business_trip_application_id')
          .eq('user_id', user.id);

        if (reportsError) {
          console.error('報告書の読み込みエラー:', reportsError);
          return;
        }

        const reportedApplicationIds = new Set(
          existingReports?.map(report => report.business_trip_application_id) || []
        );

        const availableApplications = apps.filter(app => !reportedApplicationIds.has(app.id));
        setApplications(availableApplications);
      }
    } catch (error) {
      console.error('出張申請の読み込みエラー:', error);
    }
  };

  const handleApplicationSelect = (application: BusinessTripApplication) => {
    setSelectedApplication(application);
    setFormData({
      report_title: `${application.destination}出張報告書`,
      destination: application.destination || '',
      start_date: application.start_date || '',
      end_date: application.end_date || '',
      purpose: application.purpose || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedApplication) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('business_trip_reports')
        .insert({
          user_id: user.id,
          business_trip_application_id: selectedApplication.id,
          report_title: formData.report_title,
          destination: formData.destination,
          start_date: formData.start_date,
          end_date: formData.end_date,
          purpose: formData.purpose,
          status: 'draft'
        } as any);

      if (error) throw error;

      alert('出張報告書が正常に作成されました！');
      onNavigate('document-management');
    } catch (error: any) {
      console.error('出張報告書の作成に失敗しました:', error);
      alert('出張報告書の作成に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const filteredApplications = applications.filter(app =>
    app.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="flex h-screen relative">
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="document-management" />
        </div>

        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="document-management" />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => onNavigate('document-management')}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>戻る</span>
                </button>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">出張報告書作成</h1>
                <div className="w-24"></div> {/* 中央揃えのためのスペーサー */}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 出張申請選択 */}
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    出張申請を選択
                  </h2>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="出張先や目的で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/40 rounded-lg text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => handleApplicationSelect(app)}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedApplication?.id === app.id
                              ? 'bg-navy-100 border-2 border-navy-400'
                              : 'bg-white/30 hover:bg-white/50 border border-white/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-slate-800">{app.destination}</h3>
                            {selectedApplication?.id === app.id && (
                              <CheckCircle className="w-5 h-5 text-navy-600" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{app.purpose}</p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(app.start_date || '').toLocaleDateString('ja-JP')} 〜 {new Date(app.end_date || '').toLocaleDateString('ja-JP')}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {app.user?.department || '不明'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                        <p>選択可能な出張申請がありません</p>
                        <p className="text-sm mt-1">承認済みの出張申請から選択してください</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 報告書作成フォーム */}
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">報告書内容</h2>
                  
                  {selectedApplication ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          報告書タイトル <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.report_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, report_title: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          出張先 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.destination}
                          onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            出張開始日 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            出張終了日 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          出張目的
                        </label>
                        <textarea
                          value={formData.purpose}
                          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                          placeholder="出張の目的を詳しく記載してください"
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                          <span>{loading ? '作成中...' : '報告書を作成'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg font-medium">出張申請を選択してください</p>
                      <p className="text-sm mt-2">左側のリストから報告書を作成する出張申請を選択してください</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessTripReportCreation;
