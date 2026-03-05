-- Simplify schema: merge item_matches into wishlist_items, drop notifications
-- Delivery coordination happens via Discord, not in-app

-- =====================================================
-- Drop item_matches triggers and functions
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'item_matches') THEN
    DROP TRIGGER IF EXISTS on_item_match_created ON item_matches;
    DROP TRIGGER IF EXISTS on_item_match_status_updated ON item_matches;
  END IF;
END $$;
DROP FUNCTION IF EXISTS notify_item_match();
DROP FUNCTION IF EXISTS update_wishlist_on_match_status();

-- =====================================================
-- Extend wishlist_items with match data
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wishlist_items' AND column_name = 'found_by_user_id') THEN
    ALTER TABLE public.wishlist_items ADD COLUMN found_by_user_id uuid REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wishlist_items' AND column_name = 'match_notes') THEN
    ALTER TABLE public.wishlist_items ADD COLUMN match_notes text;
  END IF;
END $$;

-- Migrate any existing 'delivered' rows to 'found' before tightening constraint
UPDATE public.wishlist_items SET status = 'found' WHERE status = 'delivered';

-- Simplify status: drop 'delivered', keep 'needed' | 'found' | 'cancelled'
ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_status_check;
ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_status_check
  CHECK (status = ANY (ARRAY['needed'::text, 'found'::text, 'cancelled'::text]));

-- =====================================================
-- Drop item_matches and notifications tables
-- (RLS policies are dropped automatically with tables)
-- =====================================================
DROP TABLE IF EXISTS public.item_matches;
DROP TABLE IF EXISTS public.notifications;

-- =====================================================
-- Update helper function: remove delivered_items column
-- =====================================================
DROP FUNCTION IF EXISTS get_league_wishlist_summary(uuid);

CREATE OR REPLACE FUNCTION get_league_wishlist_summary(league_uuid UUID)
RETURNS TABLE (
  total_items BIGINT,
  needed_items BIGINT,
  found_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_items,
    COUNT(*) FILTER (WHERE status = 'needed') AS needed_items,
    COUNT(*) FILTER (WHERE status = 'found') AS found_items
  FROM wishlist_items
  WHERE league_id = league_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_league_wishlist_summary IS 'Returns summary statistics for a league''s wishlist';

-- =====================================================
-- Fix handle_new_user: use username from signup form metadata
-- instead of deriving it from the email address
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  username_value := NEW.raw_user_meta_data->>'username';

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    username_value,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Creates a profile using the username provided during signup';
