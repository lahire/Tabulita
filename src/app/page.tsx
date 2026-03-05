'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home')
    }
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-8'>
      <main className='flex flex-col items-center text-center max-w-3xl w-full gap-12'>
        <div className='space-y-4'>
          <h1 className='text-6xl font-bold tracking-tight'>Tabulita</h1>
          <p className='text-xl text-muted-foreground'>
            Track wishlists and character progress
            <br />
            for Path of Exile private leagues
          </p>
        </div>

        <div className='flex gap-4 items-center flex-col sm:flex-row'>
          <Button asChild size='lg'>
            <Link href='/signup'>Get Started</Link>
          </Button>
          <Button asChild variant='outline' size='lg'>
            <Link href='/login'>Sign In</Link>
          </Button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 w-full'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Item Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track unique items and rares with specific affixes. Get notified when your friends find what you need.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>League Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create private leagues, invite friends, and track everyone&apos;s progress and character levels.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Discord Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatic notifications to your Discord server when items are found or delivered.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className='mt-16'>
        <p className='text-sm text-muted-foreground'>Built for Path of Exile private leagues</p>
      </footer>
    </div>
  )
}
