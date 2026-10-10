import { PlusIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RackFacade } from '@/components/rack/RackFacade'
import { plural, templateCells } from '@/domain/address'
import type { RackTemplate } from '@/domain/types'
import { useTemplateUsage } from '@/hooks/useSelectedTemplate'
import { cn } from '@/lib/utils'
import { useWarehouseStore } from '@/store/useWarehouseStore'

type Props = {
  templates: RackTemplate[]
  selectedId?: string
  onSelect: (id: string) => void
}

/** Левая колонка: список шаблонов с мини-превью. */
export function TemplateList({ templates, selectedId, onSelect }: Props) {
  const addTemplate = useWarehouseStore((s) => s.addTemplate)
  const usage = useTemplateUsage()

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex items-center justify-between px-4">
        <CardTitle className="text-base">Шаблоны</CardTitle>
        <Button size="sm" onClick={() => onSelect(addTemplate())}>
          <PlusIcon /> Новый
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-2">
        {templates.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Шаблонов пока нет — создайте первый.
          </p>
        )}
        {templates.map((t) => {
          const used = usage.get(t.id) ?? 0
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={cn(
                'flex items-center gap-3 rounded-md border border-transparent p-2 text-left transition-colors hover:bg-accent',
                t.id === selectedId && 'border-primary/40 bg-primary/5',
              )}
            >
              <RackFacade shelves={t.shelves} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.shelves.length} {plural(t.shelves.length, ['полка', 'полки', 'полок'])} ·{' '}
                  {templateCells(t)} яч.
                </div>
              </div>
              {used > 0 && (
                <Badge variant="secondary" title="Сколько стеллажей этого типа расставлено">
                  ×{used}
                </Badge>
              )}
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
