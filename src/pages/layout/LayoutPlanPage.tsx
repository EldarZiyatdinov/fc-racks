import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  BuildingIcon,
  CopyIcon,
  EllipsisIcon,
  EraserIcon,
  LayersIcon,
  ListPlusIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditableText } from '@/components/EditableText'
import { RackRunsEditor } from '@/components/layout/RackRunsEditor'
import { StatsLine } from '@/components/StatsLine'
import { RackBlock } from '@/components/rack/RackBlock'
import { RackDialog, type RackLocation } from '@/components/rack/RackDialog'
import { RackFacade } from '@/components/rack/RackFacade'
import { TemplatePicker } from '@/components/rack/TemplatePicker'
import { floorStats, rowStats, templateMap } from '@/domain/address'
import type { Floor, Rack, RackRun, RackTemplate, Row } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useWarehouseStore } from '@/store/useWarehouseStore'

type DragData =
  | { type: 'template'; templateId: string }
  | { type: 'rack'; rowId: string; index: number; templateId: string }
  | { type: 'row'; rowId: string; length: number }

// Сначала — стеллаж под курсором (вставка перед ним), иначе — ряд целиком (в конец).
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const racks = hits.filter(
    (h) => (h.data?.droppableContainer?.data.current as DragData | undefined)?.type === 'rack',
  )
  if (racks.length) return racks
  return hits.length ? hits : closestCenter(args)
}

/** B1: дерево зданий/этажей + план этажа + палитра шаблонов. */
export function LayoutPlanPage() {
  const buildings = useWarehouseStore((s) => s.buildings)
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const addBuilding = useWarehouseStore((s) => s.addBuilding)
  const addRack = useWarehouseStore((s) => s.addRack)
  const moveRack = useWarehouseStore((s) => s.moveRack)
  const [params, setParams] = useSearchParams()
  const [dragging, setDragging] = useState<DragData | null>(null)

  const building = buildings.find((b) => b.id === params.get('b')) ?? buildings[0]
  const floor = building?.floors.find((f) => f.id === params.get('f')) ?? building?.floors[0]
  const select = (b: string, f?: string) => setParams(f ? { b, f } : { b }, { replace: true })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (e: DragStartEvent) => setDragging(e.active.data.current as DragData)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    const a = active.data.current as DragData | undefined
    const o = over?.data.current as DragData | undefined
    if (!a || !o) return
    const target =
      o.type === 'rack'
        ? { rowId: o.rowId, index: o.index }
        : o.type === 'row'
          ? { rowId: o.rowId, index: o.length }
          : null
    if (!target) return
    if (a.type === 'template') addRack(target.rowId, a.templateId, target.index)
    if (a.type === 'rack') moveRack(a.rowId, a.index, target.rowId, target.index)
  }

  const draggingTemplate =
    dragging && dragging.type !== 'row'
      ? templates.find((t) => t.id === dragging.templateId)
      : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="grid items-start gap-4 lg:grid-cols-[250px_1fr_200px]">
        <BuildingTree
          selectedFloorId={floor?.id}
          onSelect={select}
          onAddBuilding={() => select(addBuilding())}
        />

        {building && floor ? (
          <FloorPlan
            buildingIndex={buildings.indexOf(building)}
            buildingId={building.id}
            buildingName={building.name}
            floor={floor}
            floorIndex={building.floors.indexOf(floor)}
            templates={templates}
          />
        ) : (
          <Card className="items-center py-16">
            <p className="text-muted-foreground">
              {building ? 'В здании нет этажей.' : 'Нет ни одного здания.'}
            </p>
            {!building && (
              <Button onClick={() => select(addBuilding())}>
                <PlusIcon /> Добавить здание
              </Button>
            )}
          </Card>
        )}

        <Palette templates={templates} />
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingTemplate && (
          <RackBlock template={draggingTemplate} className="rotate-2 shadow-lg ring-2 ring-primary" />
        )}
      </DragOverlay>
    </DndContext>
  )
}

