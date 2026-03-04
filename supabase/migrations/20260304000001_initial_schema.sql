-- Initial database schema for Tabulita
-- Creates all core tables for the PoE private league tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends auth.users with additional profile information
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  discord_username TEXT,
  poe_account_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_poe_account ON profiles(poe_account_name) WHERE poe_account_name IS NOT NULL;

COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth';
COMMENT ON COLUMN profiles.username IS 'Unique display name for the user';
COMMENT ON COLUMN profiles.poe_account_name IS 'Path of Exile account name for API integration';

-- =====================================================
-- LEAGUES TABLE
-- =====================================================
-- Path of Exile private league information
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  poe_league_name TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

CREATE INDEX idx_leagues_is_active ON leagues(is_active);
CREATE INDEX idx_leagues_created_by ON leagues(created_by);
CREATE INDEX idx_leagues_dates ON leagues(start_date, end_date);

COMMENT ON TABLE leagues IS 'Path of Exile private leagues';
COMMENT ON COLUMN leagues.poe_league_name IS 'Official PoE league name for API integration';

-- =====================================================
-- LEAGUE_MEMBERS TABLE
-- =====================================================
-- Many-to-many relationship between profiles and leagues
CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_name TEXT,
  character_class TEXT,
  character_level INTEGER DEFAULT 1,
  role TEXT DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(league_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'moderator', 'member')),
  CONSTRAINT valid_level CHECK (character_level >= 1 AND character_level <= 100)
);

CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);
CREATE INDEX idx_league_members_character_level ON league_members(character_level);

COMMENT ON TABLE league_members IS 'Users membership in leagues with character information';
COMMENT ON COLUMN league_members.role IS 'User role in the league: admin, moderator, or member';

-- =====================================================
-- WISHLIST_ITEMS TABLE
-- =====================================================
-- Items that players are looking for
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_base_type TEXT,
  required_mods JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  priority TEXT DEFAULT 'medium' NOT NULL,
  status TEXT DEFAULT 'needed' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_item_type CHECK (item_type IN ('unique', 'rare', 'currency', 'gem', 'other')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT valid_status CHECK (status IN ('needed', 'found', 'delivered', 'cancelled'))
);

CREATE INDEX idx_wishlist_items_league ON wishlist_items(league_id);
CREATE INDEX idx_wishlist_items_user ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_items_status ON wishlist_items(status);
CREATE INDEX idx_wishlist_items_item_type ON wishlist_items(item_type);
CREATE INDEX idx_wishlist_items_priority ON wishlist_items(priority);

COMMENT ON TABLE wishlist_items IS 'Items that players are searching for';
COMMENT ON COLUMN wishlist_items.required_mods IS 'JSON array of required mods for rare items';
COMMENT ON COLUMN wishlist_items.item_type IS 'Type of item: unique, rare, currency, gem, or other';

-- =====================================================
-- ITEM_MATCHES TABLE
-- =====================================================
-- When someone finds an item that matches a wishlist
CREATE TABLE item_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  found_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notes TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMPTZ,
  CONSTRAINT valid_match_status CHECK (status IN ('pending', 'accepted', 'delivered', 'declined'))
);

CREATE INDEX idx_item_matches_wishlist ON item_matches(wishlist_item_id);
CREATE INDEX idx_item_matches_finder ON item_matches(found_by_user_id);
CREATE INDEX idx_item_matches_status ON item_matches(status);
CREATE INDEX idx_item_matches_created_at ON item_matches(created_at DESC);

COMMENT ON TABLE item_matches IS 'When users find items that match wishlist items';
COMMENT ON COLUMN item_matches.delivered_at IS 'Timestamp when the item was delivered';

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
-- User notifications for item matches and league events
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_notification_type CHECK (type IN ('item_match', 'item_delivered', 'league_invite', 'system'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

COMMENT ON TABLE notifications IS 'User notifications for item matches and league events';
COMMENT ON COLUMN notifications.related_id IS 'UUID of related entity (item_match, league, etc.)';
