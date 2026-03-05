import { supabase } from './supabase';

// Sign up with email and password
export async function signUp(email: string, password: string, username: string, discord_username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        discord_username,
      },
    },
  });

  if (error) throw error;

  return data;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

// Delete account
export async function deleteAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch('/api/delete-account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? 'Failed to delete account');
  }
  await supabase.auth.signOut();
}
