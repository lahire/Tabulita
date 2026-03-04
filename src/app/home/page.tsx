'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { getUserLeagues } from '@/lib/leagues'
import type { LeagueWithMembers } from '@/types/database'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [leagues, setLeagues] = useState<LeagueWithMembers[]>([])
  const [selectedLeague, setSelectedLeague] = useState<LeagueWithMembers | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      getUserLeagues(user.id).then((data) => {
        if (data) {
          const active = data.filter((l) => l.is_active)
          const sorted = [...active].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          setLeagues(sorted)
          if (sorted.length > 0) setSelectedLeague(sorted[0])
        }
      })
    }
  }, [user])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4'></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className='min-h-screen p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-8 flex items-center justify-between'>
          <h1 className='text-xl text-muted-foreground'>{user.user_metadata.username} returns!</h1>
          <div className='flex items-center gap-3'>
            <span className='text-sm text-muted-foreground'>Your Leagues</span>
            {leagues.length > 0 ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='w-48 justify-between'>
                    {selectedLeague?.name ?? 'Select a league'} <ChevronDown className='h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  {leagues.map((league) => (
                    <DropdownMenuItem key={league.id} onClick={() => setSelectedLeague(league)}>
                      {league.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant='secondary' size='sm' asChild>
                <Link href='/leagues'>Join a league</Link>
              </Button>
            )}
          </div>
        </header>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>Your Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground text-sm mb-4'>No items on your wishlist yet.</p>
              <Button>Add Item</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
