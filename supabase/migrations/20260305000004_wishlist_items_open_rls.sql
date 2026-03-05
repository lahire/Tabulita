-- Allow any league member to update or delete any wishlist item in their league

DROP POLICY IF EXISTS "Users can update their own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON wishlist_items;

CREATE POLICY "League members can update wishlist items in their leagues"
  ON wishlist_items FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "League members can delete wishlist items in their leagues"
  ON wishlist_items FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );
