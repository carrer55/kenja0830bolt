/*
  # Update travel expense regulations table

  1. Schema Updates
    - Update `travel_expense_regulations` table to support the new regulation format
    - Add columns for distance threshold and expense type settings
    - Update position allowances structure to match the new format
    - Add regulation text storage

  2. New Tables
    - `regulation_positions` - Store position-specific allowance data
    - `regulation_versions` - Track regulation version history

  3. Security
    - Enable RLS on new tables
    - Add policies for user access control
*/

-- Update the existing travel_expense_regulations table
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'distance_threshold'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN distance_threshold integer DEFAULT 50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'is_transportation_real_expense'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN is_transportation_real_expense boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'is_accommodation_real_expense'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN is_accommodation_real_expense boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'company_address'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN company_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'representative'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN representative text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'implementation_date'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN implementation_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'revision_number'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN revision_number integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'status'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived'));
  END IF;
END $$;

-- Create regulation_positions table for storing position-specific allowances
CREATE TABLE IF NOT EXISTS regulation_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id uuid REFERENCES travel_expense_regulations(id) ON DELETE CASCADE NOT NULL,
  position_name text NOT NULL,
  sort_order integer DEFAULT 0,
  domestic_daily_allowance numeric DEFAULT 0,
  domestic_accommodation numeric DEFAULT 0,
  domestic_transportation numeric DEFAULT 0,
  overseas_daily_allowance numeric DEFAULT 0,
  overseas_accommodation numeric DEFAULT 0,
  overseas_preparation numeric DEFAULT 0,
  overseas_transportation numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create regulation_versions table for version history
CREATE TABLE IF NOT EXISTS regulation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id uuid REFERENCES travel_expense_regulations(id) ON DELETE CASCADE NOT NULL,
  version_number text NOT NULL,
  changes jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  regulation_snapshot jsonb NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE regulation_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for regulation_positions
CREATE POLICY "Users can manage their own regulation positions"
  ON regulation_positions
  FOR ALL
  TO authenticated
  USING (
    regulation_id IN (
      SELECT id FROM travel_expense_regulations 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    regulation_id IN (
      SELECT id FROM travel_expense_regulations 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for regulation_versions
CREATE POLICY "Users can view their own regulation versions"
  ON regulation_versions
  FOR SELECT
  TO authenticated
  USING (
    regulation_id IN (
      SELECT id FROM travel_expense_regulations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own regulation versions"
  ON regulation_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    regulation_id IN (
      SELECT id FROM travel_expense_regulations 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_regulation_positions_regulation_id 
  ON regulation_positions(regulation_id);

CREATE INDEX IF NOT EXISTS idx_regulation_positions_sort_order 
  ON regulation_positions(regulation_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_regulation_versions_regulation_id 
  ON regulation_versions(regulation_id);

CREATE INDEX IF NOT EXISTS idx_regulation_versions_created_at 
  ON regulation_versions(regulation_id, created_at DESC);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_regulation_positions_updated_at
  BEFORE UPDATE ON regulation_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default expense categories if they don't exist
INSERT INTO expense_categories (name, code, description, sort_order) VALUES
  ('交通費', 'TRANSPORTATION', '電車、バス、タクシー、航空券等の交通費', 1),
  ('宿泊費', 'ACCOMMODATION', 'ホテル、旅館等の宿泊費', 2),
  ('出張日当', 'DAILY_ALLOWANCE', '出張時の日当', 3),
  ('支度料', 'PREPARATION', '海外出張時の支度料', 4),
  ('会議費', 'MEETING', '会議、打ち合わせに関する費用', 5),
  ('接待費', 'ENTERTAINMENT', '接待、懇親会等の費用', 6),
  ('通信費', 'COMMUNICATION', '電話、インターネット等の通信費', 7),
  ('消耗品費', 'SUPPLIES', '事務用品、消耗品等の費用', 8),
  ('その他', 'MISCELLANEOUS', 'その他の経費', 9)
ON CONFLICT (code) DO NOTHING;