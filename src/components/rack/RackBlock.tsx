import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import type { RackTemplate } from '@/domain/types'
import { RackFacade } from './RackFacade'

type Props = {
  template: RackTemplate | undefined
  label?: string
  className?: string
} & Omit<ComponentProps<'div'>, 'children'>

/** Компактный стеллаж для плана этажа: мини-фасад + подпись. */
export function RackBlock({ template, label, className, style, ...rest }: Props) {
  return (
    <div
      className={cn(
        'flex w-[88px] shrink-0 flex-col items-center gap-1 rounded-md border bg-white p-1.5 shadow-xs',
        className,
      )}
      style={{ borderTopColor: template?.color, borderTopWidth: 3, ...style }}
      {...rest}
    >
      {template ? (
        <RackFacade shelves={template.shelves} color={template.color} size="sm" />
      ) : (
        <div className="flex h-16 items-center text-xs text-destructive">нет шаблона</div>
      )}
      <div className="w-full truncate text-center text-[11px] leading-tight text-muted-foreground">
        {label ?? template?.name}
      </div>
    </div>
  )
}