function BuildingTree({
  selectedFloorId,
  onSelect,
  onAddBuilding,
}: {
  selectedFloorId?: string
  onSelect: (buildingId: string, floorId?: string) => void
  onAddBuilding: () => void
}) {
  const buildings = useWarehouseStore((s) => s.buildings)
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const addFloor = useWarehouseStore((s) => s.addFloor)
  const removeBuilding = useWarehouseStore((s) => s.removeBuilding)
  const duplicateFloor = useWarehouseStore((s) => s.duplicateFloor)
  const removeFloor = useWarehouseStore((s) => s.removeFloor)
  const tpl = templateMap(templates)

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex items-center justify-between px-4">
        <CardTitle className="text-base">Здания</CardTitle>
        <Button size="sm" onClick={onAddBuilding}>
          <PlusIcon /> Здание
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 px-2">
        {buildings.map((b) => (
          <div key={b.id}>
            <div className="group flex items-center gap-1.5 px-2 py-1 text-sm font-medium">
              <BuildingIcon className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{b.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs">
                    <EllipsisIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      const f = addFloor(b.id)
                      if (f) onSelect(b.id, f)
                    }}
                  >
                    <LayersIcon /> Добавить этаж
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => removeBuilding(b.id)}>
                    <Trash2Icon /> Удалить здание
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="ml-4 space-y-0.5 border-l pl-2">
              {/* Этажи сверху вниз — как в здании. */}
              {[...b.floors].reverse().map((f) => (
                <div
                  key={f.id}
                  className={cn(
                    'group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-accent',
                    f.id === selectedFloorId && 'bg-primary/10 font-medium text-primary',
                  )}
                  onClick={() => onSelect(b.id, f.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{f.name}</div>
                    <StatsLine stats={floorStats(f, tpl)} show={['rows', 'racks']} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-xs">
                        <EllipsisIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={() => {
                          const id = duplicateFloor(f.id)
                          if (id) onSelect(b.id, id)
                        }}
                      >
                        <CopyIcon /> Дублировать этаж
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => removeFloor(f.id)}>
                        <Trash2Icon /> Удалить этаж
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const f = addFloor(b.id)
                  if (f) onSelect(b.id, f)
                }}
                className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                <PlusIcon className="size-3" /> этаж
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FloorPlan({
  buildingIndex,
  buildingId,
  buildingName,
  floor,
  floorIndex,
  templates,
}: {
  buildingIndex: number
  buildingId: string
  buildingName: string
  floor: Floor
  floorIndex: number
  templates: RackTemplate[]
}) {
  const renameBuilding = useWarehouseStore((s) => s.renameBuilding)
  const renameFloor = useWarehouseStore((s) => s.renameFloor)
  const addRow = useWarehouseStore((s) => s.addRow)
  const tpl = templateMap(templates)
  const [openRack, setOpenRack] = useState<{ rack: Rack; loc: RackLocation } | null>(null)

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-wrap items-center gap-2 px-4">
        <div className="flex items-center gap-1 text-base font-semibold">
          <EditableText value={buildingName} onChange={(v) => renameBuilding(buildingId, v)} />
          <span className="text-muted-foreground">›</span>
          <EditableText value={floor.name} onChange={(v) => renameFloor(floor.id, v)} />
        </div>
        <StatsLine stats={floorStats(floor, tpl)} show={['rows', 'racks', 'cells']} />
        <Button size="sm" className="ml-auto" onClick={() => addRow(floor.id)}>
          <PlusIcon /> Ряд
        </Button>
      </CardHeader>
      <CardContent className="px-4">
        {/* «Пол» этажа: сетка, ряды — дорожки, между ними проходы. */}
        <div className="space-y-3 rounded-lg border bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] p-3">
          {floor.rows.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              На этаже нет рядов — нажмите «+ Ряд».
            </div>
          )}
          {floor.rows.map((row, ri) => (
            <RowLane
              key={row.id}
              row={row}
              rowIndex={ri}
              tpl={tpl}
              onOpenRack={(rack, k) =>
                setOpenRack({ rack, loc: { b: buildingIndex, f: floorIndex, r: ri, k } })
              }
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Перетаскивайте шаблоны из палитры в ряд, стеллажи — внутри ряда и между рядами. Клик по
          стеллажу — подробности.
        </p>
      </CardContent>

      <RackDialog
        editable
        rack={openRack ? findRack(floor, openRack.rack.id) ?? null : null}
        location={openRack?.loc ?? null}
        onOpenChange={(open) => !open && setOpenRack(null)}
      />
    </Card>
  )
}

function findRack(floor: Floor, rackId: string) {
  for (const r of floor.rows) {
    const k = r.racks.find((x) => x.id === rackId)
    if (k) return k
  }
}

function RowLane({
  row,
  rowIndex,
  tpl,
  onOpenRack,
}: {
  row: Row
  rowIndex: number
  tpl: Map<string, RackTemplate>
  onOpenRack: (rack: Rack, index: number) => void
}) {
  const renameRow = useWarehouseStore((s) => s.renameRow)
  const duplicateRow = useWarehouseStore((s) => s.duplicateRow)
  const removeRow = useWarehouseStore((s) => s.removeRow)
  const fillRow = useWarehouseStore((s) => s.fillRow)
  const addRack = useWarehouseStore((s) => s.addRack)
  const [fillOpen, setFillOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: `row:${row.id}`,
    data: { type: 'row', rowId: row.id, length: row.racks.length } satisfies DragData,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-stretch gap-3 rounded-lg border bg-white/85 p-2 shadow-xs transition-colors',
        isOver && 'border-primary bg-primary/5 ring-2 ring-primary/30',
      )}
    >
      <div className="flex w-32 shrink-0 flex-col justify-between gap-1 border-r pr-2">
        <div>
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
            Р{rowIndex + 1}
          </div>
          <EditableText
            value={row.name}
            onChange={(v) => renameRow(row.id, v)}
            className="text-sm font-medium"
            inputClassName="w-28"
          />
          <StatsLine stats={rowStats(row, tpl)} show={['racks', 'cells']} className="block" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="xs" className="self-start">
              <EllipsisIcon /> Действия
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFillOpen(true)}>
              <ListPlusIcon /> Заполнить ряд…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateRow(row.id)}>
              <CopyIcon /> Дублировать ряд
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fillRow(row.id, [], 'replace')}>
              <EraserIcon /> Очистить
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => removeRow(row.id)}>
              <Trash2Icon /> Удалить ряд
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-28 flex-1 items-end gap-2 overflow-x-auto pb-1">
        <SortableContext items={row.racks.map((k) => k.id)} strategy={horizontalListSortingStrategy}>
          {row.racks.map((rack, k) => (
            <SortableRack
              key={rack.id}
              rack={rack}
              index={k}
              rowId={row.id}
              template={tpl.get(rack.templateId)}
              onClick={() => onOpenRack(rack, k)}
            />
          ))}
        </SortableContext>
        <TemplatePicker onSelect={(id) => addRack(row.id, id)}>
          <button
            type="button"
            title="Добавить стеллаж"
            className="flex h-[104px] w-14 shrink-0 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <PlusIcon />
          </button>
        </TemplatePicker>
      </div>

      <FillRowDialog
        open={fillOpen}
        onOpenChange={setFillOpen}
        rowName={row.name}
        onApply={(runs, mode) => fillRow(row.id, runs, mode)}
      />
    </div>
  )
}

