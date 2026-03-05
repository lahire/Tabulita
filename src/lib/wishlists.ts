import { supabase } from './supabase'
import type { WishlistItemInsert, WishlistItemWithUser } from '@/types/database'

export async function getLeagueWishlist(leagueId: string): Promise<WishlistItemWithUser[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, profile:profiles(*)')
    .eq('league_id', leagueId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data as WishlistItemWithUser[]
}

export async function addWishlistItem(item: WishlistItemInsert) {
  const { data, error } = await supabase.from('wishlist_items').insert(item).select().single()
  if (error) throw error
  return data
}
