import type { PoeItemData } from '@/lib/poeWikiApi'

const RARITY_COLORS: Record<string, string> = {
  Unique: '#af6025',
  Magic: '#8888ff',
  Rare: '#ffff77',
  Normal: '#c8c8c8',
}

const RARITY_BORDER: Record<string, string> = {
  Unique: '#af6025',
  Magic: '#8888ff',
  Rare: '#ffff77',
  Normal: '#888888',
}

function StatLines({ text }: { text: string }) {
  if (!text) return null
  const lines = text
    .split('<br>')
    .map((l) => l.trim())
    .filter(Boolean)
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className='leading-5 text-center'>
          {line}
        </p>
      ))}
    </>
  )
}

function Divider() {
  return <div className='my-1.5 h-px w-full' style={{ backgroundColor: '#54493b' }} />
}

interface Props {
  item: PoeItemData
}

export function PoeItemTooltip({ item }: Props) {
  const nameColor = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.Normal
  const borderColor = RARITY_BORDER[item.rarity] ?? RARITY_BORDER.Normal

  return (
    <div
      className='w-95 px-3 py-2 text-xs select-none max-h-96 overflow-y-auto'
      style={{
        backgroundColor: '#0c0c0c',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 6px ${borderColor}44`,
        fontFamily: '"Fontin SmallCaps", serif',
      }}
    >
      {/* Header */}
      <div className='text-center mb-1'>
        <p className='text-sm font-semibold leading-tight' style={{ color: nameColor }}>
          {item.name}
        </p>
        {item.baseItem && (
          <p className='text-xs leading-tight' style={{ color: nameColor }}>
            {item.baseItem}
          </p>
        )}
      </div>

      {item.class && (
        <>
          <Divider />
          <p className='text-center leading-5' style={{ color: '#7f7f7f' }}>
            {item.class}
          </p>
        </>
      )}

      {item.implicitStatText && (
        <>
          <Divider />
          <div style={{ color: '#8888ff' }}>
            <StatLines text={item.implicitStatText} />
          </div>
        </>
      )}

      {item.explicitStatText && (
        <>
          <Divider />
          <div style={{ color: '#c8c8c8' }}>
            <StatLines text={item.explicitStatText} />
          </div>
        </>
      )}

      {item.flavourText && (
        <>
          <Divider />
          <div className='italic' style={{ color: '#af6025' }}>
            <StatLines text={item.flavourText} />
          </div>
        </>
      )}
    </div>
  )
}