function SortableRack({
  rack,
  index,
  rowId,
  template,
  onClick,
}: {
  rack: Rack
  index: number
  rowId: string
  template: RackTemplate | undefined
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rack.id,
    data: { type: 'rack', rowId, index, templateId: rack.templateId } satisfies DragData,
  })
  return (
    <RackBlock
      ref={setNodeRef}
      template={template}
      label={`С${index + 1}`}
      title={template?.name ?? 'нет шаблона'}
      onClick={onClick}
      className={cn(
        'cursor-grab hover:ring-2 hover:ring-primary/40 active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    />
  )
}

function PaletteItem({ template }: { template: RackTemplate }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tpl:${template.id}`,
    data: { type: 'template', templateId: template.id } satisfies DragData,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-md border bg-white p-2 hover:border-primary active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      <RackFacade shelves={template.shelves} size="xs" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{template.name}</span>
    </div>
  )
}

function Palette({ templates }: { templates: RackTemplate[] }) {
  return (
    <Card className="gap-3 py-4 lg:sticky lg:top-20">
      <CardHeader className="px-4">
        <CardTitle className="text-base">Палитра</CardTitle>
        <CardDescription>Перетащите шаблон в ряд</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-3">
        {templates.map((t) => (
          <PaletteItem key={t.id} template={t} />
        ))}
        {templates.length === 0 && (
          <p className="text-xs text-muted-foreground">Шаблонов нет — создайте их на вкладке «Шаблоны».</p>
        )}
      </CardContent>
    </Card>
  )
}

function FillRowDialog({
  open,
  onOpenChange,
  rowName,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rowName: string
  onApply: (runs: RackRun[], mode: 'replace' | 'append') => void
}) {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const [runs, setRuns] = useState<RackRun[]>(() =>
    templates[0] ? [{ templateId: templates[0].id, count: 4 }] : [],
  )

  const apply = (mode: 'replace' | 'append') => {
    onApply(runs, mode)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заполнить «{rowName}»</DialogTitle>
          <DialogDescription>Задайте состав ряда группами: шаблон × количество.</DialogDescription>
        </DialogHeader>
        <RackRunsEditor value={runs} onChange={setRuns} />
        <DialogFooter>
          <Button variant="outline" onClick={() => apply('append')}>
            Добавить в конец
          </Button>
          <Button onClick={() => apply('replace')}>Заменить ряд</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
