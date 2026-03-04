-- Database Functions and Triggers
-- Automated workflows and data maintenance

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates the updated_at timestamp';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_league_members_updated_at
  BEFORE UPDATE ON league_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_items_updated_at
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Generate username from email (part before @)
  username_value := split_part(NEW.email, '@', 1);

  -- Ensure uniqueness by appending random numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_value) LOOP
    username_value := split_part(NEW.email, '@', 1) || floor(random() * 10000)::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    username_value,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Creates a profile automatically when a new user signs up';

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: Notify on item match
-- =====================================================
CREATE OR REPLACE FUNCTION notify_item_match()
RETURNS TRIGGER AS $$
DECLARE
  wishlist_owner_id UUID;
  finder_username TEXT;
  item_name_value TEXT;
BEGIN
  -- Get wishlist owner and item details
  SELECT user_id, item_name
  INTO wishlist_owner_id, item_name_value
  FROM wishlist_items
  WHERE id = NEW.wishlist_item_id;

  -- Get finder username
  SELECT username
  INTO finder_username
  FROM profiles
  WHERE id = NEW.found_by_user_id;

  -- Create notification for wishlist owner
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (
    wishlist_owner_id,
    'item_match',
    'Item Found!',
    finder_username || ' found an item matching your wishlist: ' || item_name_value,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_item_match IS 'Creates a notification when someone finds a wishlist item';

-- Trigger to notify on new item match
CREATE TRIGGER on_item_match_created
  AFTER INSERT ON item_matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_item_match();

-- =====================================================
-- FUNCTION: Update wishlist status on match
-- =====================================================
CREATE OR REPLACE FUNCTION update_wishlist_on_match_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When match is delivered, mark wishlist item as delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE wishlist_items
    SET status = 'delivered'
    WHERE id = NEW.wishlist_item_id;

    -- Create delivery notification
    INSERT INTO notifications (user_id, type, title, message, related_id)
    SELECT
      wi.user_id,
      'item_delivered',
      'Item Delivered!',
      p.username || ' delivered your item: ' || wi.item_name,
      NEW.id
    FROM wishlist_items wi
    JOIN profiles p ON p.id = NEW.found_by_user_id
    WHERE wi.id = NEW.wishlist_item_id;

  -- When match is accepted, mark wishlist item as found
  ELSIF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE wishlist_items
    SET status = 'found'
    WHERE id = NEW.wishlist_item_id;

  -- When match is declined, reset wishlist item to needed if no other pending/accepted matches
  ELSIF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    -- Only reset if there are no other pending or accepted matches
    IF NOT EXISTS (
      SELECT 1 FROM item_matches
      WHERE wishlist_item_id = NEW.wishlist_item_id
        AND id != NEW.id
        AND status IN ('pending', 'accepted')
    ) THEN
      UPDATE wishlist_items
      SET status = 'needed'
      WHERE id = NEW.wishlist_item_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_wishlist_on_match_status IS 'Updates wishlist item status based on match status changes';

-- Trigger to update wishlist status when match status changes
CREATE TRIGGER on_item_match_status_updated
  AFTER UPDATE OF status ON item_matches
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_wishlist_on_match_status();

-- =====================================================
-- FUNCTION: Auto-assign league creator as admin
-- =====================================================
CREATE OR REPLACE FUNCTION auto_add_league_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add league creator as admin member
  INSERT INTO league_members (league_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_add_league_creator IS 'Automatically adds league creator as an admin member';

-- Trigger to add creator as admin when league is created
CREATE TRIGGER on_league_created
  AFTER INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_league_creator();

-- =====================================================
-- HELPER FUNCTION: Get user's leagues
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_leagues(user_uuid UUID)
RETURNS TABLE (
  league_id UUID,
  league_name TEXT,
  is_active BOOLEAN,
  role TEXT,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id AS league_id,
    l.name AS league_name,
    l.is_active,
    lm.role,
    COUNT(lm2.id) AS member_count
  FROM leagues l
  INNER JOIN league_members lm ON lm.league_id = l.id
  LEFT JOIN league_members lm2 ON lm2.league_id = l.id
  WHERE lm.user_id = user_uuid
  GROUP BY l.id, l.name, l.is_active, lm.role
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_leagues IS 'Returns all leagues a user is a member of with additional info';

-- =====================================================
-- HELPER FUNCTION: Get league wishlist summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_league_wishlist_summary(league_uuid UUID)
RETURNS TABLE (
  total_items BIGINT,
  needed_items BIGINT,
  found_items BIGINT,
  delivered_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_items,
    COUNT(*) FILTER (WHERE status = 'needed') AS needed_items,
    COUNT(*) FILTER (WHERE status = 'found') AS found_items,
    COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_items
  FROM wishlist_items
  WHERE league_id = league_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_league_wishlist_summary IS 'Returns summary statistics for a league''s wishlist';
