import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({ error: 'No webhook configured' }, { status: 500 })

  const { action, actorUsername, itemName, ownerUsername } = await req.json()

  let content: string
  if (action === 'found') {
    content = `**${actorUsername}** consiguió **${itemName}** para **${ownerUsername}**!! 🎉`
  } else {
    content = `**${actorUsername}** eliminó **${itemName}** de la wishlist de **${ownerUsername}**`
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) return NextResponse.json({ error: 'Discord error' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send' }, { status: 502 })
  }
}
