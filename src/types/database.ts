/**
 * Database types generated from Supabase schema
 * These types match the database schema defined in supabase/migrations
 */

// =====================================================
// ENUMS
// =====================================================
export type UserRole = 'admin' | 'manager' | 'player';

export type ItemType = 'unique' | 'rare' | 'normal' | 'magic' | 'base' | 'gem' | 'other';

export type Priority = 'low' | 'medium' | 'high';

export type WishlistStatus = 'needed' | 'found' | 'cancelled';

// =====================================================
// TABLE TYPES
// =====================================================
export interface Profile {
  id: string;
  username: string;
  discord_username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  name: string;
  description: string | null;
  poe_league_name: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  invite_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  character_name: string | null;
  character_class: string | null;
  character_level: number;
  role: UserRole;
  joined_at: string;
  last_updated: string;
}

export interface WishlistItem {
  id: string;
  league_id: string;
  user_id: string;
  item_name: string;
  item_type: ItemType;
  wiki_url: string | null;
  item_level: number | null;
  notes: string | null;
  priority: Priority;
  status: WishlistStatus;
  found_by_user_id: string | null;
  match_notes: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// INSERT TYPES (for creating new records)
// =====================================================
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;

export type LeagueInsert = Omit<League, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type LeagueMemberInsert = Omit<LeagueMember, 'id' | 'joined_at' | 'last_updated'> & {
  id?: string;
};

export type WishlistItemInsert = Omit<WishlistItem, 'id' | 'created_at' | 'updated_at' | 'found_by_user_id' | 'match_notes'> & {
  id?: string;
  found_by_user_id?: string | null;
  match_notes?: string | null;
};


// =====================================================
// UPDATE TYPES (for updating existing records)
// =====================================================
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type LeagueUpdate = Partial<Omit<League, 'id' | 'created_at' | 'updated_at'>>;

export type LeagueMemberUpdate = Partial<Omit<LeagueMember, 'id' | 'league_id' | 'user_id' | 'joined_at' | 'last_updated'>>;

export type WishlistItemUpdate = Partial<Omit<WishlistItem, 'id' | 'league_id' | 'user_id' | 'created_at' | 'updated_at'>>;

// =====================================================
// VIEW TYPES (with joined data)
// =====================================================
export interface WishlistItemWithUser extends WishlistItem {
  profile: Profile;
}

export interface LeagueWithMembers extends League {
  league_members: LeagueMember[];
  creator?: Profile;
}

export interface LeagueMemberWithProfile extends LeagueMember {
  profile: Profile;
}

// =====================================================
// FUNCTION RETURN TYPES
// =====================================================
export interface UserLeague {
  league_id: string;
  league_name: string;
  is_active: boolean;
  role: UserRole;
  member_count: number;
}

export interface LeagueWishlistSummary {
  total_items: number;
  needed_items: number;
  found_items: number;
}

// =====================================================
// DATABASE TYPE (for Supabase client)
// =====================================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      leagues: {
        Row: League;
        Insert: LeagueInsert;
        Update: LeagueUpdate;
      };
      league_members: {
        Row: LeagueMember;
        Insert: LeagueMemberInsert;
        Update: LeagueMemberUpdate;
      };
      wishlist_items: {
        Row: WishlistItem;
        Insert: WishlistItemInsert;
        Update: WishlistItemUpdate;
      };
    };
    Functions: {
      get_user_leagues: {
        Args: { user_uuid: string };
        Returns: UserLeague[];
      };
      get_league_wishlist_summary: {
        Args: { league_uuid: string };
        Returns: LeagueWishlistSummary[];
      };
    };
  };
}
