import { supabase } from './supabase'
import type { WishlistItemInsert, WishlistItemWithUser } from '@/types/database'

export async function getLeagueWishlist(leagueId: string): Promise<WishlistItemWithUser[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, profile:profiles!wishlist_items_user_id_fkey(*)')
    .eq('league_id', leagueId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data as WishlistItemWithUser[]
}

export async function addWishlistItem(item: WishlistItemInsert) {
  const { data, error } = await supabase.from('wishlist_items').insert(item).select().single()
  if (error) throw error
  return data
}

export async function markItemFound(itemId: string, foundByUserId: string, matchNotes: string | null) {
  const { error } = await supabase
    .from('wishlist_items')
    .update({ status: 'found', found_by_user_id: foundByUserId, match_notes: matchNotes })
    .eq('id', itemId)
  if (error) throw error
}

export async function cancelWishlistItem(itemId: string) {
  const { error } = await supabase.from('wishlist_items').update({ status: 'cancelled' }).eq('id', itemId)
  if (error) throw error
}

export async function returnItemToNeeded(itemId: string) {
  const { error } = await supabase
    .from('wishlist_items')
    .update({ status: 'needed', found_by_user_id: null, match_notes: null })
    .eq('id', itemId)
  if (error) throw error
}

export async function deleteWishlistItem(itemId: string) {
  const { error } = await supabase.from('wishlist_items').delete().eq('id', itemId)
  if (error) throw error
}
