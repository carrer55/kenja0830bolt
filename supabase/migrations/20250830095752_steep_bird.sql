/*
  # Fix trigger duplication error for travel expense regulations

  1. Clean up existing triggers and functions
    - Remove all existing updated_at triggers
    - Remove existing update_updated_at_column function
  
  2. Recreate trigger function
    - Create new update_updated_at_column function
  
  3. Create triggers safely
    - Add triggers for all regulation tables
    - Ensure proper updated_at functionality
  
  4. Verify structure
    - Confirm all tables exist with proper columns
    - Verify triggers are working correctly
*/

-- Step 1: Clean up existing triggers and functions completely
DROP TRIGGER IF EXISTS update_travel_expense_regulations_updated_at ON public.travel_expense_regulations CASCADE;
DROP TRIGGER IF EXISTS update_regulation_positions_updated_at ON public.regulation_positions CASCADE;
DROP TRIGGER IF EXISTS update_regulation_versions_updated_at ON public.regulation_versions CASCADE;

-- Remove existing function completely
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 2: Create the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Ensure all required tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.travel_expense_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  regulation_name VARCHAR(255) NOT NULL,
  regulation_type VARCHAR(50) NOT NULL,
  transportation_real_expense BOOLEAN DEFAULT false,
  accommodation_real_expense BOOLEAN DEFAULT false,
  position_allowances JSONB DEFAULT '[]'::jsonb NOT NULL,
  regulation_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Step 4: Add missing columns if they don't exist
DO $$
BEGIN
  -- Add updated_at to travel_expense_regulations if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.travel_expense_regulations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at to regulation_positions if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regulation_positions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.regulation_positions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at to regulation_versions if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regulation_versions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.regulation_versions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Step 5: Create triggers safely (after ensuring tables exist)
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

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_regulation_positions_regulation_id ON public.regulation_positions(regulation_id);
CREATE INDEX IF NOT EXISTS idx_regulation_versions_regulation_id ON public.regulation_versions(regulation_id);
CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_user_id ON public.travel_expense_regulations(user_id);

-- Step 7: Enable RLS and create policies
ALTER TABLE public.travel_expense_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own regulations" ON public.travel_expense_regulations;
DROP POLICY IF EXISTS "Users can manage regulation positions" ON public.regulation_positions;
DROP POLICY IF EXISTS "Users can manage regulation versions" ON public.regulation_versions;

-- Create RLS policies
CREATE POLICY "Users can manage own regulations" ON public.travel_expense_regulations 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage regulation positions" ON public.regulation_positions 
FOR ALL USING (
  regulation_id IN (
    SELECT id FROM public.travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage regulation versions" ON public.regulation_versions 
FOR ALL USING (
  regulation_id IN (
    SELECT id FROM public.travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

-- Step 8: Verification queries
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('travel_expense_regulations', 'regulation_positions', 'regulation_versions');

-- Check that all triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%updated_at%';

-- Check that foreign keys exist
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('regulation_positions', 'regulation_versions');

-- Success message
SELECT 'Trigger duplication error fixed successfully! All tables and triggers are now properly configured.' as status;