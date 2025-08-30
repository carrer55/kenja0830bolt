import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, History, Upload, Download, FileText } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { supabase } from '../lib/supabase';
import { supabaseAuth } from '../lib/supabaseAuth';
import type { Tables } from '../types/supabase';

interface TravelRegulationManagementProps {
  onNavigate: (view: 'dashboard' | 'business-trip' | 'expense' | 'tax-simulation' | 'travel-regulation-management' | 'travel-regulation-creation' | 'travel-regulation-history') => void;
}

interface RegulationWithPositions {
  id: string;
  regulation_name: string;
  company_name: string;
  company_address: string;
  representative: string;
  distance_threshold: number;
  implementation_date: string;
  revision_number: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  positions: Array<{
    position_name: string;
    domestic_daily_allowance: number;
    overseas_daily_allowance: number;
  }>;
}

function TravelRegulationManagement({ onNavigate }: TravelRegulationManagementProps) {
  const authState = supabaseAuth.getAuthState();
  const { user } = authState;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [regulations, setRegulations] = useState<RegulationWithPositions[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 規程データを読み込み
  useEffect(() => {
    if (user) {
      loadRegulations();
    }
  }, []);

  const loadRegulations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 出張規程とその役職別設定を取得
      const { data: regulationsData, error: regulationsError } = await supabase
        .from('travel_expense_regulations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (regulationsError) {
        throw regulationsError;
      }

      // 各規程の役職データを個別に取得
      const formattedRegulations: RegulationWithPositions[] = [];
      
      for (const reg of regulationsData || []) {
        // 役職データを取得
        const { data: positionsData, error: positionsError } = await supabase
          .from('regulation_positions')
          .select('*')
          .eq('regulation_id', reg.id);

        if (positionsError) {
          console.error('役職データの取得エラー:', positionsError);
        }

        formattedRegulations.push({
          id: reg.id,
          regulation_name: reg.regulation_name,
          company_name: reg.company_name || '',
          company_address: reg.company_address || '',
          representative: reg.representative || '',
          distance_threshold: reg.distance_threshold || 50,
          implementation_date: reg.implementation_date || '',
          revision_number: reg.revision_number || 1,
          status: reg.status || 'draft',
          createdAt: reg.created_at,
          updatedAt: reg.updated_at,
          positions: (positionsData || []).map(pos => ({
            position_name: pos.position_name,
            domestic_daily_allowance: pos.domestic_daily_allowance || 0,
            overseas_daily_allowance: pos.overseas_daily_allowance || 0
          }))
        });
      }

      setRegulations(formattedRegulations);
    } catch (err: any) {
      console.error('規程の読み込みエラー:', err);
      setError(err.message || '規程の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const filteredRegulations = regulations.filter(regulation =>
    (regulation.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (regulation.regulation_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('この規程を削除してもよろしいですか？')) {
      try {
        // 関連する役職データも自動的に削除される（CASCADE）
        const { error } = await supabase
          .from('travel_expense_regulations')
          .delete()
          .eq('id', id);

        if (error) throw error;

        alert('規程が削除されました');
        loadRegulations(); // データを再読み込み
      } catch (err: any) {
        alert('規程の削除に失敗しました: ' + err.message);
      }
    }
  };

  const handleEdit = (id: string) => {
    // 編集対象のIDをローカルストレージに保存
    localStorage.setItem('editingRegulationId', id);
    onNavigate('travel-regulation-creation');
  };

  const handleExportPDF = async (regulation: RegulationWithPositions) => {
    try {
      // 規程テキストを生成
      const regulationText = generateRegulationText(regulation);
      
      // PDF生成（印刷ダイアログを開く）
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${regulation.regulation_name}</title>
              <style>
                body { 
                  font-family: 'MS Gothic', monospace; 
                  font-size: 12px; 
                  line-height: 1.6; 
                  margin: 20px; 
                  white-space: pre-line;
                }
                h1 { 
                  text-align: center; 
                  font-size: 16px; 
                  margin-bottom: 30px; 
                }
                .content { 
                  white-space: pre-line; 
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              <div class="content">${regulationText}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      alert('PDF出力に失敗しました');
    }
  };

  const handleExportWord = (regulation: RegulationWithPositions) => {
    try {
      const regulationText = generateRegulationText(regulation);
      
      // テキストファイルとしてダウンロード
      const blob = new Blob([regulationText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${regulation.regulation_name}_v${regulation.revision_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Word出力に失敗しました');
    }
  };

  const generateRegulationText = (regulation: RegulationWithPositions) => {
    const implementationDate = new Date(regulation.implementation_date);
    const implementationYear = implementationDate.getFullYear();
    const implementationMonth = implementationDate.getMonth() + 1;
    const implementationDay = implementationDate.getDate();

    // 役職別日当テーブルを生成
    const positionTable = regulation.positions.map(pos => 
      `${pos.position_name}\t${pos.domestic_daily_allowance}\t実費\t実費\t${pos.overseas_daily_allowance}\t実費\t5000\t実費`
    ).join('\n');

    return `出張旅費規程

（目的）
第１条　この規程は、役員または従業員が社命により、出張する場合の、旅費について定めたものである。

（適用範囲）
第２条　この規程は、役員及び全ての従業員について適用する。

（旅費の種類）
第３条　この規程に基づく旅費とは、出張日当、交通費、宿泊料、支度料の四種とし、その支給基準は第７条規定のとおりとする。ただし、交通費及び宿泊料についてはそれぞれ実費精算とすることができる。

（出張の定義）
第４条　出張とは、従業員が自宅または通常の勤務地を起点として、片道${regulation.distance_threshold}ｋｍ以上の目的地に移動し、職務を遂行するものをいう。

（出張の承認）
第５条　従業員が出張を行う場合は、事前に所属長の承認を得なければならない。ただし、緊急の場合は事後承認とすることができる。

（出張の区分）
第６条　出張は、以下のとおり区分する。
　　　　１　国内出張
　　　　　国内出張とは、日本国内の用務先に赴く出張であり、所属長（または代表者）が認めたものとする。当日中に帰着することが可能なものは、日帰り出張として出張日当と交通費日当（実費精算可）、宿泊を伴う出張は、出張日当と交通費日当（実費精算可）、宿泊日当（実費精算可）を第７条に定める旅費を支給する。日帰り出張は1日、1泊2日は2日と日数を計算する。
　　　　２　海外出張
　　　　　海外出張とは、日本国外の地域への宿泊を伴う出張であり、所属長（または代表者）が認めたものとする。出張日当と交通費日当（実費精算可）、宿泊日当（実費精算可）に加えて、支度料を第７条に定める旅費を支給する。

（旅費一覧）
第７条　旅費は、以下のとおり役職に応じて支給する。
（円）
\t国内出張\t海外出張
役職\t出張日当\t宿泊料\t交通費\t出張日当\t宿泊料\t支度料\t交通費
${positionTable}

（交通機関）
第８条　利用する交通手段は、原則として、鉄道、船舶、飛行機、バスとする。
　　　　２　前項に関わらず、会社が必要と認めた場合は、タクシーまたは社有の自動車を利用できるものとする。

（旅費の支給方法）
第９条　旅費は、原則として出張終了後に精算により支給する。ただし、必要に応じて概算払いを行うことができる。

（規程の改廃）
第１０条　本規程の改廃は、取締役会の決議により行う。

（附則）
第１１条　本規程は、令和${implementationYear - 2018}年${implementationMonth}月${implementationDay}日より実施する。

${regulation.company_name}
${regulation.representative}`;
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      alert('PDFアップロード機能は現在開発中です。');
      setShowUploadModal(false);
    } else {
      alert('PDFファイルを選択してください。');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-700 bg-emerald-100';
      case 'draft':
        return 'text-amber-700 bg-amber-100';
      case 'archived':
        return 'text-slate-700 bg-slate-100';
      default:
        return 'text-slate-700 bg-slate-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '運用中';
      case 'draft':
        return '下書き';
      case 'archived':
        return 'アーカイブ';
      default:
        return '不明';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="flex h-screen relative">
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="travel-regulation-management" />
        </div>

        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="travel-regulation-management" />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">出張規定管理</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-lg font-medium hover:from-slate-700 hover:to-slate-900 transition-all duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    <span>PDFアップロード</span>
                  </button>
                  <button
                    onClick={() => onNavigate('travel-regulation-creation')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-navy-700 to-navy-900 text-white rounded-lg font-medium hover:from-navy-800 hover:to-navy-950 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新規作成</span>
                  </button>
                </div>
              </div>

              {/* 検索バー */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 border border-white/30 shadow-xl mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="規程名やバージョンで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                  />
                </div>
              </div>

              {/* 規程一覧 */}
              {loading ? (
                <div className="backdrop-blur-xl bg-white/20 rounded-xl border border-white/30 shadow-xl p-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">規程を読み込み中...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="backdrop-blur-xl bg-red-50/20 rounded-xl border border-red-200/30 shadow-xl p-6">
                  <p className="text-red-700 text-center">{error}</p>
                  <div className="text-center mt-4">
                    <button
                      onClick={loadRegulations}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      再試行
                    </button>
                  </div>
                </div>
              ) : (
                <div className="backdrop-blur-xl bg-white/20 rounded-xl border border-white/30 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/30 border-b border-white/30">
                        <tr>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">会社名</th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">規程名</th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">ステータス</th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">作成日</th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">更新日</th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">日当設定</th>
                          <th className="text-center py-4 px-6 font-medium text-slate-700">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegulations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-500">
                              {searchTerm ? '検索結果が見つかりません' : '規程が登録されていません'}
                            </td>
                          </tr>
                        ) : (
                          filteredRegulations.map((regulation) => (
                            <tr key={regulation.id} className="border-b border-white/20 hover:bg-white/20 transition-colors">
                              <td className="py-4 px-6 text-slate-800 font-medium">{regulation.company_name}</td>
                              <td className="py-4 px-6 text-slate-700">{regulation.regulation_name}</td>
                              <td className="py-4 px-6">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(regulation.status)}`}>
                                  {getStatusText(regulation.status)}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-600 text-sm">
                                {new Date(regulation.createdAt).toLocaleDateString('ja-JP')}
                              </td>
                              <td className="py-4 px-6 text-slate-600 text-sm">
                                {new Date(regulation.updatedAt).toLocaleDateString('ja-JP')}
                              </td>
                              <td className="py-4 px-6 text-slate-600 text-sm">
                                <div className="space-y-1">
                                  {regulation.positions.length > 0 ? (
                                    <>
                                      <div>国内: ¥{regulation.positions[0]?.domestic_daily_allowance.toLocaleString()}</div>
                                      <div>海外: ¥{regulation.positions[0]?.overseas_daily_allowance.toLocaleString()}</div>
                                    </>
                                  ) : (
                                    <div className="text-slate-400">未設定</div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => handleEdit(regulation.id)}
                                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-colors"
                                    title="編集"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onNavigate('travel-regulation-history')}
                                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-colors"
                                    title="履歴"
                                  >
                                    <History className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleExportPDF(regulation)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50/30 rounded-lg transition-colors"
                                    title="PDF出力"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleExportWord(regulation)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50/30 rounded-lg transition-colors"
                                    title="Word出力"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(regulation.id)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50/30 rounded-lg transition-colors"
                                    title="削除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDFアップロードモーダル */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">PDFファイルをアップロード</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">出張規程のPDFファイルを選択してください</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-block px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                ファイルを選択
              </label>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelRegulationManagement;