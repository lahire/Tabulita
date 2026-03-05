'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PoeItemTooltip } from '@/components/PoeItemTooltip'
import { fetchPoeItem, type PoeItemData } from '@/lib/poeWikiApi'
import { addWishlistItem } from '@/lib/wishlists'
import type { Priority, ItemType } from '@/types/database'

function parseWikiName(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('poewiki.net')) return null
    const segments = parsed.pathname.split('/')
    const wikiIndex = segments.indexOf('wiki')
    if (wikiIndex === -1 || !segments[wikiIndex + 1]) return null
    return decodeURIComponent(segments[wikiIndex + 1].replace(/_/g, ' '))
  } catch {
    return null
  }
}

interface Props {
  open: boolean
  leagueId: string
  userId: string
  onClose: () => void
  onAdded: () => void
}

export function AddItemDialog({ open, leagueId, userId, onClose, onAdded }: Props) {
  const [wikiUrl, setWikiUrl] = useState('')
  const [manualName, setManualName] = useState('')
  const [preview, setPreview] = useState<PoeItemData | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [priority, setPriority] = useState<Priority>('medium')
  const [itemType, setItemType] = useState<ItemType>('unique')
  const [itemLevel, setItemLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const useWikiUrl = wikiUrl.trim().length > 0

  async function handleUrlBlur() {
    const name = parseWikiName(wikiUrl.trim())
    if (!name) {
      setPreview(null)
      return
    }
    setPreviewing(true)
    const data = await fetchPoeItem(name)
    setPreview(data)
    if (data) setItemType(mapClass(data.class))
    setPreviewing(false)
  }

  function mapClass(cls: string): ItemType {
    if (!cls) return 'unique'
    const c = cls.toLowerCase()
    if (c.includes('currency')) return 'base'
    if (c.includes('gem')) return 'base'
    return 'unique'
  }

  function resolvedName() {
    if (useWikiUrl) return preview?.name ?? parseWikiName(wikiUrl.trim()) ?? ''
    return manualName.trim()
  }

  async function handleSubmit() {
    const name = resolvedName()
    if (!name) {
      setError('Item name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addWishlistItem({
        league_id: leagueId,
        user_id: userId,
        item_name: name,
        item_type: itemType,
        wiki_url: wikiUrl.trim() || null,
        item_level: itemLevel ? parseInt(itemLevel) : null,
        required_mods: [],
        notes: notes.trim() || null,
        priority,
        status: 'needed',
      })
      handleClose()
      onAdded()
    } catch {
      setError('Failed to save item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setWikiUrl('')
    setManualName('')
    setPreview(null)
    setPriority('medium')
    setItemType('unique')
    setItemLevel('')
    setNotes('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add Item to Wishlist</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Wiki URL */}
          <div className='space-y-1.5'>
            <Label>PoE Wiki URL (recommended)</Label>
            <Input
              placeholder='https://www.poewiki.net/wiki/Headhunter'
              value={wikiUrl}
              onChange={(e) => { setWikiUrl(e.target.value); setPreview(null) }}
              onBlur={handleUrlBlur}
            />
            <p className='text-xs text-muted-foreground'>Paste a link from poewiki.net to auto-fill item data.</p>
          </div>

          {/* Preview */}
          {useWikiUrl && (
            <div className='min-h-8'>
              {previewing ? (
                <p className='text-xs text-muted-foreground'>Fetching item data...</p>
              ) : preview ? (
                <PoeItemTooltip item={preview} />
              ) : parseWikiName(wikiUrl.trim()) ? (
                <p className='text-xs text-destructive'>Item not found on the wiki.</p>
              ) : null}
            </div>
          )}

          {/* Manual name fallback */}
          {!useWikiUrl && (
            <div className='space-y-1.5'>
              <Label>Item Name</Label>
              <Input
                placeholder='e.g. Crafted Rare Belt'
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
          )}

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

          {error && <p className='text-xs text-destructive'>{error}</p>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || (!resolvedName())}>
            {saving ? 'Saving...' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
