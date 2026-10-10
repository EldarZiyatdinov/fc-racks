import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import type { RackTemplate } from '@/domain/types'
import { RACK_COLOR, RackFacade } from './RackFacade'

type Props = {
  template: RackTemplate | undefined
  /** Первая строка подписи (например, «С1»); вторая — название шаблона. */
  label?: string
  className?: string
} & Omit<ComponentProps<'div'>, 'children'>

/** Компактный стеллаж для плана этажа: мини-фасад + подпись с названием шаблона. */
export function RackBlock({ template, label, className, style, ...rest }: Props) {
  return (
    <div
      className={cn(
        'flex w-[88px] shrink-0 flex-col items-center gap-1 rounded-md border bg-white p-1.5 shadow-xs',
        className,
      )}
      style={{ borderTopColor: RACK_COLOR, borderTopWidth: 3, ...style }}
      {...rest}
    >
      {template ? (
        <RackFacade shelves={template.shelves} size="sm" />
      ) : (
        <div className="flex h-16 items-center text-xs text-destructive">нет шаблона</div>
      )}
      <div className="w-full text-center text-[11px] leading-tight">
        {label && <div className="font-medium">{label}</div>}
        <div className="truncate text-muted-foreground">{template?.name}</div>
      </div>
    </div>
  )
}
