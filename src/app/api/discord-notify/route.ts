import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({ error: 'No webhook configured' }, { status: 500 })

  const { action, actorDiscord, ownerDiscord, itemName, matchNotes, itemType, priority, itemLevel, notes } = await req.json()

  const actor = actorDiscord ?? 'unknown'
  const owner = ownerDiscord ?? 'unknown'

  let embed: object
  if (action === 'found') {
    let description = `**${actor}** encontró **${itemName}** para **${owner}** 🎉`
    if (matchNotes) description += `\n\n> ${matchNotes}`
    embed = {
      color: 0x57F287,
      description,
    }
  } else if (action === 'cancel') {
    embed = {
      color: 0xED4245,
      description: `**${actor}** canceló **${itemName}** de la wishlist de **${owner}**`,
    }
  } else if (action === 'return') {
    embed = {
      color: 0x5865F2,
      description: `**${actor}** devolvió **${itemName}** a needed en la wishlist de **${owner}**`,
    }
  } else if (action === 'added') {
    const fields = [
      { name: 'Tipo', value: itemType ?? '—', inline: true },
      { name: 'Prioridad', value: priority ?? '—', inline: true },
    ]
    if (itemLevel) fields.push({ name: 'iLvl', value: String(itemLevel), inline: true })
    if (notes) fields.push({ name: 'Notas', value: notes, inline: false })
    embed = {
      color: 0xFEE75C,
      description: `**${actor}** agregó **${itemName}** a su wishlist`,
      fields,
    }
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
    if (!res.ok) return NextResponse.json({ error: 'Discord error' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send' }, { status: 502 })
  }
}
