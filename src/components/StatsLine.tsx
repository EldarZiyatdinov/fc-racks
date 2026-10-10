import { plural, type Stats } from '@/domain/address'
import { cn } from '@/lib/utils'

type Props = { stats: Stats; show?: (keyof Stats)[]; className?: string }

const FORMS: Record<keyof Stats, [string, string, string]> = {
  floors: ['этаж', 'этажа', 'этажей'],
  rows: ['ряд', 'ряда', 'рядов'],
  racks: ['стеллаж', 'стеллажа', 'стеллажей'],
  cells: ['ячейка', 'ячейки', 'ячеек'],
}

/** «2 этажа · 5 рядов · 20 стеллажей · 180 ячеек». */
export function StatsLine({ stats, show = ['floors', 'rows', 'racks', 'cells'], className }: Props) {
  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {show.map((k) => `${stats[k]} ${plural(stats[k], FORMS[k])}`).join(' · ')}
    </span>
  )
}
