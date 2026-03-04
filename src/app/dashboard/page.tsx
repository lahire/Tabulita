'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-foreground/60 mt-2">Welcome back, {profile.username}!</p>
          </div>
          <Button variant="secondary" onClick={handleSignOut}>
            Sign Out
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 rounded-lg border border-foreground/20">
            <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-foreground/60">Username:</dt>
                <dd className="font-medium">{profile.username}</dd>
              </div>
              <div>
                <dt className="text-foreground/60">Email:</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              {profile.poe_account_name && (
                <div>
                  <dt className="text-foreground/60">PoE Account:</dt>
                  <dd className="font-medium">{profile.poe_account_name}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="p-6 rounded-lg border border-foreground/20">
            <h2 className="text-xl font-semibold mb-2">Your Leagues</h2>
            <p className="text-foreground/60 text-sm">
              You're not a member of any leagues yet.
            </p>
            <Button variant="primary" className="mt-4">
              Create League
            </Button>
          </div>

          <div className="p-6 rounded-lg border border-foreground/20">
            <h2 className="text-xl font-semibold mb-2">Your Wishlist</h2>
            <p className="text-foreground/60 text-sm">
              No items on your wishlist yet.
            </p>
            <Button variant="primary" className="mt-4">
              Add Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
