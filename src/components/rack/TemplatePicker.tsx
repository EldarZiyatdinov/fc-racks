import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { templateCells } from '@/domain/address'
import { useWarehouseStore } from '@/store/useWarehouseStore'
import { RackFacade } from './RackFacade'

type Props = {
  children: ReactNode
  onSelect: (templateId: string) => void
  align?: 'start' | 'center' | 'end'
}

/** Popover со списком шаблонов (мини-превью). Триггер передаётся через children. */
export function TemplatePicker({ children, onSelect, align = 'start' }: Props) {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-2">
        {templates.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">
            Шаблонов пока нет.{' '}
            <Link to="/templates" className="text-primary underline">
              Создать
            </Link>
          </div>
        ) : (
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex flex-col items-center gap-1 rounded-md border p-2 text-xs hover:border-primary hover:bg-accent"
                onClick={() => {
                  onSelect(t.id)
                  setOpen(false)
                }}
              >
                <RackFacade shelves={t.shelves} size="sm" />
                <span className="w-full truncate font-medium">{t.name}</span>
                <span className="text-muted-foreground">{templateCells(t)} яч.</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
