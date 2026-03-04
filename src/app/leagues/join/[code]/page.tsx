'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getLeagueByInviteCode, joinLeague, getUserRoleInLeague } from '@/lib/leagues';
import type { League } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function JoinLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [alreadyMember, setAlreadyMember] = useState(false);

  const inviteCode = params.code as string;

  useEffect(() => {
    loadLeague();
  }, [inviteCode, user]);

  const loadLeague = async () => {
    setLoading(true);
    setError('');

    try {
      const leagueData = await getLeagueByInviteCode(inviteCode);

      if (!leagueData) {
        setError('Invalid invite code');
        return;
      }

      setLeague(leagueData);

      if (user) {
        const role = await getUserRoleInLeague(leagueData.id, user.id);
        setAlreadyMember(role !== null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load league');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !league) return;

    setJoining(true);
    setError('');

    try {
      await joinLeague(league.id, user.id);
      router.push(`/leagues/${league.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join league');
      setJoining(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Join League</CardTitle>
            <CardDescription>Please log in to join this league</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/login?redirect=/leagues/join/${inviteCode}`)}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p>Loading league information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || 'League not found'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/leagues')}>Back to Leagues</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{league.name}</CardTitle>
            <CardDescription>You are already a member of this league</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/leagues/${league.id}`)}>
              Go to League
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Join {league.name}</CardTitle>
          {league.poe_league_name && (
            <CardDescription>{league.poe_league_name}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {league.description && (
            <p className="text-sm text-muted-foreground">{league.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Start Date:</span> {formatDate(league.start_date)}
            </div>
            <div>
              <span className="font-semibold">End Date:</span> {formatDate(league.end_date)}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Join League'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/leagues')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
