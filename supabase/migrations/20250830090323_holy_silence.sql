/*
  # Fix travel expense regulations database schema

  1. Schema Updates
    - Update `travel_expense_regulations` table with missing columns
    - Add distance threshold, expense type settings, and regulation text storage
    - Update position allowances structure

  2. New Tables
    - `regulation_positions` table for position-specific allowance data
    - `regulation_versions` table for version history tracking

  3. Security
    - Enable RLS on all new tables
    - Add policies for user access control
    - Ensure data protection and proper access rights

  4. Indexes
    - Add performance indexes for common queries
    - Optimize for regulation lookup and version tracking
*/

-- First, safely update the existing travel_expense_regulations table
DO $$
BEGIN
  -- Add missing columns to travel_expense_regulations if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'distance_threshold'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN distance_threshold integer DEFAULT 50;
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_expense_regulations' AND column_name = 'regulation_full_text'
  ) THEN
    ALTER TABLE travel_expense_regulations ADD COLUMN regulation_full_text text;
  END IF;
END $$;

-- Create regulation_positions table if it doesn't exist
CREATE TABLE IF NOT EXISTS regulation_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id uuid REFERENCES travel_expense_regulations(id) ON DELETE CASCADE NOT NULL,
  position_name text NOT NULL,
  sort_order integer DEFAULT 0,
  domestic_daily_allowance numeric(10,2) DEFAULT 0,
  domestic_accommodation numeric(10,2) DEFAULT 0,
  domestic_transportation numeric(10,2) DEFAULT 0,
  overseas_daily_allowance numeric(10,2) DEFAULT 0,
  overseas_accommodation numeric(10,2) DEFAULT 0,
  overseas_preparation numeric(10,2) DEFAULT 0,
  overseas_transportation numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create regulation_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS regulation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id uuid REFERENCES travel_expense_regulations(id) ON DELETE CASCADE NOT NULL,
  version_number text NOT NULL,
  changes text[] DEFAULT '{}',
  created_by uuid REFERENCES users(id) NOT NULL,
  regulation_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE regulation_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for regulation_positions
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

-- Create RLS policies for regulation_versions
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
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_regulation_positions_regulation_id 
  ON regulation_positions(regulation_id);

CREATE INDEX IF NOT EXISTS idx_regulation_positions_sort_order 
  ON regulation_positions(regulation_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_regulation_versions_regulation_id 
  ON regulation_versions(regulation_id);

CREATE INDEX IF NOT EXISTS idx_regulation_versions_created_at 
  ON regulation_versions(regulation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_status 
  ON travel_expense_regulations(status);

CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_user_status 
  ON travel_expense_regulations(user_id, status);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_regulation_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for regulation_positions
DROP TRIGGER IF EXISTS update_regulation_positions_updated_at ON regulation_positions;
CREATE TRIGGER update_regulation_positions_updated_at
    BEFORE UPDATE ON regulation_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_regulation_positions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE regulation_positions IS '役職別出張手当設定テーブル';
COMMENT ON TABLE regulation_versions IS '出張規程バージョン履歴テーブル';
COMMENT ON COLUMN travel_expense_regulations.distance_threshold IS '出張の距離閾値（km）';
COMMENT ON COLUMN travel_expense_regulations.company_name IS '会社名';
COMMENT ON COLUMN travel_expense_regulations.company_address IS '会社住所';
COMMENT ON COLUMN travel_expense_regulations.representative IS '代表者名';
COMMENT ON COLUMN travel_expense_regulations.implementation_date IS '規程実施日';
COMMENT ON COLUMN travel_expense_regulations.revision_number IS '改訂番号';
COMMENT ON COLUMN travel_expense_regulations.status IS '規程ステータス（draft/active/archived）';
COMMENT ON COLUMN travel_expense_regulations.regulation_full_text IS '規程全文テキスト';

-- Verify the migration was successful
SELECT 'Travel expense regulations schema migration completed successfully!' as message;