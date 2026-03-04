'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-foreground'></div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className='min-h-screen p-8'>
      <div className='max-w-lg mx-auto'>
        <Button variant='outline' size='sm' onClick={() => router.back()} className='mb-6'>
          ← Back
        </Button>
        <h1 className='text-2xl font-bold mb-6'>Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className='space-y-4 text-sm'>
              <div>
                <dt className='text-muted-foreground'>Username</dt>
                <dd className='font-medium mt-0.5'>{profile.username}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Email</dt>
                <dd className='font-medium mt-0.5'>{user.email}</dd>
              </div>
              {profile.poe_account_name && (
                <div>
                  <dt className='text-muted-foreground'>PoE Account</dt>
                  <dd className='font-medium mt-0.5'>{profile.poe_account_name}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
