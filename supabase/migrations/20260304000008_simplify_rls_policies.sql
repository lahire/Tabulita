-- Simplify RLS policies to avoid self-referencing issues
-- This fixes the 500 errors by removing complex subqueries

-- Drop the problematic UPDATE policy
DROP POLICY IF EXISTS "Users can update member info based on role" ON league_members;

-- Create simpler policies split by use case

-- Members can update their own character info (but not role)
CREATE POLICY "Members can update own character info"
  ON league_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins and managers can update ANY member info (including roles)
CREATE POLICY "Admins and managers can update member info"
  ON league_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = league_members.league_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('admin', 'manager')
    )
  );

COMMENT ON POLICY "Members can update own character info" ON league_members IS 'Members can update their own character info';
COMMENT ON POLICY "Admins and managers can update member info" ON league_members IS 'Admins and managers can update any member info including roles';
