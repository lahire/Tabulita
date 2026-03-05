import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json(null, { status: 400 })

  const where = encodeURIComponent(`name="${name}"`)
  const url = `https://www.poewiki.net/api.php?action=cargoquery&tables=items&fields=name,base_item,class,implicit_stat_text,explicit_stat_text,flavour_text,rarity&where=${where}&format=json&limit=1`

  try {
    const res = await fetch(url)
    const json = await res.json()
    return NextResponse.json(json)
  } catch {
    return NextResponse.json(null, { status: 502 })
  }
}
