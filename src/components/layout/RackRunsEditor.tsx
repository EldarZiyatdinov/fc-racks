import { PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NumberStepper } from '@/components/NumberStepper'
import { RACK_COLOR } from '@/components/rack/RackFacade'
import type { RackRun } from '@/domain/types'
import { useWarehouseStore } from '@/store/useWarehouseStore'

type Props = { value: RackRun[]; onChange: (runs: RackRun[]) => void }

/** Состав ряда: список «шаблон × количество» + полоска-превью. */
export function RackRunsEditor({ value, onChange }: Props) {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const update = (i: number, patch: Partial<RackRun>) =>
    onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  if (templates.length === 0)
    return <p className="text-sm text-muted-foreground">Сначала создайте шаблоны стеллажей.</p>

  return (
    <div className="space-y-2">
      {value.map((run, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={run.templateId} onValueChange={(v) => update(i, { templateId: v })}>
            <SelectTrigger size="sm" className="w-48">
              <SelectValue placeholder="Шаблон" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">×</span>
          <NumberStepper
            min={1}
            max={50}
            value={run.count}
            onChange={(n) => update(i, { count: n })}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            title="Убрать"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <XIcon />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...value,
            { templateId: value[value.length - 1]?.templateId ?? templates[0].id, count: 1 },
          ])
        }
      >
        <PlusIcon /> Добавить группу
      </Button>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-0.5 pt-1" title="Порядок стеллажей в ряду">
          {value.flatMap((run, i) =>
            Array.from({ length: run.count }, (_, j) => (
              <div
                key={`${i}-${j}`}
                className="h-5 w-3 rounded-[2px]"
                style={{ backgroundColor: RACK_COLOR }}
              />
            )),
          )}
        </div>
      )}
    </div>
  )
}
