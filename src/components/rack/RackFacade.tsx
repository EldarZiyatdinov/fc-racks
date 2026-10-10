import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Shelf } from '@/domain/types'

/** Единый цвет ячеек-коробок. */
export const RACK_COLOR = '#f97316'

export type FacadeSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZES: Record<
  FacadeSize,
  { width: number; cellH: number; gap: number; post: number; board: number; pad: number }
> = {
  xs: { width: 34, cellH: 5, gap: 1, post: 2, board: 1, pad: 1 },
  sm: { width: 72, cellH: 10, gap: 2, post: 3, board: 2, pad: 2 },
  md: { width: 150, cellH: 22, gap: 3, post: 5, board: 3, pad: 3 },
  lg: { width: 360, cellH: 46, gap: 6, post: 8, board: 5, pad: 6 },
}

type Props = {
  /** Полки снизу вверх. */
  shelves: Shelf[]
  size?: FacadeSize
  /** Подсказка для ячейки (например, её адрес). Индексы с нуля, полка — снизу. */
  cellTitle?: (shelfIndex: number, cellIndex: number) => string
  /** Дополнительный элемент в конце ряда ячеек (например, «+ ячейка»). */
  renderShelfEnd?: (shelf: Shelf, shelfIndex: number) => ReactNode
  /** Содержимое справа от полки (кнопки редактора). */
  renderShelfAside?: (shelf: Shelf, shelfIndex: number) => ReactNode
  /** Показывать номера ячеек внутри коробок. */
  showCellNumbers?: boolean
  className?: string
}

/** Фасад стеллажа: стойки, полки-доски и ячейки-«коробки». */
export function RackFacade({
  shelves,
  size = 'md',
  cellTitle,
  renderShelfEnd,
  renderShelfAside,
  showCellNumbers = size === 'lg',
  className,
}: Props) {
  const d = SIZES[size]
  const post: CSSProperties = { borderLeftWidth: d.post, borderRightWidth: d.post }
  const box: CSSProperties = {
    height: d.cellH,
    backgroundColor: `color-mix(in oklab, ${RACK_COLOR} 22%, white)`,
    borderColor: `color-mix(in oklab, ${RACK_COLOR} 75%, black)`,
  }
  const tape: CSSProperties = { backgroundColor: `color-mix(in oklab, ${RACK_COLOR} 45%, white)` }
  // Рисуем сверху вниз, а хранятся полки снизу вверх.
  const topDown = shelves.map((shelf, index) => ({ shelf, index })).reverse()

  return (
    <div className={cn('inline-flex flex-col', className)}>
      {/* Верх стоек */}
      <div className="flex">
        <div
          className="flex justify-between"
          style={{ width: d.width, height: Math.max(2, d.pad * 2) }}
        >
          <div className="bg-slate-600" style={{ width: d.post }} />
          <div className="bg-slate-600" style={{ width: d.post }} />
        </div>
      </div>

      {topDown.map(({ shelf, index }) => (
        <div key={shelf.id} className="group/shelf flex items-stretch">
          <div className="border-x-slate-600 shrink-0" style={{ ...post, width: d.width }}>
            <div className="flex" style={{ gap: d.gap, padding: `${d.pad}px ${d.pad}px 0` }}>
              {Array.from({ length: shelf.cells }, (_, c) => (
                <div
                  key={c}
                  title={cellTitle?.(index, c)}
                  className={cn(
                    'relative min-w-0 flex-1 overflow-hidden border',
                    size === 'xs' ? 'rounded-[1px]' : 'rounded-sm',
                  )}
                  style={box}
                >
                  {(size === 'md' || size === 'lg') && (
                    <div className="absolute top-0 left-1/2 h-1/3 w-1/4 -translate-x-1/2" style={tape} />
                  )}
                  {showCellNumbers && (
                    <span className="absolute inset-0 flex items-end justify-center pb-0.5 text-[10px] font-medium text-slate-600">
                      {c + 1}
                    </span>
                  )}
                </div>
              ))}
              {renderShelfEnd?.(shelf, index)}
            </div>
            <div className="bg-slate-400" style={{ height: d.board, marginTop: d.pad }} />
          </div>
          {renderShelfAside?.(shelf, index)}
        </div>
      ))}

      {/* Ножки */}
      <div className="flex justify-between" style={{ width: d.width, height: Math.max(2, d.pad * 1.5) }}>
        <div className="bg-slate-600" style={{ width: d.post * 1.6 }} />
        <div className="bg-slate-600" style={{ width: d.post * 1.6 }} />
      </div>
    </div>
  )
}
