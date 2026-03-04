-- Row Level Security (RLS) Policies
-- Ensures users can only access data they're authorized to see

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
-- Anyone authenticated can view profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- LEAGUES POLICIES
-- =====================================================
-- All authenticated users can view active leagues
CREATE POLICY "Active leagues are viewable by everyone"
  ON leagues FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_active = TRUE OR
      created_by = auth.uid() OR
      id IN (
        SELECT league_id FROM league_members WHERE user_id = auth.uid()
      )
    )
  );

-- Authenticated users can create leagues
CREATE POLICY "Authenticated users can create leagues"
  ON leagues FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- League creators can update their leagues
CREATE POLICY "League creators can update their leagues"
  ON leagues FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- League creators can delete their leagues
CREATE POLICY "League creators can delete their leagues"
  ON leagues FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- LEAGUE_MEMBERS POLICIES
-- =====================================================
-- Members can view other members in their leagues
CREATE POLICY "League members can view members in their leagues"
  ON league_members FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      league_id IN (
        SELECT league_id FROM league_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can join leagues
CREATE POLICY "Users can join leagues"
  ON league_members FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id
  );

-- Users can update their own character information
-- League admins can update member roles
CREATE POLICY "Users can update their own character info, admins can update roles"
  ON league_members FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR
      league_id IN (
        SELECT league_id FROM league_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR
      league_id IN (
        SELECT league_id FROM league_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Users can leave leagues, admins can remove members
CREATE POLICY "Users can leave leagues, admins can remove members"
  ON league_members FOR DELETE
  USING (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR
      league_id IN (
        SELECT league_id FROM league_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- =====================================================
-- WISHLIST_ITEMS POLICIES
-- =====================================================
-- League members can view wishlist items in their leagues
CREATE POLICY "League members can view wishlist items in their leagues"
  ON wishlist_items FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

-- League members can create wishlist items in their leagues
CREATE POLICY "League members can create wishlist items in their leagues"
  ON wishlist_items FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

-- Users can update their own wishlist items
CREATE POLICY "Users can update their own wishlist items"
  ON wishlist_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlist items
CREATE POLICY "Users can delete their own wishlist items"
  ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- ITEM_MATCHES POLICIES
-- =====================================================
-- League members can view item matches in their leagues
CREATE POLICY "League members can view item matches in their leagues"
  ON item_matches FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      INNER JOIN league_members lm ON lm.league_id = wi.league_id
      WHERE lm.user_id = auth.uid()
    )
  );

-- League members can create item matches
CREATE POLICY "League members can create item matches"
  ON item_matches FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = found_by_user_id AND
    wishlist_item_id IN (
      SELECT wi.id FROM wishlist_items wi
      INNER JOIN league_members lm ON lm.league_id = wi.league_id
      WHERE lm.user_id = auth.uid()
    )
  );

-- Wishlist owners and finders can update match status
CREATE POLICY "Wishlist owners and finders can update item matches"
  ON item_matches FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      auth.uid() = found_by_user_id OR
      wishlist_item_id IN (
        SELECT id FROM wishlist_items WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = found_by_user_id OR
      wishlist_item_id IN (
        SELECT id FROM wishlist_items WHERE user_id = auth.uid()
      )
    )
  );

-- Finders can delete their own item matches
CREATE POLICY "Finders can delete their own item matches"
  ON item_matches FOR DELETE
  USING (auth.uid() = found_by_user_id);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================
-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications (handled by functions)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
