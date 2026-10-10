import { CopyIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { templateCells } from '@/domain/address'
import { TEMPLATE_COLORS, type RackTemplate } from '@/domain/types'
import { useTemplateUsage } from '@/hooks/useSelectedTemplate'
import { cn } from '@/lib/utils'
import { useWarehouseStore } from '@/store/useWarehouseStore'

type Props = { template: RackTemplate; onSelect: (id: string) => void }

/** Имя, цвет, сводка и действия над шаблоном. */
export function TemplateMetaCard({ template, onSelect }: Props) {
  const updateTemplate = useWarehouseStore((s) => s.updateTemplate)
  const duplicateTemplate = useWarehouseStore((s) => s.duplicateTemplate)
  const removeTemplate = useWarehouseStore((s) => s.removeTemplate)
  const used = useTemplateUsage().get(template.id) ?? 0

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">Параметры</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="space-y-1.5">
          <Label htmlFor="tpl-name">Название</Label>
          <Input
            id="tpl-name"
            value={template.name}
            onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Цвет</Label>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => updateTemplate(template.id, { color: c })}
                className={cn(
                  'size-7 rounded-md border-2 border-transparent transition-transform hover:scale-110',
                  template.color === c && 'border-foreground',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Полок', template.shelves.length],
            ['Ячеек', templateCells(template)],
            ['Расставлено', used],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-muted px-2 py-1.5">
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const id = duplicateTemplate(template.id)
              if (id) onSelect(id)
            }}
          >
            <CopyIcon /> Дублировать
          </Button>
          <ConfirmDialog
            title={`Удалить «${template.name}»?`}
            description={
              used > 0
                ? `Шаблон используется в ${used} стеллаж(ах) — сначала уберите их из рядов.`
                : 'Шаблон не используется в расстановке.'
            }
            confirmText="Удалить"
            destructive
            onConfirm={() => {
              const n = removeTemplate(template.id)
              if (n > 0) toast.error(`Нельзя удалить: шаблон используется в ${n} стеллаж(ах)`)
              else toast.success('Шаблон удалён')
            }}
          >
            <Button variant="outline" size="sm" className="flex-1 text-destructive">
              <Trash2Icon /> Удалить
            </Button>
          </ConfirmDialog>
        </div>
      </CardContent>
    </Card>
  )
}
