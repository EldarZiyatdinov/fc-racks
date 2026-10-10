import { Fragment, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { StatsLine } from '@/components/StatsLine'
import { RackDialog, type RackLocation } from '@/components/rack/RackDialog'
import { RackFacade } from '@/components/rack/RackFacade'
import { TemplateSwatch } from '@/components/rack/TemplateSwatch'
import {
  buildingStats,
  cellAddress,
  floorStats,
  rackAddress,
  rowStats,
  templateCells,
  templateMap,
  totalStats,
} from '@/domain/address'
import type { Building, Floor, Rack, RackTemplate, Row } from '@/domain/types'
import { useWarehouseStore } from '@/store/useWarehouseStore'

type TplMap = Map<string, RackTemplate>

/** V1: просмотр «сверху вниз» — здания → этажи → план этажа → фасад ряда. */
export function ViewerPage() {
  const { buildingId, floorId, rowId } = useParams()
  const buildings = useWarehouseStore((s) => s.buildings)
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const tpl = templateMap(templates)

  const bi = buildings.findIndex((b) => b.id === buildingId)
  const building = buildings[bi]
  const fi = building ? building.floors.findIndex((f) => f.id === floorId) : -1
  const floor = building?.floors[fi]
  const ri = floor ? floor.rows.findIndex((r) => r.id === rowId) : -1
  const row = floor?.rows[ri]

  const crumbs: { label: string; to?: string }[] = [{ label: 'Все здания', to: '/view' }]
  if (building) crumbs.push({ label: building.name, to: `/view/${building.id}` })
  if (building && floor) crumbs.push({ label: floor.name, to: `/view/${building.id}/${floor.id}` })
  if (row) crumbs.push({ label: row.name })
  crumbs[crumbs.length - 1].to = undefined

  const notFound =
    (buildingId && !building) || (floorId && !floor) || (rowId && !row)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {c.to ? (
                    <BreadcrumbLink asChild>
                      <Link to={c.to}>{c.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <Legend templates={templates} />
      </div>

      {notFound ? (
        <Card className="items-center py-16 text-muted-foreground">
          Объект не найден — возможно, данные изменились.{' '}
          <Link to="/view" className="text-primary underline">
            К списку зданий
          </Link>
        </Card>
      ) : row && floor && building ? (
        <RowView row={row} loc={{ b: bi, f: fi, r: ri }} tpl={tpl} />
      ) : floor && building ? (
        <FloorView building={building} floor={floor} loc={{ b: bi, f: fi }} tpl={tpl} />
      ) : building ? (
        <BuildingView building={building} tpl={tpl} />
      ) : (
        <BuildingsView buildings={buildings} tpl={tpl} />
      )}
    </div>
  )
}

function Legend({ templates }: { templates: RackTemplate[] }) {
  return (
    <div className="ml-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
      {templates.map((t) => (
        <span key={t.id} className="flex items-center gap-1">
          <TemplateSwatch color={t.color} />
          {t.name} ({templateCells(t)} яч.)
        </span>
      ))}
    </div>
  )
}

/** Мини-план этажа: ряды — полоски, стеллажи — цветные квадратики. */
function MiniPlan({ floor, tpl }: { floor: Floor; tpl: TplMap }) {
  return (
    <div className="space-y-1">
      {floor.rows.map((r) => (
        <div key={r.id} className="flex h-3 gap-px">
          {r.racks.map((k) => (
            <div
              key={k.id}
              className="w-2.5 rounded-[1px]"
              style={{ backgroundColor: tpl.get(k.templateId)?.color ?? '#ccc' }}
            />
          ))}
          {r.racks.length === 0 && <div className="w-full rounded-[1px] border border-dashed" />}
        </div>
      ))}
      {floor.rows.length === 0 && <div className="text-[11px] text-muted-foreground">нет рядов</div>}
    </div>
  )
}

function BuildingsView({ buildings, tpl }: { buildings: Building[]; tpl: TplMap }) {
  if (buildings.length === 0)
    return (
      <Card className="items-center py-16 text-muted-foreground">
        Зданий нет — создайте их на вкладке «Расстановка».
      </Card>
    )
  return (
    <div className="space-y-4">
      <StatsLine stats={totalStats(buildings, tpl)} className="text-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {buildings.map((b) => (
          <Link key={b.id} to={`/view/${b.id}`} className="group">
            <Card className="h-full gap-3 py-4 transition-shadow group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/30">
              <CardHeader className="px-4">
                <CardTitle>{b.name}</CardTitle>
                <StatsLine stats={buildingStats(b, tpl)} />
              </CardHeader>
              <CardContent className="px-4">
                {/* Схематичное здание: крыша и этажи стопкой (верхний этаж сверху). */}
                <div className="mx-auto h-4 w-[92%] [clip-path:polygon(4%_100%,50%_0,96%_100%)] bg-slate-400" />
                <div className="flex flex-col-reverse gap-1 rounded-b-md border-2 border-t-0 border-slate-400 bg-slate-50 p-2">
                  {b.floors.map((f) => (
                    <div key={f.id} className="rounded border bg-white p-1.5">
                      <div className="mb-1 text-[11px] text-muted-foreground">{f.name}</div>
                      <MiniPlan floor={f} tpl={tpl} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function BuildingView({ building, tpl }: { building: Building; tpl: TplMap }) {
  return (
    <div className="space-y-3">
      <StatsLine stats={buildingStats(building, tpl)} className="text-sm" />
      {[...building.floors].reverse().map((f) => (
        <Link key={f.id} to={`/view/${building.id}/${f.id}`} className="group block">
          <Card className="gap-2 py-3 transition-shadow group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/30">
            <CardHeader className="flex items-baseline gap-3 px-4">
              <CardTitle className="text-base">{f.name}</CardTitle>
              <StatsLine stats={floorStats(f, tpl)} show={['rows', 'racks', 'cells']} />
            </CardHeader>
            <CardContent className="px-4">
              <MiniPlan floor={f} tpl={tpl} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function FloorView({
  building,
  floor,
  loc,
  tpl,
}: {
  building: Building
  floor: Floor
  loc: { b: number; f: number }
  tpl: TplMap
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">План: {floor.name}</CardTitle>
        <StatsLine stats={floorStats(floor, tpl)} show={['rows', 'racks', 'cells']} />
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-3 rounded-lg border bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] p-3">
          {floor.rows.map((r, ri) => (
            <Link
              key={r.id}
              to={`/view/${building.id}/${floor.id}/${r.id}`}
              className="flex items-end gap-3 rounded-lg border bg-white/85 p-2 transition-shadow hover:shadow-md hover:ring-2 hover:ring-primary/30"
            >
              <div className="w-28 shrink-0 self-stretch border-r pr-2">
                <div className="font-mono text-[10px] text-muted-foreground">
                  З{loc.b + 1}-Э{loc.f + 1}-Р{ri + 1}
                </div>
                <div className="text-sm font-medium">{r.name}</div>
                <StatsLine stats={rowStats(r, tpl)} show={['racks', 'cells']} className="block" />
              </div>
              <div className="flex items-end gap-2 overflow-x-auto pb-1">
                {r.racks.map((k, ki) => {
                  const t = tpl.get(k.templateId)
                  return (
                    <div key={k.id} className="flex flex-col items-center gap-0.5">
                      {t && <RackFacade shelves={t.shelves} color={t.color} size="sm" />}
                      <span className="text-[10px] text-muted-foreground">С{ki + 1}</span>
                    </div>
                  )
                })}
                {r.racks.length === 0 && (
                  <span className="text-sm text-muted-foreground">пустой ряд</span>
                )}
              </div>
            </Link>
          ))}
          {floor.rows.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">На этаже нет рядов</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RowView({
  row,
  loc,
  tpl,
}: {
  row: Row
  loc: { b: number; f: number; r: number }
  tpl: TplMap
}) {
  const [open, setOpen] = useState<{ rack: Rack; loc: RackLocation } | null>(null)
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">
          Фасад ряда: {row.name}{' '}
          <span className="font-mono text-sm font-normal text-muted-foreground">
            З{loc.b + 1}-Э{loc.f + 1}-Р{loc.r + 1}
          </span>
        </CardTitle>
        <StatsLine stats={rowStats(row, tpl)} show={['racks', 'cells']} />
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <div className="inline-flex items-end gap-1 border-b-4 border-slate-300 px-2 pb-0">
            {row.racks.map((k, ki) => {
              const t = tpl.get(k.templateId)
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setOpen({ rack: k, loc: { ...loc, k: ki } })}
                  className="flex flex-col items-center gap-1 rounded-md p-1 transition-colors hover:bg-primary/5"
                >
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {rackAddress(loc.b, loc.f, loc.r, ki)}
                  </span>
                  {t ? (
                    <RackFacade
                      shelves={t.shelves}
                      color={t.color}
                      size="md"
                      cellTitle={(p, c) => cellAddress(loc.b, loc.f, loc.r, ki, p, c)}
                    />
                  ) : (
                    <span className="text-xs text-destructive">нет шаблона</span>
                  )}
                  <span className="max-w-[150px] truncate text-xs">{t?.name}</span>
                </button>
              )
            })}
          </div>
        </div>
        {row.racks.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Ряд пустой</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Наведите на ячейку — увидите её адрес. Клик по стеллажу — карточка с полками.
        </p>
      </CardContent>
      <RackDialog
        rack={open?.rack ?? null}
        location={open?.loc ?? null}
        onOpenChange={(o) => !o && setOpen(null)}
      />
    </Card>
  )
}
