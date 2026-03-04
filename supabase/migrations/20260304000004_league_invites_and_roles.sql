-- Add invite codes to leagues and update member roles
-- Migration: 20260304000004

-- =====================================================
-- ADD INVITE CODE TO LEAGUES
-- =====================================================
-- Add invite_code column for shareable league links
ALTER TABLE leagues
ADD COLUMN invite_code TEXT UNIQUE;

-- Create index for fast lookup by invite code
CREATE INDEX idx_leagues_invite_code ON leagues(invite_code) WHERE invite_code IS NOT NULL;

-- Function to generate a unique 8-character invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar looking chars
  code TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Check if code already exists
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
-- UPDATE MEMBER ROLES
-- =====================================================
-- Change role enum from admin/moderator/member to admin/manager/player

-- First, drop the existing constraint
ALTER TABLE league_members DROP CONSTRAINT valid_role;

-- Update existing roles
UPDATE league_members SET role = 'manager' WHERE role = 'moderator';
UPDATE league_members SET role = 'player' WHERE role = 'member';

-- Add new constraint with updated roles
ALTER TABLE league_members
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'player'));

-- Update comment
COMMENT ON COLUMN league_members.role IS 'User role in the league: admin (creator), manager (can add/remove players), or player (regular member)';
