import { supabase } from './supabase';
import type { League, LeagueMember, UserRole, LeagueWithMembers, LeagueMemberWithProfile } from '@/types/database';

export interface CreateLeagueData {
  name: string;
  description?: string;
  poe_league_name?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Create a new league
 * Automatically adds the creator as an admin member
 */
export async function createLeague(data: CreateLeagueData, userId: string) {
  const { data: league, error } = await supabase
    .from('leagues')
    .insert({
      name: data.name,
      description: data.description || null,
      poe_league_name: data.poe_league_name || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return league;
}

/**
 * Get all leagues for a user (where they are a member)
 */
export async function getUserLeagues(userId: string): Promise<LeagueWithMembers[]> {
  const { data, error } = await supabase
    .from('league_members')
    .select(`
      role,
      leagues (
        *
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return data.map((item: any) => ({
    ...item.leagues,
    user_role: item.role,
  }));
}

/**
 * Get a single league by ID with members
 */
export async function getLeague(leagueId: string): Promise<LeagueWithMembers | null> {
  const { data, error } = await supabase
    .from('leagues')
    .select(`
      *,
      league_members (
        *,
        profile:profiles (*)
      )
    `)
    .eq('id', leagueId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Get a league by invite code
 */
export async function getLeagueByInviteCode(inviteCode: string): Promise<League | null> {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Join a league
 */
export async function joinLeague(leagueId: string, userId: string) {
  const { data, error } = await supabase
    .from('league_members')
    .insert({
      league_id: leagueId,
      user_id: userId,
      role: 'player',
      character_level: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Leave a league
 */
export async function leaveLeague(leagueId: string, userId: string) {
  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get user's role in a league
 */
export async function getUserRoleInLeague(leagueId: string, userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data.role;
}

/**
 * Get all active leagues (for browsing)
 */
export async function getActiveLeagues(): Promise<League[]> {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
