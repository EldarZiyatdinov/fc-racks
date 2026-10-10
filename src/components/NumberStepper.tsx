import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'xs'
  className?: string
}

/** Число с кнопками «−» / «+» и ручным вводом. */
export function NumberStepper({ value, onChange, min = 0, max = 99, size = 'sm', className }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, Math.round(n) || min)))
  const btn = size === 'sm' ? 'icon-sm' : 'icon-xs'
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size={btn}
        disabled={value <= min}
        onClick={() => set(value - 1)}
        aria-label="Уменьшить"
      >
        <MinusIcon />
      </Button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => set(Number(e.target.value))}
        className={cn(
          'rounded-md border bg-background text-center tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
          size === 'sm' ? 'h-8 w-12 text-sm' : 'h-6 w-9 text-xs',
        )}
      />
      <Button
        type="button"
        variant="outline"
        size={btn}
        disabled={value >= max}
        onClick={() => set(value + 1)}
        aria-label="Увеличить"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
