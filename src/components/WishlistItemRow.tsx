'use client'

import { useState } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TableCell, TableRow } from '@/components/ui/table'
import { PoeItemTooltip } from '@/components/PoeItemTooltip'
import { fetchPoeItem, type PoeItemData } from '@/lib/poeWikiApi'
import { useAuth } from '@/contexts/AuthContext'
import type { WishlistItemWithUser } from '@/types/database'
import { Check, Trash2 } from 'lucide-react'

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
}

interface Props {
  item: WishlistItemWithUser
}

export function WishlistItemRow({ item }: Props) {
  const { profile, user } = useAuth()
  const [poeData, setPoeData] = useState<PoeItemData | null>(null)
  const [fetched, setFetched] = useState(false)

  async function notifyDiscord(action: 'found' | 'delete') {
    const actorUsername = user?.user_metadata?.username ?? profile?.username
    if (!actorUsername) {
      console.warn('[discord] no username available, skipping notify')
      return
    }
    const res = await fetch('/api/discord-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        actorUsername,
        itemName: item.item_name,
        ownerUsername: item.profile.username,
      }),
    })
    console.log('[discord] response:', res.status, await res.json())
  }

  function wikiPageName(): string | null {
    if (!item.wiki_url) return null
    try {
      const segments = new URL(item.wiki_url).pathname.split('/')
      const idx = segments.indexOf('wiki')
      if (idx === -1 || !segments[idx + 1]) return null
      return decodeURIComponent(segments[idx + 1].replace(/_/g, ' '))
    } catch {
      return null
    }
  }

  function handleOpenChange(open: boolean) {
    if (open && !fetched) {
      setFetched(true)
      const name = wikiPageName()
      if (name) fetchPoeItem(name).then(setPoeData)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <HoverCard openDelay={200} onOpenChange={handleOpenChange}>
          <HoverCardTrigger asChild>
            <a
              href={item.wiki_url ?? '#'}
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
      </TableCell>
      <TableCell>
        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_STYLES[item.priority]}`}>
          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
        </span>
      </TableCell>
      <TableCell>
        {(() => {
          const t = TYPE_COLORS[item.item_type] ?? TYPE_COLORS.base
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => notifyDiscord('found')}
                  className='p-1 rounded hover:bg-green-900/40 text-muted-foreground hover:text-green-400 transition-colors'
                >
                  <Check className='h-3.5 w-3.5' />
                </button>
              </TooltipTrigger>
              <TooltipContent>Found</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => notifyDiscord('delete')}
                  className='p-1 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete Item</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  )
}
