'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
        <header className="mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-foreground/60 mt-2">Welcome back, {profile.username}!</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Username:</dt>
                  <dd className="font-medium">{profile.username}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email:</dt>
                  <dd className="font-medium">{user.email}</dd>
                </div>
                {profile.poe_account_name && (
                  <div>
                    <dt className="text-muted-foreground">PoE Account:</dt>
                    <dd className="font-medium">{profile.poe_account_name}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Leagues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Manage your private leagues and coordinate with your group
              </p>
              <div className="flex gap-2">
                <Link href="/leagues">
                  <Button>View Leagues</Button>
                </Link>
                <Link href="/leagues/new">
                  <Button variant="outline">Create League</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                No items on your wishlist yet.
              </p>
              <Button>Add Item</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
