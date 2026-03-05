'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PoeItemTooltip } from '@/components/PoeItemTooltip'
import { fetchPoeItem, type PoeItemData } from '@/lib/poeWikiApi'
import { markItemFound, cancelWishlistItem, returnItemToNeeded, deleteWishlistItem } from '@/lib/wishlists'
import { useAuth } from '@/contexts/AuthContext'
import type { WishlistItemWithUser } from '@/types/database'
import { Check, Trash2, Undo2 } from 'lucide-react'

const PRIORITY_STYLES = {
  high: 'bg-red-900/40 text-red-300 border border-red-800',
  medium: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800',
  low: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
}

const TYPE_COLORS: Record<string, { color: string; border: string }> = {
  unique: { color: '#af6025', border: '#af6025' },
  rare: { color: '#ffff77', border: '#b8b840' },
  magic: { color: '#8888ff', border: '#5555cc' },
  normal: { color: '#c8c8c8', border: '#888888' },
  base: { color: '#a8a8a8', border: '#666666' },
  gem: { color: '#1ba29b', border: '#1ba29b' },
  other: { color: '#888888', border: '#555555' },
}

function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

interface Props {
  item: WishlistItemWithUser
  onRefresh: () => void
}

export function WishlistItemRow({ item, onRefresh }: Props) {
  const { profile } = useAuth()
  const [poeData, setPoeData] = useState<PoeItemData | null>(null)
  const [fetched, setFetched] = useState(false)

  const [foundOpen, setFoundOpen] = useState(false)
  const [matchNotes, setMatchNotes] = useState('')
  const [submittingFound, setSubmittingFound] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function sendDiscord(action: 'found' | 'cancel' | 'return', notes?: string) {
    await fetch('/api/discord-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        actorDiscord: profile?.username,
        ownerDiscord: item.profile.username,
        itemName: item.item_name,
        matchNotes: notes ?? null,
      }),
    })
  }

  async function handleFoundConfirm() {
    if (!profile) return
    setSubmittingFound(true)
    try {
      await withTimeout(markItemFound(item.id, profile.id, matchNotes.trim() || null))
      sendDiscord('found', matchNotes.trim() || undefined)
      toast.success('Item marked as found!')
      setFoundOpen(false)
      setMatchNotes('')
      onRefresh()
    } catch (e) {
      console.error('[markItemFound]', e)
      toast.error('Failed to mark item as found.')
    } finally {
      setSubmittingFound(false)
    }
  }

  async function handleReturnToNeeded() {
    try {
      await withTimeout(returnItemToNeeded(item.id))
      sendDiscord('return')
      toast.success('Item returned to needed.')
      onRefresh()
    } catch (e) {
      console.error('[returnItemToNeeded]', e)
      toast.error('Failed to update item.')
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    try {
      if (item.status === 'cancelled') {
        await withTimeout(deleteWishlistItem(item.id))
        toast.success('Item permanently deleted.')
      } else {
        await withTimeout(cancelWishlistItem(item.id))
        sendDiscord('cancel')
        toast.success('Item cancelled.')
      }
      setDeleteOpen(false)
      onRefresh()
    } catch (e) {
      console.error('[handleDeleteConfirm]', e)
      toast.error('Failed to update item.')
    } finally {
      setDeleting(false)
    }
  }

  const wikiHref = item.wiki_url ? `https://www.poewiki.net/wiki/${item.wiki_url}` : null

  function handleHoverOpenChange(open: boolean) {
    if (open && !fetched && item.wiki_url) {
      setFetched(true)
      fetchPoeItem(decodeURIComponent(item.wiki_url.replace(/_/g, ' '))).then(setPoeData)
    }
  }

  return (
    <>
      <TableRow>
        <TableCell>
          {wikiHref ? (
            <HoverCard openDelay={200} onOpenChange={handleHoverOpenChange}>
              <HoverCardTrigger asChild>
                <a
                  href={wikiHref}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline decoration-dotted underline-offset-2 text-foreground hover:text-foreground/80'
                >
                  {item.item_name}
                </a>
              </HoverCardTrigger>
              <HoverCardContent side='right' align='start' className='p-0 border-0 bg-transparent shadow-none w-auto'>
                {poeData ? (
                  <PoeItemTooltip item={poeData} />
                ) : (
                  <div
                    className='w-48 px-3 py-2 text-xs text-zinc-400'
                    style={{ backgroundColor: '#0c0c0c', border: '1px solid #54493b' }}
                  >
                    Loading...
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          ) : (
            <span>{item.item_name}</span>
          )}
        </TableCell>
        <TableCell>
          <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_STYLES[item.priority]}`}>
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </span>
        </TableCell>
        <TableCell>
          {(() => {
            const t = TYPE_COLORS[item.item_type] ?? TYPE_COLORS.other
            return (
              <span
                className='text-xs px-1.5 py-0.5 rounded'
                style={{ color: t.color, border: `1px solid ${t.border}`, backgroundColor: `${t.color}18` }}
              >
                {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
              </span>
            )
          })()}
        </TableCell>
        <TableCell className='text-muted-foreground'>{item.item_level ?? '—'}</TableCell>
        <TableCell className='max-w-50'>
          {item.notes ? (
            <div className='overflow-x-auto whitespace-nowrap text-xs text-muted-foreground'>{item.notes}</div>
          ) : (
            <span className='text-xs text-muted-foreground/40'>—</span>
          )}
        </TableCell>
        <TableCell className='text-muted-foreground/70'>{item.profile.username}</TableCell>
        <TableCell>
          <TooltipProvider delayDuration={200}>
            <div className='flex items-center gap-1'>
              {item.status === 'needed' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFoundOpen(true)}
                      className='p-1 rounded hover:bg-green-900/40 text-muted-foreground hover:text-green-400 transition-colors cursor-pointer'
                    >
                      <Check className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Mark as Found</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleReturnToNeeded}
                      className='p-1 rounded hover:bg-blue-900/40 text-muted-foreground hover:text-blue-400 transition-colors cursor-pointer'
                    >
                      <Undo2 className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Return to Needed</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className='p-1 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{item.status === 'cancelled' ? 'Delete Permanently' : 'Cancel'}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </TableCell>
      </TableRow>

      {/* Found Dialog */}
      <Dialog open={foundOpen} onOpenChange={(o) => { if (!o) { setFoundOpen(false); setMatchNotes('') } }}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Mark as Found</DialogTitle>
          </DialogHeader>
          <div className='py-2 space-y-3'>
            <p className='text-sm text-muted-foreground'>
              Marking <span className='text-foreground font-medium'>{item.item_name}</span> as found for{' '}
              <span className='text-foreground font-medium'>{item.profile.username}</span>.
            </p>
            <div className='space-y-1.5'>
              <Label>Message <span className='text-muted-foreground font-normal'>(optional)</span></Label>
              <Input
                placeholder='e.g. queda en el guild stash'
                value={matchNotes}
                onChange={(e) => setMatchNotes(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => { setFoundOpen(false); setMatchNotes('') }} disabled={submittingFound}>
              Cancel
            </Button>
            <Button onClick={handleFoundConfirm} disabled={submittingFound}>
              {submittingFound ? 'Sending...' : 'Confirm Found'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{item.status === 'cancelled' ? 'Delete Permanently' : 'Cancel Item'}</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground py-2'>
            {item.status === 'cancelled'
              ? <>Permanently delete <span className='text-foreground font-medium'>{item.item_name}</span>? This cannot be undone.</>
              : <>Cancel <span className='text-foreground font-medium'>{item.item_name}</span> from <span className='text-foreground font-medium'>{item.profile.username}</span>&apos;s wishlist?</>
            }
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Back
            </Button>
            <Button variant='destructive' onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Working...' : item.status === 'cancelled' ? 'Delete Forever' : 'Cancel Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
