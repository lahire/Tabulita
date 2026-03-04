'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto px-4'>
        <div className='flex h-14 items-center justify-between'>
          <div className='flex items-center gap-6'>
            <Link href='/' className='font-bold text-lg'>
              Tabulita
            </Link>
            {user && (
              <>
                <Link href='/home' className='text-sm hover:underline'>
                  Home
                </Link>
                <Link href='/leagues' className='text-sm hover:underline'>
                  Leagues
                </Link>
              </>
            )}
          </div>

          <div className='flex items-center gap-4'>
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm'>
                    {user?.user_metadata?.username || profile?.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem asChild>
                    <Link href='/profile'>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href='/login'>
                  <Button variant='ghost' size='sm'>
                    Log In
                  </Button>
                </Link>
                <Link href='/signup'>
                  <Button size='sm'>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
