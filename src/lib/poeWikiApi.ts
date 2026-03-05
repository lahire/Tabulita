export interface PoeItemData {
  name: string
  baseItem: string
  class: string
  implicitStatText: string
  explicitStatText: string
  flavourText: string
  rarity: string
}

function stripWikiMarkup(text: string): string {
  if (!text) return ''
  return text
    // 1. Convert encoded <br> to real <br> first (preserve line breaks)
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
    // 2. Extract table header text, drop the rest of the table (still encoded at this point)
    .replace(/&lt;table[\s\S]*?&lt;th[^&]*&gt;([\s\S]*?)&lt;\/th&gt;[\s\S]*?&lt;\/table&gt;/gi, '<br>[$1]')
    // 3. Strip all remaining encoded HTML tags (&lt;...&gt;)
    .replace(/&lt;[^&]*?&gt;/g, '')
    // 4. Decode double-encoded entities (e.g. &amp;lt; → [, game uses <...> for choices)
    .replace(/&amp;lt;/g, '[')
    .replace(/&amp;gt;/g, ']')
    .replace(/&amp;nbsp;/g, ' ')
    .replace(/&amp;bull;/g, ' • ')
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;quot;/g, '"')
    // 5. Decode remaining single-encoded entities
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, ' • ')
    .replace(/&quot;/g, '"')
    // 6. Strip any real HTML tags that slipped through (except <br>)
    .replace(/<(?!br\b)[^>]+>/gi, '')
    // 7. Wiki link markup
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
}

export async function fetchPoeItem(name: string): Promise<PoeItemData | null> {
  try {
    const url = `/api/poe-item?name=${encodeURIComponent(name)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const item = json?.cargoquery?.[0]?.title
    if (!item) return null
    return {
      name: item['name'] ?? '',
      baseItem: item['base item'] ?? '',
      class: item['class'] ?? '',
      implicitStatText: stripWikiMarkup(item['implicit stat text'] ?? ''),
      explicitStatText: stripWikiMarkup(item['explicit stat text'] ?? ''),
      flavourText: stripWikiMarkup(item['flavour text'] ?? ''),
      rarity: item['rarity'] ?? 'Normal',
    }
  } catch {
    return null
  }
}
