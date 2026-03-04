# Database Schema

## Overview
The database uses PostgreSQL via Supabase with Row Level Security (RLS) enabled for all tables.

## Tables

### 1. profiles
Extends Supabase Auth users with additional profile information.

```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  discord_username TEXT,
  poe_account_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes**:
- `idx_profiles_username` on username
- `idx_profiles_poe_account` on poe_account_name

**RLS**: Users can read all profiles but only update their own

---

### 2. leagues
Path of Exile private league information.

```sql
leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  poe_league_name TEXT, -- Official PoE league name for API integration
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes**:
- `idx_leagues_is_active` on is_active
- `idx_leagues_created_by` on created_by

**RLS**: All authenticated users can read active leagues; only league creator can update/delete

---

### 3. league_members
Many-to-many relationship between profiles and leagues.

```sql
league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_name TEXT,
  character_class TEXT,
  character_level INTEGER DEFAULT 1,
  role TEXT DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
)
```

**Indexes**:
- `idx_league_members_league` on league_id
- `idx_league_members_user` on user_id
- `idx_league_members_character_level` on character_level

**RLS**: League members can read all members of their leagues; admins can update member roles

---

### 4. wishlist_items
Items that players are looking for.

```sql
wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'unique', 'rare', 'currency', 'gem', 'other'
  item_base_type TEXT, -- e.g., "Body Armour", "Ring", "Sword"
  required_mods JSONB, -- For rare items: [{"mod": "Life", "tier": 1, "min_value": 100}]
  notes TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'needed', -- 'needed', 'found', 'delivered', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Example required_mods JSON**:
```json
[
  {
    "mod": "+# to maximum Life",
    "tier": 1,
    "min_value": 100
  },
  {
    "mod": "#% increased Fire Resistance",
    "tier": 2,
    "min_value": 30
  }
]
```

**Indexes**:
- `idx_wishlist_items_league` on league_id
- `idx_wishlist_items_user` on user_id
- `idx_wishlist_items_status` on status
- `idx_wishlist_items_item_type` on item_type

**RLS**: League members can read all wishlist items in their leagues; users can update/delete only their own items

---

### 5. item_matches
When someone finds an item that matches a wishlist.

```sql
item_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  found_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'delivered', 'declined'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
)
```

**Indexes**:
- `idx_item_matches_wishlist` on wishlist_item_id
- `idx_item_matches_finder` on found_by_user_id
- `idx_item_matches_status` on status

**RLS**: League members can read all matches in their leagues; finders and wishlist owners can update match status

---

### 6. notifications
User notifications for item matches and league events.

```sql
notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'item_match', 'item_delivered', 'league_invite', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID of related item_match, league, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes**:
- `idx_notifications_user` on user_id
- `idx_notifications_is_read` on is_read
- `idx_notifications_created_at` on created_at

**RLS**: Users can only read and update their own notifications

---

## Relationships

```
profiles (1) ----< (M) league_members (M) >---- (1) leagues
profiles (1) ----< (M) wishlist_items (M) >---- (1) leagues
profiles (1) ----< (M) item_matches
wishlist_items (1) ----< (M) item_matches
profiles (1) ----< (M) notifications
```

## RLS Policy Summary

### profiles
- **SELECT**: Public (all authenticated users can read profiles)
- **INSERT**: Users can create their own profile during signup
- **UPDATE**: Users can only update their own profile
- **DELETE**: Users can delete their own profile

### leagues
- **SELECT**: All authenticated users can read active leagues
- **INSERT**: All authenticated users can create leagues
- **UPDATE**: Only league creator can update
- **DELETE**: Only league creator can delete

### league_members
- **SELECT**: Members can read members of leagues they belong to
- **INSERT**: Users can join leagues (or be invited)
- **UPDATE**: League admins can update member roles; users can update their own character info
- **DELETE**: Users can leave leagues; admins can remove members

### wishlist_items
- **SELECT**: Members can read wishlist items in their leagues
- **INSERT**: Members can create wishlist items in their leagues
- **UPDATE**: Users can only update their own wishlist items
- **DELETE**: Users can only delete their own wishlist items

### item_matches
- **SELECT**: League members can read matches in their leagues
- **INSERT**: League members can create item matches
- **UPDATE**: Wishlist owner and finder can update match status
- **DELETE**: Finder can delete their own matches

### notifications
- **SELECT**: Users can only read their own notifications
- **INSERT**: System can create notifications (function-based)
- **UPDATE**: Users can update (mark as read) their own notifications
- **DELETE**: Users can delete their own notifications

## Database Functions & Triggers

### 1. updated_at trigger
Automatically updates the `updated_at` field on UPDATE operations.

### 2. create_profile_on_signup trigger
Automatically creates a profile when a new user signs up via Supabase Auth.

### 3. notify_item_match function
Creates a notification when a new item_match is created.

### 4. update_wishlist_status function
Automatically updates wishlist_item status when item_match status changes.
