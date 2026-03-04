-- Update RLS policies for league invite functionality
-- Migration: 20260304000005

-- =====================================================
-- LEAGUES RLS UPDATES
-- =====================================================

-- Drop existing policies that need updates
DROP POLICY IF EXISTS "Active leagues are viewable by everyone" ON leagues;
DROP POLICY IF EXISTS "Authenticated users can create leagues" ON leagues;
DROP POLICY IF EXISTS "League creators can update their leagues" ON leagues;

-- Allow users to view leagues they are members of OR by invite code lookup
CREATE POLICY "Users can view their leagues or lookup by invite code"
  ON leagues
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      -- User is a member of the league
      EXISTS (
        SELECT 1 FROM league_members
        WHERE league_members.league_id = leagues.id
          AND league_members.user_id = auth.uid()
      )
      OR
      -- Or it's an active league (for browsing)
      is_active = TRUE
      OR
      -- Or they created it
      created_by = auth.uid()
    )
  );

-- Users can create new leagues
CREATE POLICY "Users can create leagues"
  ON leagues
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Only admins can update league details
CREATE POLICY "League admins can update league"
  ON leagues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = leagues.id
        AND league_members.user_id = auth.uid()
        AND league_members.role = 'admin'
    )
  );

-- =====================================================
-- LEAGUE_MEMBERS RLS UPDATES
-- =====================================================

-- Drop existing policies that need updates
DROP POLICY IF EXISTS "League members can view members in their leagues" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;
DROP POLICY IF EXISTS "Users can update their own character info, admins can update roles" ON league_members;
DROP POLICY IF EXISTS "Users can leave leagues, admins can remove members" ON league_members;

-- Members can view other members in their leagues
CREATE POLICY "League members can view members in their leagues"
  ON league_members
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

-- Users can join leagues (new members always start as players)
CREATE POLICY "Users can join leagues"
  ON league_members
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id AND
    role = 'player' -- New members always start as players
  );

-- Admins and managers can remove members (but not other admins)
-- Users can remove themselves (leave league)
CREATE POLICY "Admins and managers can remove members"
  ON league_members
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND (
      -- User is removing themselves
      auth.uid() = user_id
      OR
      -- User is admin or manager
      (
        EXISTS (
          SELECT 1 FROM league_members lm
          WHERE lm.league_id = league_members.league_id
            AND lm.user_id = auth.uid()
            AND lm.role IN ('admin', 'manager')
        )
        -- Cannot remove other admins
        AND league_members.role != 'admin'
      )
    )
  );

-- Admins and managers can update member roles and character info
-- Members can update their own character info
CREATE POLICY "Users can update member info based on role"
  ON league_members
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      -- User is updating themselves
      auth.uid() = user_id
      OR
      -- User is admin or manager
      EXISTS (
        SELECT 1 FROM league_members lm
        WHERE lm.league_id = league_members.league_id
          AND lm.user_id = auth.uid()
          AND lm.role IN ('admin', 'manager')
      )
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- If updating self, cannot change role
      (auth.uid() = user_id AND role = (SELECT role FROM league_members WHERE id = league_members.id))
      OR
      -- If admin/manager updating others, cannot promote to admin
      (
        auth.uid() != user_id AND
        role IN ('manager', 'player') AND
        EXISTS (
          SELECT 1 FROM league_members lm
          WHERE lm.league_id = league_members.league_id
            AND lm.user_id = auth.uid()
            AND lm.role IN ('admin', 'manager')
        )
      )
    )
  );

-- Add helpful comments
COMMENT ON POLICY "Users can view their leagues or lookup by invite code" ON leagues IS 'Users can see leagues they belong to, active leagues for browsing, or leagues they created';
COMMENT ON POLICY "Admins and managers can remove members" ON league_members IS 'Admins and managers can remove players (but not other admins). Users can remove themselves (leave league)';
COMMENT ON POLICY "Users can update member info based on role" ON league_members IS 'Members can update their own character info. Admins and managers can update member roles (but cannot promote to admin)';
