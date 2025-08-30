/*
  # Create regulation management tables

  1. New Tables
    - `travel_expense_regulations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_name` (text, required)
      - `company_address` (text)
      - `representative` (text)
      - `distance_threshold` (integer, default 50)
      - `is_transportation_real_expense` (boolean, default false)
      - `is_accommodation_real_expense` (boolean, default false)
      - `implementation_date` (date)
      - `regulation_text` (text)
      - `revision` (integer, default 1)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `regulation_positions`
      - `id` (uuid, primary key)
      - `regulation_id` (uuid, references travel_expense_regulations)
      - `position_name` (text, required)
      - `domestic_daily_allowance` (integer, default 0)
      - `domestic_accommodation` (integer, default 0)
      - `domestic_transportation` (integer, default 0)
      - `overseas_daily_allowance` (integer, default 0)
      - `overseas_accommodation` (integer, default 0)
      - `overseas_preparation` (integer, default 0)
      - `overseas_transportation` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `regulation_versions`
      - `id` (uuid, primary key)
      - `regulation_id` (uuid, references travel_expense_regulations)
      - `version_number` (integer, required)
      - `changes_description` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own regulations
    - Add policies for regulation positions and versions

  3. Performance
    - Add indexes for foreign key relationships
    - Add indexes for common query patterns
*/

-- Create travel_expense_regulations table (parent table)
CREATE TABLE IF NOT EXISTS public.travel_expense_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_address TEXT,
  representative TEXT,
  distance_threshold INTEGER DEFAULT 50,
  is_transportation_real_expense BOOLEAN DEFAULT false,
  is_accommodation_real_expense BOOLEAN DEFAULT false,
  implementation_date DATE,
  regulation_text TEXT,
  revision INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regulation_positions table (child table)
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

-- Create regulation_versions table (version history)
CREATE TABLE IF NOT EXISTS public.regulation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID NOT NULL REFERENCES public.travel_expense_regulations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_regulation_positions_regulation_id ON public.regulation_positions(regulation_id);
CREATE INDEX IF NOT EXISTS idx_regulation_versions_regulation_id ON public.regulation_versions(regulation_id);
CREATE INDEX IF NOT EXISTS idx_travel_expense_regulations_user_id ON public.travel_expense_regulations(user_id);

-- Enable RLS on all tables
ALTER TABLE public.travel_expense_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for travel_expense_regulations
CREATE POLICY "Users can manage own regulations" 
ON public.travel_expense_regulations 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for regulation_positions
CREATE POLICY "Users can manage regulation positions" 
ON public.regulation_positions 
FOR ALL 
USING (
  regulation_id IN (
    SELECT id FROM public.travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for regulation_versions
CREATE POLICY "Users can manage regulation versions" 
ON public.regulation_versions 
FOR ALL 
USING (
  regulation_id IN (
    SELECT id FROM public.travel_expense_regulations 
    WHERE user_id = auth.uid()
  )
);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_travel_expense_regulations_updated_at 
BEFORE UPDATE ON public.travel_expense_regulations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulation_positions_updated_at 
BEFORE UPDATE ON public.regulation_positions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();