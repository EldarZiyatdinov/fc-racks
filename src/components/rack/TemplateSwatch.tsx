import { cn } from '@/lib/utils'

/** Цветная метка шаблона. */
export function TemplateSwatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn('inline-block size-3 shrink-0 rounded-sm border border-black/10', className)}
      style={{ backgroundColor: color }}
    />
  )
}
