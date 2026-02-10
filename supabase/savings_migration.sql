-- Add savings_data column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS savings_data JSONB DEFAULT NULL;
