'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getUserLeagues, getActiveLeagues } from '@/lib/leagues';
import type { League } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LeaguesPage() {
  const { user } = useAuth();
  const [myLeagues, setMyLeagues] = useState<any[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

  useEffect(() => {
    loadLeagues();
  }, [user]);

  const loadLeagues = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [myLeaguesData, allLeaguesData] = await Promise.all([
        getUserLeagues(user.id),
        getActiveLeagues(),
      ]);

      setMyLeagues(myLeaguesData);
      setAllLeagues(allLeaguesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-500',
      manager: 'bg-blue-500',
      player: 'bg-green-500',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs text-white ${colors[role as keyof typeof colors] || 'bg-gray-500'}`}>
        {role}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to view leagues</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leagues</h1>
        <Link href="/leagues/new">
          <Button>Create New League</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'my' ? 'default' : 'outline'}
          onClick={() => setActiveTab('my')}
        >
          My Leagues
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
        >
          Browse All
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p>Loading leagues...</p>
      ) : (
        <>
          {activeTab === 'my' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLeagues.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      You haven't joined any leagues yet.{' '}
                      <Link href="/leagues/new" className="text-primary hover:underline">
                        Create one
                      </Link>{' '}
                      or browse available leagues below.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                myLeagues.map((league) => (
                  <Link key={league.id} href={`/leagues/${league.id}`}>
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{league.name}</CardTitle>
                          {getRoleBadge(league.user_role)}
                        </div>
                        {league.poe_league_name && (
                          <CardDescription>{league.poe_league_name}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {league.description && (
                          <p className="text-sm text-muted-foreground mb-2">{league.description}</p>
                        )}
                        {league.start_date && (
                          <p className="text-xs text-muted-foreground">
                            Starts: {formatDate(league.start_date)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allLeagues.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No active leagues found.</p>
                  </CardContent>
                </Card>
              ) : (
                allLeagues.map((league) => (
                  <Link key={league.id} href={`/leagues/${league.id}`}>
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle>{league.name}</CardTitle>
                        {league.poe_league_name && (
                          <CardDescription>{league.poe_league_name}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {league.description && (
                          <p className="text-sm text-muted-foreground mb-2">{league.description}</p>
                        )}
                        {league.start_date && (
                          <p className="text-xs text-muted-foreground">
                            Starts: {formatDate(league.start_date)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
