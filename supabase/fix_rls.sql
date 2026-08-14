-- Run this entire script in Supabase SQL Editor
-- https://supabase.com/dashboard/project/zrwncedkqldlcfhibfxd/sql/new

-- Step 1: Disable RLS on all tables (single-user app, no auth needed)
ALTER TABLE water_intake DISABLE ROW LEVEL SECURITY;
ALTER TABLE urine_output DISABLE ROW LEVEL SECURITY;
ALTER TABLE sugar_monitor DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminder_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscription DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON water_intake;
DROP POLICY IF EXISTS "Enable read access for all users" ON urine_output;
DROP POLICY IF EXISTS "Enable read access for all users" ON sugar_monitor;
DROP POLICY IF EXISTS "Enable read access for all users" ON daily_summary;
DROP POLICY IF EXISTS "Enable read access for all users" ON medication_schedule;
DROP POLICY IF EXISTS "Enable read access for all users" ON medication_reminder_log;
DROP POLICY IF EXISTS "Enable read access for all users" ON push_subscription;

-- Step 3: Grant full access to anon role (so the publishable key can read/write)
GRANT ALL ON water_intake TO anon;
GRANT ALL ON urine_output TO anon;
GRANT ALL ON sugar_monitor TO anon;
GRANT ALL ON daily_summary TO anon;
GRANT ALL ON medication_schedule TO anon;
GRANT ALL ON medication_reminder_log TO anon;
GRANT ALL ON push_subscription TO anon;

-- Step 4: Grant sequence usage for UUID generation
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Confirm it worked
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
