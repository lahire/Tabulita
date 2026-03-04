-- Fix any existing league_members with old role values
-- This migration ensures all existing data uses the new role names

-- Update any remaining old roles (just in case)
UPDATE league_members
SET role = 'manager'
WHERE role = 'moderator';

UPDATE league_members
SET role = 'player'
WHERE role = 'member';

-- Also check for any leagues without invite codes
UPDATE leagues
SET invite_code = (
  SELECT substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1) ||
         substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1) ||
         substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1) ||
         substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1) ||
         substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1) ||
         substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1) ||
         substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1) ||
         substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 33 + 1)::int, 1)
)
WHERE invite_code IS NULL;
