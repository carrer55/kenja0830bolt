import React from 'react';
import { supabaseAuth } from '../lib/supabaseAuth';
import { useUserData } from '../hooks/useUserData';

export function AuthDebug() {
  const authState = supabaseAuth.getAuthState();
  const { user, isAuthenticated, loading } = authState;
  const { userData, loading: userDataLoading } = useUserData();

  if (process.env.NODE_ENV === 'production') {
    return null; // 本番環境では表示しない
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔐 認証状態デバッグ</h3>
      <div className="space-y-1">
        <p>認証状態: {isAuthenticated ? '✅ ログイン中' : '❌ 未ログイン'}</p>
        <p>ユーザーID: {user?.id || 'なし'}</p>
        <p>メール: {user?.email || 'なし'}</p>
        <p>名前: {user?.name || 'なし'}</p>
        <p>ローディング: {loading ? '🔄 中' : '✅ 完了'}</p>
        <p>ユーザーデータ: {userDataLoading ? '🔄 読み込み中' : '✅ 完了'}</p>
        <p>プロフィール: {userData.profile ? '✅ あり' : '❌ なし'}</p>
      </div>
    </div>
  );
}
