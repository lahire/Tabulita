'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WishlistItemRow } from '@/components/WishlistItemRow'
import { AddItemDialog } from '@/components/AddItemDialog'
import { getLeagueWishlist } from '@/lib/wishlists'
import type { WishlistItemWithUser } from '@/types/database'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

function p(username: string) {
  return {
    id: username,
    username,
    discord_username: null,
    poe_account_name: null,
    avatar_url: null,
    created_at: '',
    updated_at: '',
  }
}

const W = 'https://www.poewiki.net/wiki/'

function item(
  id: string,
  item_name: string,
  item_type: WishlistItemWithUser['item_type'],
  wiki_url: string | null,
  item_level: number | null,
  priority: WishlistItemWithUser['priority'],
  notes: string | null,
  username: string
): WishlistItemWithUser {
  return {
    id,
    league_id: 'mock',
    user_id: username,
    item_name,
    item_type,
    wiki_url,
    item_level,
    required_mods: [],
    notes,
    priority,
    status: 'needed',
    created_at: '',
    updated_at: '',
    profile: p(username),
  }
}

const MOCK_ITEMS: WishlistItemWithUser[] = [
  item(
    '1',
    'Mjölner',
    'unique',
    W + 'Mj%C3%B6lner',
    60,
    'high',
    'Need for CWC Lightning build, at least 3 red sockets',
    'pablo'
  ),
  item('2', 'Headhunter', 'unique', W + 'Headhunter', null, 'high', 'Any roll works', 'carlos'),
  item('3', 'Mageblood', 'unique', W + 'Mageblood', null, 'high', null, 'pablo'),
  item(
    '4',
    "Watcher's Eye",
    'unique',
    W + 'Watcher%27s_Eye',
    null,
    'high',
    'Need Vitality life regen or Hatred crit mod',
    'mati'
  ),
  item('5', 'Melding of the Flesh', 'unique', W + 'Melding_of_the_Flesh', null, 'high', null, 'juli'),
  item(
    '6',
    'Brass Dome',
    'unique',
    W + 'The_Brass_Dome',
    null,
    'medium',
    'Max roll preferred but not required',
    'Bubu'
  ),
  item('7', 'Lethal Pride', 'unique', W + 'Lethal_Pride', null, 'medium', 'Ryslatha or Kiloava version', 'pablo'),
  item('8', 'The Adorned', 'unique', W + 'The_Adorned', null, 'medium', null, 'mati'),
  item(
    '9',
    'Large Cluster Jewel',
    'base',
    W + 'Large_Cluster_Jewel',
    84,
    'medium',
    '8 passive, Added Small Passive Skills grant: Damage over Time Multiplier',
    'juli'
  ),
  item(
    '10',
    'Medium Cluster Jewel',
    'base',
    W + 'Medium_Cluster_Jewel',
    75,
    'medium',
    'Precise Commander + Replenishing Presence',
    'carlos'
  ),
  item('11', 'Small Cluster Jewel', 'base', W + 'Small_Cluster_Jewel', null, 'low', 'Feast of Flesh notable', 'pablo'),
  item(
    '12',
    'Botas con Vida y Resistencias',
    'rare',
    W + 'Two-Toned_Boots_(Fire_and_Cold_Resistance)',
    86,
    'medium',
    'T1 life, res capped, 30%+ movespeed, evasion base',
    'mati'
  ),
  item(
    '13',
    'Guantes Evasion Raro',
    'rare',
    W + 'Slink_Gloves',
    85,
    'low',
    'Need attackspeed + crit chance or flat phys',
    'juli'
  ),
]

type SortKey = 'item_name' | 'item_type' | 'item_level' | 'priority' | 'username'
type SortDir = 'asc' | 'desc'

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
  const [items, setItems] = useState<WishlistItemWithUser[]>(MOCK_ITEMS)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function loadItems() {
    if (!leagueId) return
    setLoading(true)
    getLeagueWishlist(leagueId).then((data) => {
      setItems(data.length > 0 ? data : MOCK_ITEMS)
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

  const sorted = sortItems(items, sortKey, sortDir)

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
        <Button size='sm' variant='outline' onClick={() => setDialogOpen(true)}>
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-foreground' />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No items in wishlist yet.</p>
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
                <WishlistItemRow key={item.id} item={item} />
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
