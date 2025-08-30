-- Supabaseデータベース初期化SQL
-- このファイルはSupabaseのSQL Editorで実行してください

-- 1. ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 2. 経費申請テーブル
CREATE TABLE IF NOT EXISTS public.expense_applications (
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

-- 3. 出張申請テーブル
CREATE TABLE IF NOT EXISTS public.business_trip_applications (
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

-- 4. 通知テーブル
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS（Row Level Security）ポリシーの設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_trip_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- プロフィールのRLSポリシー
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 経費申請のRLSポリシー
CREATE POLICY "Users can view own expense applications" ON public.expense_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense applications" ON public.expense_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense applications" ON public.expense_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense applications" ON public.expense_applications
    FOR DELETE USING (auth.uid() = user_id);

-- 管理者・マネージャーは全申請を閲覧可能
CREATE POLICY "Managers can view all expense applications" ON public.expense_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers can update all expense applications" ON public.expense_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 出張申請のRLSポリシー
CREATE POLICY "Users can view own business trip applications" ON public.business_trip_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business trip applications" ON public.business_trip_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business trip applications" ON public.business_trip_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business trip applications" ON public.business_trip_applications
    FOR DELETE USING (auth.uid() = user_id);

-- 管理者・マネージャーは全申請を閲覧可能
CREATE POLICY "Managers can view all business trip applications" ON public.business_trip_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers can update all business trip applications" ON public.business_trip_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 通知のRLSポリシー
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_expense_applications_user_id ON public.expense_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_applications_status ON public.expense_applications(status);
CREATE INDEX IF NOT EXISTS idx_expense_applications_created_at ON public.expense_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_business_trip_applications_user_id ON public.business_trip_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_business_trip_applications_status ON public.business_trip_applications(status);
CREATE INDEX IF NOT EXISTS idx_business_trip_applications_created_at ON public.business_trip_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 7. サンプルデータの挿入（オプション）
-- 注意: 本番環境では削除してください

-- サンプルユーザープロフィール
INSERT INTO public.profiles (id, email, full_name, company, position, role, department) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@example.com', '管理者太郎', '株式会社サンプル', '代表取締役', 'admin', '経営企画部'),
    ('00000000-0000-0000-0000-000000000002', 'manager@example.com', 'マネージャー花子', '株式会社サンプル', '部長', 'manager', '営業部'),
    ('00000000-0000-0000-0000-000000000003', 'user@example.com', '一般次郎', '株式会社サンプル', '主任', 'user', '総務部')
ON CONFLICT (id) DO NOTHING;

-- サンプル経費申請
INSERT INTO public.expense_applications (user_id, title, description, amount, category, status) VALUES
    ('00000000-0000-0000-0000-000000000003', '交通費', '電車賃', 500, '交通費', 'approved'),
    ('00000000-0000-0000-0000-000000000003', '会議費', '打ち合わせコーヒー', 800, '会議費', 'pending'),
    ('00000000-0000-0000-0000-000000000002', '書籍代', 'ビジネス書', 1500, '教育費', 'approved')
ON CONFLICT DO NOTHING;

-- サンプル出張申請
INSERT INTO public.business_trip_applications (user_id, title, destination, start_date, end_date, purpose, estimated_cost, status) VALUES
    ('00000000-0000-0000-0000-000000000002', '東京出張', '東京', '2024-01-15', '2024-01-16', '顧客訪問', 25000, 'approved'),
    ('00000000-0000-0000-0000-000000000003', '大阪出張', '大阪', '2024-01-20', '2024-01-21', '展示会参加', 35000, 'pending')
ON CONFLICT DO NOTHING;

-- サンプル通知
INSERT INTO public.notifications (user_id, title, message, type) VALUES
    ('00000000-0000-0000-0000-000000000003', '申請が承認されました', '交通費の申請が承認されました。', 'success'),
    ('00000000-0000-0000-0000-000000000002', '新しい申請があります', '一般次郎さんから経費申請が提出されました。', 'info'),
    ('00000000-0000-0000-0000-000000000001', 'システムメンテナンス', 'システムメンテナンスが完了しました。', 'success')
ON CONFLICT DO NOTHING;

-- 8. 関数とトリガーの作成
-- 更新日時を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時を自動更新するトリガー
CREATE TRIGGER update_expense_applications_updated_at 
    BEFORE UPDATE ON public.expense_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_trip_applications_updated_at 
    BEFORE UPDATE ON public.business_trip_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. ビューの作成（オプション）
-- 申請状況のサマリービュー
CREATE OR REPLACE VIEW application_summary AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.role,
    COUNT(CASE WHEN ea.status = 'pending' THEN 1 END) as pending_expenses,
    COUNT(CASE WHEN ea.status = 'approved' THEN 1 END) as approved_expenses,
    COUNT(CASE WHEN bta.status = 'pending' THEN 1 END) as pending_trips,
    COUNT(CASE WHEN bta.status = 'approved' THEN 1 END) as approved_trips,
    SUM(CASE WHEN ea.status = 'approved' THEN ea.amount ELSE 0 END) as total_approved_expenses,
    SUM(CASE WHEN bta.status = 'approved' THEN bta.estimated_cost ELSE 0 END) as total_approved_trips
FROM public.profiles p
LEFT JOIN public.expense_applications ea ON p.id = ea.user_id
LEFT JOIN public.business_trip_applications bta ON p.id = bta.user_id
GROUP BY p.id, p.full_name, p.role;

-- 10. コメント
COMMENT ON TABLE public.profiles IS 'ユーザープロフィール情報';
COMMENT ON TABLE public.expense_applications IS '経費申請';
COMMENT ON TABLE public.business_trip_applications IS '出張申請';
COMMENT ON TABLE public.notifications IS '通知';
COMMENT ON VIEW application_summary IS '申請状況のサマリービュー';

