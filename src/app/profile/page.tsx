'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteAccount } from '@/lib/auth'

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      router.push('/signup')
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

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
                <dt className='text-muted-foreground'>Discord</dt>
                <dd className='font-medium mt-0.5'>{profile.discord_username ?? '—'}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Email</dt>
                <dd className='font-medium mt-0.5'>{user.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className='mt-8 pt-6 border-t border-red-900/40'>
          <p className='text-sm text-muted-foreground mb-3'>
            Deleting your account is permanent and cannot be undone.
          </p>
          {!confirming ? (
            <Button variant='destructive' size='sm' onClick={() => setConfirming(true)}>
              Delete Account
            </Button>
          ) : (
            <div className='flex items-center gap-3'>
              <span className='text-sm text-red-400'>Are you sure?</span>
              <Button
                variant='destructive'
                size='sm'
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </Button>
              <Button variant='outline' size='sm' onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
