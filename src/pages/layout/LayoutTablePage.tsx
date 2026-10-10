import { useState, type ReactNode } from 'react'
import { CopyIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EditableText } from '@/components/EditableText'
import { StatsLine } from '@/components/StatsLine'
import { TemplatePicker } from '@/components/rack/TemplatePicker'
import { buildingStats, rowStats, templateMap } from '@/domain/address'
import type { Row } from '@/domain/types'
import { useWarehouseStore } from '@/store/useWarehouseStore'

const ALL = '__all__'

/** B3: вся расстановка одной таблицей — здание · этаж · ряд · состав. */
export function LayoutTablePage() {
  const buildings = useWarehouseStore((s) => s.buildings)
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const s = useWarehouseStore.getState()
  const [filter, setFilter] = useState(ALL)
  const tpl = templateMap(templates)
  const visible = filter === ALL ? buildings : buildings.filter((b) => b.id === filter)

  const lines: ReactNode[] = []
  for (const b of visible) {
    const bi = buildings.indexOf(b)
    const bSpan = b.floors.reduce((n, f) => n + Math.max(1, f.rows.length), 0) || 1
    const start = lines.length
    // Ячейка здания (rowSpan) выводится только в первой строке здания.
    const buildingCell = () =>
      lines.length === start && (
        <TableCell rowSpan={bSpan} className="border-r align-top">
          <EditableText
            value={b.name}
            onChange={(v) => s.renameBuilding(b.id, v)}
            className="font-medium"
          />
          <StatsLine stats={buildingStats(b, tpl)} show={['floors', 'racks']} className="block px-1" />
          <Button variant="ghost" size="xs" className="mt-1" onClick={() => s.addFloor(b.id)}>
            <PlusIcon /> этаж
          </Button>
        </TableCell>
      )

    if (b.floors.length === 0)
      lines.push(
        <TableRow key={b.id}>
          {buildingCell()}
          <TableCell colSpan={6} className="text-muted-foreground">
            Нет этажей
          </TableCell>
        </TableRow>,
      )

    b.floors.forEach((f, fi) => {
      const floorCell = (
        <TableCell rowSpan={Math.max(1, f.rows.length)} className="border-r align-top">
          <EditableText value={f.name} onChange={(v) => s.renameFloor(f.id, v)} />
          <div className="flex gap-0.5">
            <Button variant="ghost" size="xs" onClick={() => s.addRow(f.id)}>
              <PlusIcon /> ряд
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title="Удалить этаж"
              className="text-destructive"
              onClick={() => s.removeFloor(f.id)}
            >
              <Trash2Icon />
            </Button>
          </div>
        </TableCell>
      )
      if (f.rows.length === 0)
        lines.push(
          <TableRow key={f.id}>
            {buildingCell()}
            {floorCell}
            <TableCell colSpan={5} className="text-muted-foreground">
              Нет рядов
            </TableCell>
          </TableRow>,
        )
      f.rows.forEach((row, ri) =>
        lines.push(
          <TableRow key={row.id}>
            {buildingCell()}
            {ri === 0 && floorCell}
            <TableCell className="w-32">
              <div className="font-mono text-[10px] text-muted-foreground">
                З{bi + 1}-Э{fi + 1}-Р{ri + 1}
              </div>
              <EditableText value={row.name} onChange={(v) => s.renameRow(row.id, v)} />
            </TableCell>
            <TableCell className="whitespace-normal">
              <RowChips row={row} />
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.racks.length}</TableCell>
            <TableCell className="text-right tabular-nums">{rowStats(row, tpl).cells}</TableCell>
            <TableCell className="w-20 text-right">
              <Button
                variant="ghost"
                size="icon-xs"
                title="Дублировать ряд"
                onClick={() => s.duplicateRow(row.id)}
              >
                <CopyIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="Удалить ряд"
                className="text-destructive"
                onClick={() => s.removeRow(row.id)}
              >
                <Trash2Icon />
              </Button>
            </TableCell>
          </TableRow>,
        ),
      )
    })
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="flex flex-wrap items-center gap-3 px-4">
        <div>
          <CardTitle className="text-base">Расстановка таблицей</CardTitle>
          <CardDescription>
            Чип — стеллаж в ряду (слева направо). «×» убирает, «+» добавляет в конец.
          </CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все здания</SelectItem>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => s.addBuilding()}>
            <PlusIcon /> Здание
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Здание</TableHead>
                <TableHead className="w-36">Этаж</TableHead>
                <TableHead>Ряд</TableHead>
                <TableHead>Состав</TableHead>
                <TableHead className="text-right">Стеллажей</TableHead>
                <TableHead className="text-right">Ячеек</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length ? (
                lines
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Нет зданий
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function RowChips({ row }: { row: Row }) {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const removeRack = useWarehouseStore((s) => s.removeRack)
  const addRack = useWarehouseStore((s) => s.addRack)
  const tpl = templateMap(templates)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {row.racks.map((rack, k) => {
        const t = tpl.get(rack.templateId)
        return (
          <span
            key={rack.id}
            title={`С${k + 1} · ${t?.name ?? 'нет шаблона'}`}
            className="group inline-flex h-6 max-w-28 items-center gap-1 rounded border pr-0.5 pl-1.5 text-[11px]"
            style={{
              backgroundColor: t ? `color-mix(in oklab, ${t.color} 18%, white)` : undefined,
              borderColor: t?.color,
            }}
          >
            <span className="truncate">{t?.name ?? '?'}</span>
            <button
              type="button"
              onClick={() => removeRack(rack.id)}
              className="rounded opacity-40 group-hover:opacity-100 hover:bg-black/10"
              aria-label="Убрать стеллаж"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        )
      })}
      <TemplatePicker onSelect={(id) => addRack(row.id, id)}>
        <Button variant="outline" size="icon-xs" title="Добавить стеллаж">
          <PlusIcon />
        </Button>
      </TemplatePicker>
    </div>
  )
}
