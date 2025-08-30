/*
  # Create users table and fix table references

  1. New Tables
    - `users` table to store basic user information
    - Links to Supabase auth.users for authentication

  2. Schema Updates
    - Update foreign key references from profiles to users where needed
    - Ensure all user-related tables reference the correct user table

  3. Security
    - Enable RLS on users table
    - Add policies for user data access
    - Update existing policies to work with new structure

  4. Data Migration
    - Safely migrate existing data if needed
    - Maintain referential integrity
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
  department TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
  
  -- Create new policies
  CREATE POLICY "Users can view own profile" 
    ON public.users FOR SELECT 
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id);

  CREATE POLICY "Users can insert own profile" 
    ON public.users FOR INSERT 
    WITH CHECK (auth.uid() = id);
END $$;

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON public.users 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Migrate data from profiles to users if users table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    INSERT INTO public.users (id, email, name, role, department, position, created_at, updated_at)
    SELECT 
      id, 
      email, 
      full_name as name, 
      role, 
      department, 
      position, 
      created_at, 
      updated_at
    FROM public.profiles
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Update travel_expense_regulations table to reference users instead of profiles
DO $$
BEGIN
  -- Check if the foreign key constraint exists and update it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'travel_expense_regulations_user_id_fkey'
    AND table_name = 'travel_expense_regulations'
  ) THEN
    ALTER TABLE public.travel_expense_regulations 
    DROP CONSTRAINT travel_expense_regulations_user_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint
  ALTER TABLE public.travel_expense_regulations 
  ADD CONSTRAINT travel_expense_regulations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
END $$;

-- Update regulation_positions table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'regulation_positions'
  ) THEN
    -- Update foreign key for regulation_positions if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'regulation_positions_created_by_fkey'
      AND table_name = 'regulation_positions'
    ) THEN
      ALTER TABLE public.regulation_positions 
      DROP CONSTRAINT regulation_positions_created_by_fkey;
      
      ALTER TABLE public.regulation_positions 
      ADD CONSTRAINT regulation_positions_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Update regulation_versions table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'regulation_versions'
  ) THEN
    -- Update foreign key for regulation_versions if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'regulation_versions_created_by_fkey'
      AND table_name = 'regulation_versions'
    ) THEN
      ALTER TABLE public.regulation_versions 
      DROP CONSTRAINT regulation_versions_created_by_fkey;
      
      ALTER TABLE public.regulation_versions 
      ADD CONSTRAINT regulation_versions_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Update approver_settings table to reference users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'approver_settings'
  ) THEN
    -- Update user_id foreign key
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'approver_settings_user_id_fkey'
      AND table_name = 'approver_settings'
    ) THEN
      ALTER TABLE public.approver_settings 
      DROP CONSTRAINT approver_settings_user_id_fkey;
      
      ALTER TABLE public.approver_settings 
      ADD CONSTRAINT approver_settings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Update approver_id foreign key
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'approver_settings_approver_id_fkey'
      AND table_name = 'approver_settings'
    ) THEN
      ALTER TABLE public.approver_settings 
      DROP CONSTRAINT approver_settings_approver_id_fkey;
      
      ALTER TABLE public.approver_settings 
      ADD CONSTRAINT approver_settings_approver_id_fkey 
      FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Update approval_history table to reference users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'approval_history'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'approval_history_approver_id_fkey'
      AND table_name = 'approval_history'
    ) THEN
      ALTER TABLE public.approval_history 
      DROP CONSTRAINT approval_history_approver_id_fkey;
      
      ALTER TABLE public.approval_history 
      ADD CONSTRAINT approval_history_approver_id_fkey 
      FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Update allowance_settings table to reference users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'allowance_settings'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'allowance_settings_user_id_fkey'
      AND table_name = 'allowance_settings'
    ) THEN
      ALTER TABLE public.allowance_settings 
      DROP CONSTRAINT allowance_settings_user_id_fkey;
      
      ALTER TABLE public.allowance_settings 
      ADD CONSTRAINT allowance_settings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'Basic user information table linked to Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'References auth.users.id';
COMMENT ON COLUMN public.users.email IS 'User email address';
COMMENT ON COLUMN public.users.name IS 'User full name';
COMMENT ON COLUMN public.users.role IS 'User role: user, admin, or manager';
COMMENT ON COLUMN public.users.department IS 'User department';
COMMENT ON COLUMN public.users.position IS 'User position/title';