/*
  # Emergency fix for table relationships

  1. Table Structure Verification and Creation
    - Ensure `travel_expense_regulations` table exists with proper structure
    - Create `regulation_positions` table with foreign key to regulations
    - Add proper indexes for performance

  2. Foreign Key Relationships
    - Add foreign key constraint from regulation_positions to travel_expense_regulations
    - Ensure CASCADE deletion for data integrity

  3. Security
    - Enable RLS on both tables
    - Add policies for user access control

  4. Data Migration
    - Safely handle existing data if any
    - Ensure no data loss during schema updates
*/

-- Step 1: Ensure travel_expense_regulations table exists with correct structure
CREATE TABLE IF NOT EXISTS travel_expense_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  regulation_name VARCHAR(255) NOT NULL,
  regulation_type VARCHAR(50) NOT NULL DEFAULT 'domestic',
  company_name TEXT,
  company_address TEXT,
  representative TEXT,
  distance_threshold INTEGER DEFAULT 50,
  implementation_date DATE,
  revision_number INTEGER DEFAULT 1,
  is_transportation_real_expense BOOLEAN DEFAULT false,
  is_accommodation_real_expense BOOLEAN DEFAULT false,
  regulation_full_text TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Step 2: Create regulation_positions table with proper foreign key
CREATE TABLE IF NOT EXISTS regulation_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID NOT NULL,
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

-- Step 3: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  -- Check if foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'regulation_positions_regulation_id_fkey'
    AND table_name = 'regulation_positions'
  ) THEN
    ALTER TABLE regulation_positions 
    ADD CONSTRAINT regulation_positions_regulation_id_fkey 
    FOREIGN KEY (regulation_id) REFERENCES travel_expense_regulations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Create regulation_versions table for version history
CREATE TABLE IF NOT EXISTS regulation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID NOT NULL REFERENCES travel_expense_regulations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes_description TEXT,
  regulation_snapshot JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_user_id 
ON travel_expense_regulations(user_id);

CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_status 
ON travel_expense_regulations(status);

CREATE INDEX IF NOT EXISTS idx_regulation_positions_regulation_id 
ON regulation_positions(regulation_id);

CREATE INDEX IF NOT EXISTS idx_regulation_versions_regulation_id 
ON regulation_versions(regulation_id);

-- Step 6: Enable RLS on all tables
ALTER TABLE travel_expense_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_versions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for travel_expense_regulations
CREATE POLICY "Users can view own regulations" 
ON travel_expense_regulations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own regulations" 
ON travel_expense_regulations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own regulations" 
ON travel_expense_regulations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own regulations" 
ON travel_expense_regulations FOR DELETE 
USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for regulation_positions
CREATE POLICY "Users can view regulation positions" 
ON regulation_positions FOR SELECT 
USING (
  regulation_id IN (
    SELECT id FROM travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert regulation positions" 
ON regulation_positions FOR INSERT 
WITH CHECK (
  regulation_id IN (
    SELECT id FROM travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update regulation positions" 
ON regulation_positions FOR UPDATE 
USING (
  regulation_id IN (
    SELECT id FROM travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete regulation positions" 
ON regulation_positions FOR DELETE 
USING (
  regulation_id IN (
    SELECT id FROM travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

-- Step 9: Create RLS policies for regulation_versions
CREATE POLICY "Users can view regulation versions" 
ON regulation_versions FOR SELECT 
USING (
  regulation_id IN (
    SELECT id FROM travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert regulation versions" 
ON regulation_versions FOR INSERT 
WITH CHECK (
  regulation_id IN (
    SELECT id FROM travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

-- Step 10: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 11: Create triggers for automatic updated_at
CREATE TRIGGER update_travel_expense_regulations_updated_at 
BEFORE UPDATE ON travel_expense_regulations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulation_positions_updated_at 
BEFORE UPDATE ON regulation_positions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Add comments for documentation
COMMENT ON TABLE travel_expense_regulations IS 'Travel expense regulations with company and allowance information';
COMMENT ON TABLE regulation_positions IS 'Position-specific allowance amounts for travel regulations';
COMMENT ON TABLE regulation_versions IS 'Version history for travel expense regulations';

COMMENT ON COLUMN travel_expense_regulations.distance_threshold IS 'Distance threshold in kilometers for business trip definition';
COMMENT ON COLUMN travel_expense_regulations.is_transportation_real_expense IS 'Whether transportation costs are actual expenses';
COMMENT ON COLUMN travel_expense_regulations.is_accommodation_real_expense IS 'Whether accommodation costs are actual expenses';