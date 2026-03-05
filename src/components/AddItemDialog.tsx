'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addWishlistItem } from '@/lib/wishlists'
import { useAuth } from '@/contexts/AuthContext'
import type { Priority, ItemType } from '@/types/database'

interface Props {
  open: boolean
  leagueId: string
  userId: string
  onClose: () => void
  onAdded: () => void
}

function extractWikiSlug(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const idx = trimmed.indexOf('wiki/')
  if (idx === -1) return null
  const slug = trimmed.slice(idx + 5)
  return slug || null
}

export function AddItemDialog({ open, leagueId, userId, onClose, onAdded }: Props) {
  const { profile } = useAuth()
  const [itemName, setItemName] = useState('')
  const [wikiUrl, setWikiUrl] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [itemType, setItemType] = useState<ItemType>('unique')
  const [itemLevel, setItemLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!itemName.trim()) {
      toast.error('Item name is required.')
      return
    }
    setSaving(true)
    try {
      await addWishlistItem({
        league_id: leagueId,
        user_id: userId,
        item_name: itemName.trim(),
        item_type: itemType,
        wiki_url: extractWikiSlug(wikiUrl),
        item_level: itemLevel ? parseInt(itemLevel) : null,
        notes: notes.trim() || null,
        priority,
        status: 'needed',
      })
      fetch('/api/discord-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'added',
          actorDiscord: profile?.username,
          itemName: itemName.trim(),
          itemType: itemType,
          priority: priority,
          itemLevel: itemLevel ? parseInt(itemLevel) : null,
          notes: notes.trim() || null,
        }),
      })
      toast.success('Item added!')
      handleClose()
      onAdded()
    } catch {
      toast.error('Failed to save item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setItemName('')
    setWikiUrl('')
    setPriority('medium')
    setItemType('unique')
    setItemLevel('')
    setNotes('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add Item to Wishlist</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Item Name */}
          <div className='space-y-1.5'>
            <Label>Item Name</Label>
            <Input
              placeholder='e.g. Headhunter'
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              autoFocus
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {/* Priority */}
            <div className='space-y-1.5'>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Item Type */}
            <div className='space-y-1.5'>
              <Label>Type</Label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as ItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='unique'>Unique</SelectItem>
                  <SelectItem value='rare'>Rare</SelectItem>
                  <SelectItem value='magic'>Magic</SelectItem>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='base'>Base</SelectItem>
                  <SelectItem value='gem'>Gem</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Item Level */}
          <div className='space-y-1.5'>
            <Label>Item Level <span className='text-muted-foreground font-normal'>(optional)</span></Label>
            <Input
              type='number'
              min={1}
              max={100}
              placeholder='e.g. 86'
              value={itemLevel}
              onChange={(e) => setItemLevel(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className='space-y-1.5'>
            <Label>Notes <span className='text-muted-foreground font-normal'>(optional)</span></Label>
            <Input
              placeholder='e.g. need for lightning build'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Wiki URL */}
          <div className='space-y-1.5'>
            <Label>PoE Wiki URL <span className='text-muted-foreground font-normal'>(optional)</span></Label>
            <Input
              placeholder='https://www.poewiki.net/wiki/Headhunter'
              value={wikiUrl}
              onChange={(e) => setWikiUrl(e.target.value)}
            />
          </div>


        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !itemName.trim()}>
            {saving ? 'Saving...' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
