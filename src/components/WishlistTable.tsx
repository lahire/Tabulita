'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WishlistItemRow } from '@/components/WishlistItemRow'
import { AddItemDialog } from '@/components/AddItemDialog'
import { getLeagueWishlist } from '@/lib/wishlists'
import type { WishlistItemWithUser } from '@/types/database'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { WishlistStatus } from '@/types/database'

type SortKey = 'item_name' | 'item_type' | 'item_level' | 'priority' | 'username'
type SortDir = 'asc' | 'desc'
type StatusFilter = WishlistStatus | 'all'

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Needed', value: 'needed' },
  { label: 'Found', value: 'found' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'All', value: 'all' },
]

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function sortItems(items: WishlistItemWithUser[], key: SortKey, dir: SortDir) {
  return [...items].sort((a, b) => {
    let cmp = 0
    if (key === 'priority') {
      cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    } else if (key === 'item_level') {
      cmp = (a.item_level ?? 0) - (b.item_level ?? 0)
    } else if (key === 'username') {
      cmp = a.profile.username.localeCompare(b.profile.username)
    } else {
      const av = String(a[key] ?? '')
      const bv = String(b[key] ?? '')
      cmp = av.localeCompare(bv)
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

interface Props {
  leagueId: string | null
  userId: string
}

export function WishlistTable({ leagueId, userId }: Props) {
  const [items, setItems] = useState<WishlistItemWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('needed')

  function loadItems() {
    if (!leagueId) return
    setLoading(true)
    getLeagueWishlist(leagueId).then((data) => {
      setItems(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadItems()
  }, [leagueId])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className='ml-1.5 h-3 w-3 inline opacity-40' />
    return sortDir === 'asc' ? (
      <ArrowUp className='ml-1.5 h-3 w-3 inline' />
    ) : (
      <ArrowDown className='ml-1.5 h-3 w-3 inline' />
    )
  }

  const filtered = statusFilter === 'all' ? items : items.filter((i) => i.status === statusFilter)
  const sorted = sortItems(filtered, sortKey, sortDir)

  const cols: { label: string; key: SortKey; className?: string }[] = [
    { label: 'Item', key: 'item_name', className: 'w-[30%]' },
    { label: 'Priority', key: 'priority', className: 'w-24' },
    { label: 'Type', key: 'item_type', className: 'w-20' },
    { label: 'iLvl', key: 'item_level', className: 'w-16' },
  ]

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-sm font-medium'>Wishlist</h2>
        <Button size='sm' variant='outline' disabled={!leagueId} onClick={() => setDialogOpen(true)}>
          Add Item
        </Button>
      </div>

      {leagueId && (
        <div className='flex items-center gap-1 mb-3'>
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                statusFilter === value
                  ? 'bg-white/10 border-white/30 text-foreground'
                  : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-foreground' />
          Loading...
        </div>
      ) : !leagueId ? (
        <p className='text-sm text-muted-foreground'>Join a league to start adding items to your wishlist.</p>
      ) : sorted.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {items.length === 0 ? 'No items in wishlist yet.' : `No ${statusFilter === 'all' ? '' : statusFilter + ' '}items.`}
        </p>
      ) : (
        <div className='rounded-md border border-gray-600 bg-black/80'>
          <Table>
            <TableHeader>
              <TableRow className='bg-white/5 hover:bg-white/5'>
                {cols.map(({ label, key, className }) => (
                  <TableHead
                    key={key}
                    className={`cursor-pointer select-none hover:text-foreground ${className ?? ''}`}
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} />
                  </TableHead>
                ))}
                <TableHead className='w-[25%]'>Notes</TableHead>
                <TableHead className='w-28'>Added By</TableHead>
                <TableHead className='w-20'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => (
                <WishlistItemRow key={item.id} item={item} onRefresh={loadItems} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {leagueId && (
        <AddItemDialog
          open={dialogOpen}
          leagueId={leagueId}
          userId={userId}
          onClose={() => setDialogOpen(false)}
          onAdded={loadItems}
        />
      )}
    </div>
  )
}
