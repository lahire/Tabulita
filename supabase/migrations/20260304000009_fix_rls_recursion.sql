-- Fix RLS infinite recursion in league_members SELECT policy
-- The old policy tried to query league_members from within league_members policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "League members can view members in their leagues" ON league_members;

-- Create a simple policy: authenticated users can view any league_members
-- (We rely on application logic to only show relevant leagues)
-- This is safe because league membership is not sensitive data
CREATE POLICY "Authenticated users can view league members"
  ON league_members
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Authenticated users can view league members" ON league_members IS 'Any authenticated user can view league members (needed to avoid RLS recursion)';
