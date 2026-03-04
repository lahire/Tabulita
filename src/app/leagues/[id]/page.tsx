'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getLeague, joinLeague, leaveLeague, getUserRoleInLeague } from '@/lib/leagues';
import type { LeagueWithMembers, UserRole } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueWithMembers | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [joining, setJoining] = useState(false);

  const leagueId = params.id as string;

  useEffect(() => {
    loadLeague();
  }, [leagueId, user]);

  const loadLeague = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [leagueData, role] = await Promise.all([
        getLeague(leagueId),
        getUserRoleInLeague(leagueId, user.id),
      ]);

      if (!leagueData) {
        setError('League not found');
        return;
      }

      setLeague(leagueData);
      setUserRole(role);
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
      await loadLeague();
    } catch (err: any) {
      setError(err.message || 'Failed to join league');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !league || !confirm('Are you sure you want to leave this league?')) return;

    try {
      await leaveLeague(league.id, user.id);
      router.push('/leagues');
    } catch (err: any) {
      setError(err.message || 'Failed to leave league');
    }
  };

  const copyInviteLink = () => {
    if (!league?.invite_code) return;
    const inviteUrl = `${window.location.origin}/leagues/join/${league.invite_code}`;
    navigator.clipboard.writeText(inviteUrl);
    alert('Invite link copied to clipboard!');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
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
          <AlertDescription>Please log in to view this league</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (error && !league) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!league) return null;

  const isMember = userRole !== null;
  const canManage = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            {league.poe_league_name && (
              <p className="text-lg text-muted-foreground">{league.poe_league_name}</p>
            )}
          </div>
          {isMember && userRole && getRoleBadge(userRole)}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>League Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {league.description && <p>{league.description}</p>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Start Date:</span> {formatDate(league.start_date)}
              </div>
              <div>
                <span className="font-semibold">End Date:</span> {formatDate(league.end_date)}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{' '}
                {league.is_active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Members:</span> {league.league_members?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {!isMember && (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleJoin} disabled={joining}>
                {joining ? 'Joining...' : 'Join League'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isMember && canManage && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Code</CardTitle>
              <CardDescription>Share this link to invite others to join</CardDescription>
            </CardHeader>
            <CardContent>
              {!showInviteCode ? (
                <Button onClick={() => setShowInviteCode(true)}>Show Invite Link</Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/leagues/join/${league.invite_code}`}
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button onClick={copyInviteLink}>Copy</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isMember && league.league_members && league.league_members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Members ({league.league_members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {league.league_members.map((member: any) => (
                  <div key={member.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-semibold">{member.profile?.username || 'Unknown'}</p>
                      {member.character_name && (
                        <p className="text-sm text-muted-foreground">
                          {member.character_name} ({member.character_class || 'No class'}) - Level{' '}
                          {member.character_level}
                        </p>
                      )}
                    </div>
                    {getRoleBadge(member.role)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isMember && userRole !== 'admin' && (
          <div>
            <Button variant="destructive" onClick={handleLeave}>
              Leave League
            </Button>
          </div>
        )}

        <Button variant="outline" onClick={() => router.back()}>
          Back to Leagues
        </Button>
      </div>
    </div>
  );
}
