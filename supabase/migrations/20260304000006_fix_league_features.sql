-- Fix and complete league invite and role features
-- This migration is idempotent and can be run multiple times safely

-- =====================================================
-- ENSURE INVITE CODE COLUMN EXISTS
-- =====================================================
DO $$
BEGIN
  -- Check if column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leagues' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE leagues ADD COLUMN invite_code TEXT UNIQUE;
    CREATE INDEX idx_leagues_invite_code ON leagues(invite_code) WHERE invite_code IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- CREATE INVITE CODE GENERATION FUNCTIONS
-- =====================================================

-- Drop existing trigger and functions (trigger must be dropped first)
DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON leagues;
DROP FUNCTION IF EXISTS auto_generate_invite_code();
DROP FUNCTION IF EXISTS generate_invite_code();

-- Function to generate a unique 8-character invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM leagues WHERE invite_code = code) INTO code_exists;

    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite code when league is created
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();

-- Backfill invite codes for existing leagues
UPDATE leagues
SET invite_code = generate_invite_code()
WHERE invite_code IS NULL;

COMMENT ON COLUMN leagues.invite_code IS 'Unique 8-character code for joining the league via share link';

-- =====================================================
-- UPDATE MEMBER ROLES (admin/manager/player)
-- =====================================================

-- Drop the existing constraint
ALTER TABLE league_members DROP CONSTRAINT IF EXISTS valid_role;

-- Update existing roles to new system
UPDATE league_members SET role = 'manager' WHERE role = 'moderator';
UPDATE league_members SET role = 'player' WHERE role = 'member';

-- Add new constraint with updated roles
ALTER TABLE league_members
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'player'));

COMMENT ON COLUMN league_members.role IS 'User role in the league: admin (creator), manager (can add/remove players), or player (regular member)';

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Drop ALL existing policies for clean slate
DROP POLICY IF EXISTS "Active leagues are viewable by everyone" ON leagues;
DROP POLICY IF EXISTS "Authenticated users can create leagues" ON leagues;
DROP POLICY IF EXISTS "League creators can update their leagues" ON leagues;
DROP POLICY IF EXISTS "League creators can delete their leagues" ON leagues;
DROP POLICY IF EXISTS "Users can view their leagues or lookup by invite code" ON leagues;
DROP POLICY IF EXISTS "Users can create leagues" ON leagues;
DROP POLICY IF EXISTS "League admins can update league" ON leagues;

DROP POLICY IF EXISTS "League members can view members in their leagues" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;
DROP POLICY IF EXISTS "Users can update their own character info, admins can update roles" ON league_members;
DROP POLICY IF EXISTS "Users can leave leagues, admins can remove members" ON league_members;
DROP POLICY IF EXISTS "Admins and managers can remove members" ON league_members;
DROP POLICY IF EXISTS "Users can update member info based on role" ON league_members;

-- =====================================================
-- CREATE NEW POLICIES FOR LEAGUES
-- =====================================================

-- View: Users can see their leagues, active leagues for browsing, or leagues they created
CREATE POLICY "Users can view their leagues or lookup by invite code"
  ON leagues
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM league_members
        WHERE league_members.league_id = leagues.id
          AND league_members.user_id = auth.uid()
      )
      OR is_active = TRUE
      OR created_by = auth.uid()
    )
  );

-- Insert: Users can create new leagues
CREATE POLICY "Users can create leagues"
  ON leagues
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Update: Only admins can update league details
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

-- Delete: Only league creators can delete leagues
CREATE POLICY "League creators can delete their leagues"
  ON leagues
  FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- CREATE NEW POLICIES FOR LEAGUE_MEMBERS
-- =====================================================

-- View: Members can view other members in their leagues
CREATE POLICY "League members can view members in their leagues"
  ON league_members
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

-- Insert: Users can join leagues (always start as players)
CREATE POLICY "Users can join leagues"
  ON league_members
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id AND
    role = 'player'
  );

-- Delete: Users can leave, admins/managers can remove players (not admins)
CREATE POLICY "Admins and managers can remove members"
  ON league_members
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id
      OR
      (
        EXISTS (
          SELECT 1 FROM league_members lm
          WHERE lm.league_id = league_members.league_id
            AND lm.user_id = auth.uid()
            AND lm.role IN ('admin', 'manager')
        )
        AND league_members.role != 'admin'
      )
    )
  );

-- Update: Members update own character, admins/managers update roles
CREATE POLICY "Users can update member info based on role"
  ON league_members
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id
      OR
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
      (auth.uid() = user_id AND role = (SELECT role FROM league_members WHERE id = league_members.id))
      OR
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
