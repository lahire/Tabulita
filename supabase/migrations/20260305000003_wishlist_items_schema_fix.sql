-- Add wiki_url and item_level; drop item_base_type and required_mods from wishlist_items

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'wiki_url'
  ) THEN
    ALTER TABLE public.wishlist_items ADD COLUMN wiki_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'item_level'
  ) THEN
    ALTER TABLE public.wishlist_items ADD COLUMN item_level integer;
  END IF;
END $$;

ALTER TABLE public.wishlist_items
  DROP COLUMN IF EXISTS item_base_type,
  DROP COLUMN IF EXISTS required_mods;

-- Expand item_type constraint to include all valid values
ALTER TABLE public.wishlist_items DROP CONSTRAINT IF EXISTS valid_item_type;
ALTER TABLE public.wishlist_items
  ADD CONSTRAINT valid_item_type
  CHECK (item_type IN ('unique', 'rare', 'normal', 'magic', 'base', 'gem', 'other'));
