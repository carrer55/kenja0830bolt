import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Upload, Calculator, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { supabaseAuth } from '../lib/supabaseAuth';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

interface ExpenseApplicationProps {
  onNavigate: (view: string) => void;
}

interface ExpenseItem {
  id?: string;
  category_code: string;
  date: string;
  amount: number;
  description: string;
  receipt_url?: string;
  attachments: File[];
}

interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  sort_order: number;
}

function ExpenseApplication({ onNavigate }: ExpenseApplicationProps) {
  const authState = supabaseAuth.getAuthState();
  const { user } = authState;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [formData, setFormData] = useState({
    status: 'pending'
  });
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    {
      category_code: '',
      date: '',
      amount: 0,
      description: '',
      attachments: []
    }
  ]);
  const [totalAmount, setTotalAmount] = useState(0);

  // 経費カテゴリを読み込み
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('カテゴリの読み込みに失敗しました:', err);
      }
    };

    loadCategories();
  }, []);

  // 合計金額を計算
  useEffect(() => {
    const total = expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    setTotalAmount(total);
  }, [expenseItems]);

  // 経費項目を追加
  const addExpenseItem = () => {
    setExpenseItems(prev => [...prev, {
      category_code: '',
      date: '',
      amount: 0,
      description: '',
      attachments: []
    }]);
  };

  // 経費項目を削除
  const removeExpenseItem = (index: number) => {
    if (expenseItems.length > 1) {
      setExpenseItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 経費項目を更新
  const updateExpenseItem = (index: number, field: keyof ExpenseItem, value: any) => {
    setExpenseItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // ファイルを追加
  const addFile = (index: number, files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    setExpenseItems(prev => prev.map((item, i) => 
      i === index ? { ...item, attachments: [...item.attachments, ...newFiles] } : item
    ));
  };

  // ファイルを削除
  const removeFile = (itemIndex: number, fileIndex: number) => {
    setExpenseItems(prev => prev.map((item, i) => 
      i === itemIndex ? { 
        ...item, 
        attachments: item.attachments.filter((_, fi) => fi !== fileIndex) 
      } : item
    ));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (expenseItems.length === 0) {
      alert('経費項目を入力してください');
      return;
    }

    // 経費項目の検証
    const invalidItems = expenseItems.filter(item => 
      !item.category_code || !item.date || item.amount <= 0
    );

    if (invalidItems.length > 0) {
      alert('経費項目の入力が不完全です。カテゴリ、日付、金額を確認してください。');
      return;
    }

    setLoading(true);

    try {
      // 経費申請を作成
      const { data: application, error: appError } = await supabase
        .from('expense_applications')
        .insert({
          user_id: user.id,
          title: '経費申請', // デフォルトタイトル
          amount: totalAmount,
          category: 'MISCELLANEOUS', // デフォルトカテゴリ
          status: 'pending'
        } as any)
        .select()
        .single();

      if (appError) throw appError;

      // 経費項目を作成
      const itemsToInsert = expenseItems.map(item => ({
        expense_application_id: (application as any).id,
        category_code: item.category_code,
        date: item.date,
        amount: item.amount,
        description: item.description,
        receipt_url: item.receipt_url
      }));

      const { error: itemsError } = await supabase
        .from('expense_application_items')
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;

      // 添付ファイル情報を保存
      for (let i = 0; i < expenseItems.length; i++) {
        const item = expenseItems[i];
        if (item.attachments.length > 0) {
          for (const file of item.attachments) {
            try {
              // ファイル名をユニークにする
              const timestamp = Date.now();
              const uniqueFileName = `${timestamp}_${file.name}`;
              
              // データベースに添付ファイル情報を保存
              const { error: dbError } = await supabase
                .from('expense_attachments')
                .insert({
                  expense_application_id: (application as any).id,
                  file_name: file.name,
                  file_size: file.size,
                  file_type: file.type,
                  file_url: null, // Storageバケットが利用できない場合はnull
                  file_path: `expense_attachments/${user.id}/${(application as any).id}/${uniqueFileName}` // 将来のStorageアップロード用パス
                } as any);

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
      }

      alert('経費申請が正常に送信されました！');
      onNavigate('dashboard');
    } catch (error: any) {
      console.error('経費申請の送信に失敗しました:', error);
      alert('経費申請の送信に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="flex h-screen relative">
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="expense" />
        </div>

        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="expense" />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-8">経費申請</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">


                {/* 経費項目 */}
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">経費項目</h2>
                    <button
                      type="button"
                      onClick={addExpenseItem}
                      className="flex items-center space-x-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>項目を追加</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {expenseItems.map((item, index) => (
                      <div key={index} className="bg-white/30 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-slate-700">経費項目 {index + 1}</h3>
                          {expenseItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeExpenseItem(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              種別 <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.category_code}
                              onChange={(e) => updateExpenseItem(index, 'category_code', e.target.value)}
                              className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                              required
                            >
                              <option value="">選択してください</option>
                              {categories.map(category => (
                                <option key={category.code} value={category.code}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              申請日 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => updateExpenseItem(index, 'date', e.target.value)}
                              className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              金額 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={item.amount || ''}
                              onChange={(e) => updateExpenseItem(index, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                              placeholder="0"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              詳細説明（任意）
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateExpenseItem(index, 'description', e.target.value)}
                              className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 backdrop-blur-xl"
                              placeholder="経費の詳細説明"
                            />
                          </div>
                        </div>

                        {/* 領収書アップロード */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Upload className="w-4 h-4 inline mr-1" />
                            領収書・請求書をアップロード
                          </label>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-4">
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                onChange={(e) => addFile(index, e.target.files)}
                                className="hidden"
                                id={`receipt-upload-${index}`}
                              />
                              <label
                                htmlFor={`receipt-upload-${index}`}
                                className="flex items-center space-x-2 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg cursor-pointer transition-colors backdrop-blur-sm"
                              >
                                <Upload className="w-4 h-4" />
                                <span>ファイルを選択</span>
                              </label>
                            </div>
                            
                            {/* 添付ファイル一覧 */}
                            {item.attachments.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700">添付ファイル:</p>
                                {item.attachments.map((file, fileIndex) => (
                                  <div key={fileIndex} className="flex items-center justify-between bg-white/30 rounded-lg p-3 backdrop-blur-sm">
                                    <span className="text-sm text-slate-700">{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeFile(index, fileIndex)}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      削除
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 合計金額表示 */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-navy-600 to-navy-800 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-navy-100 text-sm">合計金額</p>
                        <p className="text-3xl font-bold">¥{totalAmount.toLocaleString()}</p>
                      </div>
                      <Calculator className="w-12 h-12 text-navy-200" />
                    </div>
                  </div>
                </div>

                {/* 送信ボタン */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    disabled={loading}
                    className="px-6 py-3 bg-white/50 hover:bg-white/70 text-slate-700 rounded-lg font-medium transition-colors backdrop-blur-sm disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-900 hover:from-navy-800 hover:to-navy-950 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{loading ? '送信中...' : '申請を送信'}</span>
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

export default ExpenseApplication;