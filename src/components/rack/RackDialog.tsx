import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cellAddress, rackAddress, templateCells } from '@/domain/address'
import type { Rack } from '@/domain/types'
import { useWarehouseStore } from '@/store/useWarehouseStore'
import { RackFacade } from './RackFacade'

/** Позиция стеллажа (индексы с нуля) — для адресов. */
export type RackLocation = { b: number; f: number; r: number; k: number }

type Props = {
  rack: Rack | null
  location: RackLocation | null
  onOpenChange: (open: boolean) => void
  editable?: boolean
}

/** Карточка стеллажа: фасад с адресами ячеек; в режиме editable — смена шаблона и удаление. */
export function RackDialog({ rack, location, onOpenChange, editable }: Props) {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const setRackTemplate = useWarehouseStore((s) => s.setRackTemplate)
  const removeRack = useWarehouseStore((s) => s.removeRack)
  const template = templates.find((t) => t.id === rack?.templateId)
  const loc = location ?? { b: 0, f: 0, r: 0, k: 0 }

  return (
    <Dialog open={!!rack} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">{rackAddress(loc.b, loc.f, loc.r, loc.k)}</DialogTitle>
          <DialogDescription>
            {template
              ? `${template.name}: ${template.shelves.length} полок, ${templateCells(template)} ячеек. Наведите на ячейку, чтобы увидеть её адрес.`
              : 'Шаблон не найден'}
          </DialogDescription>
        </DialogHeader>

        {rack && editable && (
          <Select value={rack.templateId} onValueChange={(v) => setRackTemplate(rack.id, v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {template && (
          <div className="flex justify-center overflow-x-auto py-2">
            <RackFacade
              shelves={template.shelves}
              size="md"
              showCellNumbers
              cellTitle={(p, c) => cellAddress(loc.b, loc.f, loc.r, loc.k, p, c)}
              renderShelfAside={(_, p) => (
                <span className="flex items-center pl-2 font-mono text-[11px] text-muted-foreground">
                  П{p + 1}
                </span>
              )}
            />
          </div>
        )}

        {rack && editable && (
          <DialogFooter>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => {
                removeRack(rack.id)
                onOpenChange(false)
              }}
            >
              <Trash2Icon /> Убрать из ряда
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
