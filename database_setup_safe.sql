-- 賢者の精算システム - 安全なデータベースセットアップスクリプト
-- SupabaseダッシュボードのSQL Editorで実行してください
-- 既存のオブジェクトとの重複を避けるため、DROP IF EXISTSを使用

-- 1. 既存のポリシーを削除（安全のため）
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own expense applications" ON public.expense_applications;
DROP POLICY IF EXISTS "Users can insert own expense applications" ON public.expense_applications;
DROP POLICY IF EXISTS "Users can update own expense applications" ON public.expense_applications;
DROP POLICY IF EXISTS "Users can delete own expense applications" ON public.expense_applications;
DROP POLICY IF EXISTS "Admins can view all expense applications" ON public.expense_applications;
DROP POLICY IF EXISTS "Admins can update all expense applications" ON public.expense_applications;

DROP POLICY IF EXISTS "Users can view own business trip applications" ON public.business_trip_applications;
DROP POLICY IF EXISTS "Users can insert own business trip applications" ON public.business_trip_applications;
DROP POLICY IF EXISTS "Users can update own business trip applications" ON public.business_trip_applications;
DROP POLICY IF EXISTS "Users can delete own business trip applications" ON public.business_trip_applications;
DROP POLICY IF EXISTS "Admins can view all business trip applications" ON public.business_trip_applications;
DROP POLICY IF EXISTS "Admins can update all business trip applications" ON public.business_trip_applications;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- 2. 既存のトリガーを削除
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_expense_applications_updated_at ON public.expense_applications;
DROP TRIGGER IF EXISTS update_business_trip_applications_updated_at ON public.business_trip_applications;

-- 3. 既存のインデックスを削除
DROP INDEX IF EXISTS idx_expense_applications_user_id;
DROP INDEX IF EXISTS idx_expense_applications_status;
DROP INDEX IF EXISTS idx_expense_applications_created_at;
DROP INDEX IF EXISTS idx_business_trip_applications_user_id;
DROP INDEX IF EXISTS idx_business_trip_applications_status;
DROP INDEX IF EXISTS idx_business_trip_applications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;

-- 4. 既存のテーブルを削除（注意：データが失われます）
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.business_trip_applications CASCADE;
DROP TABLE IF EXISTS public.expense_applications CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 5. プロフィールテーブルの作成
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company TEXT,
    position TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 経費申請テーブルの作成
CREATE TABLE public.expense_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'JPY',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    category TEXT NOT NULL,
    receipt_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 出張申請テーブルの作成
CREATE TABLE public.business_trip_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 通知テーブルの作成
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. RLS（Row Level Security）の有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_trip_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 10. RLSポリシーの作成

-- プロフィールテーブルのポリシー
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 経費申請テーブルのポリシー
CREATE POLICY "Users can view own expense applications" ON public.expense_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense applications" ON public.expense_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense applications" ON public.expense_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense applications" ON public.expense_applications
    FOR DELETE USING (auth.uid() = user_id);

-- 管理者はすべての経費申請を閲覧・更新可能
CREATE POLICY "Admins can view all expense applications" ON public.expense_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can update all expense applications" ON public.expense_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 出張申請テーブルのポリシー
CREATE POLICY "Users can view own business trip applications" ON public.business_trip_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business trip applications" ON public.business_trip_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business trip applications" ON public.business_trip_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business trip applications" ON public.business_trip_applications
    FOR DELETE USING (auth.uid() = user_id);

-- 管理者はすべての出張申請を閲覧・更新可能
CREATE POLICY "Admins can view all business trip applications" ON public.business_trip_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can update all business trip applications" ON public.business_trip_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 通知テーブルのポリシー
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 11. インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_expense_applications_user_id ON public.expense_applications(user_id);
CREATE INDEX idx_expense_applications_status ON public.expense_applications(status);
CREATE INDEX idx_expense_applications_created_at ON public.expense_applications(created_at);

CREATE INDEX idx_business_trip_applications_user_id ON public.business_trip_applications(user_id);
CREATE INDEX idx_business_trip_applications_status ON public.business_trip_applications(status);
CREATE INDEX idx_business_trip_applications_created_at ON public.business_trip_applications(created_at);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- 12. トリガー関数の作成（updated_atの自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. トリガーの作成
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_applications_updated_at BEFORE UPDATE ON public.expense_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_trip_applications_updated_at BEFORE UPDATE ON public.business_trip_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 完了メッセージ
SELECT 'データベースセットアップが完了しました！' as message;
