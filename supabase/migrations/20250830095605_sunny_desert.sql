/*
  # Fix trigger duplication error and ensure proper database structure

  1. Database Cleanup
    - Remove duplicate triggers safely
    - Clean up any conflicting functions
    - Verify existing table structures

  2. Table Structure Verification
    - Ensure all required tables exist with proper columns
    - Add missing columns if needed
    - Verify foreign key relationships

  3. Trigger and Function Recreation
    - Create updated_at trigger function
    - Apply triggers to all relevant tables
    - Ensure proper cascade behavior

  4. Security and Performance
    - Enable RLS on all tables
    - Create proper access policies
    - Add performance indexes
*/

-- Step 1: Clean up existing triggers and functions
DROP TRIGGER IF EXISTS update_travel_expense_regulations_updated_at ON public.travel_expense_regulations;
DROP TRIGGER IF EXISTS update_regulation_positions_updated_at ON public.regulation_positions;
DROP TRIGGER IF EXISTS update_regulation_versions_updated_at ON public.regulation_versions;

-- Step 2: Ensure all required tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.travel_expense_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  regulation_name VARCHAR(255) NOT NULL,
  regulation_type VARCHAR(50) NOT NULL DEFAULT 'domestic',
  company_name TEXT,
  company_address TEXT,
  representative TEXT,
  distance_threshold INTEGER DEFAULT 50,
  transportation_real_expense BOOLEAN DEFAULT false,
  accommodation_real_expense BOOLEAN DEFAULT false,
  position_allowances JSONB DEFAULT '[]'::jsonb NOT NULL,
  regulation_text TEXT,
  implementation_date DATE,
  revision_number INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.regulation_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID NOT NULL REFERENCES public.travel_expense_regulations(id) ON DELETE CASCADE,
  position_name TEXT NOT NULL,
  domestic_daily_allowance INTEGER DEFAULT 0,
  domestic_accommodation_allowance INTEGER DEFAULT 0,
  domestic_transportation_allowance INTEGER DEFAULT 0,
  overseas_daily_allowance INTEGER DEFAULT 0,
  overseas_accommodation_allowance INTEGER DEFAULT 0,
  overseas_preparation_allowance INTEGER DEFAULT 0,
  overseas_transportation_allowance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.regulation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID NOT NULL REFERENCES public.travel_expense_regulations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes_description TEXT,
  regulation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add missing columns if they don't exist
DO $$
BEGIN
  -- Add updated_at column to travel_expense_regulations if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.travel_expense_regulations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at column to regulation_positions if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regulation_positions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.regulation_positions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at column to regulation_versions if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regulation_versions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.regulation_versions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Step 4: Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create triggers for automatic updated_at updates
CREATE TRIGGER update_travel_expense_regulations_updated_at
  BEFORE UPDATE ON public.travel_expense_regulations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regulation_positions_updated_at
  BEFORE UPDATE ON public.regulation_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regulation_versions_updated_at
  BEFORE UPDATE ON public.regulation_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_regulation_positions_regulation_id ON public.regulation_positions(regulation_id);
CREATE INDEX IF NOT EXISTS idx_regulation_versions_regulation_id ON public.regulation_versions(regulation_id);
CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_user_id ON public.travel_expense_regulations(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_status ON public.travel_expense_regulations(status);
CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_active ON public.travel_expense_regulations(is_active);

-- Step 7: Enable RLS and create security policies
ALTER TABLE public.travel_expense_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own regulations" ON public.travel_expense_regulations;
DROP POLICY IF EXISTS "Users can manage regulation positions" ON public.regulation_positions;
DROP POLICY IF EXISTS "Users can manage regulation versions" ON public.regulation_versions;

-- Create RLS policies
CREATE POLICY "Users can manage own regulations" 
ON public.travel_expense_regulations FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage regulation positions" 
ON public.regulation_positions FOR ALL 
USING (
  regulation_id IN (
    SELECT id FROM public.travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage regulation versions" 
ON public.regulation_versions FOR ALL 
USING (
  regulation_id IN (
    SELECT id FROM public.travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

-- Step 8: Add table comments for documentation
COMMENT ON TABLE public.travel_expense_regulations IS '出張旅費規程マスターテーブル';
COMMENT ON TABLE public.regulation_positions IS '規程の役職別日当設定テーブル';
COMMENT ON TABLE public.regulation_versions IS '規程のバージョン履歴テーブル';

-- Step 9: Verify table creation
DO $$
BEGIN
  -- Check if all tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'travel_expense_regulations') THEN
    RAISE EXCEPTION 'travel_expense_regulations table was not created properly';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regulation_positions') THEN
    RAISE EXCEPTION 'regulation_positions table was not created properly';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regulation_versions') THEN
    RAISE EXCEPTION 'regulation_versions table was not created properly';
  END IF;
  
  RAISE NOTICE 'All regulation tables created successfully';
END $$;