import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NumberStepper } from '@/components/NumberStepper'
import { RackRunsEditor } from '@/components/layout/RackRunsEditor'
import { StatsLine } from '@/components/StatsLine'
import { templateCells } from '@/domain/address'
import type { RackRun } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useWarehouseStore, type GenerateSpec } from '@/store/useWarehouseStore'

type WizardFloor = { rows: number; runs: RackRun[] | null } // null — общий состав
type WizardBuilding = { name: string; floors: WizardFloor[] }

const STEPS = ['Здания', 'Этажи', 'Ряды', 'Состав рядов', 'Итог']

const newFloor = (rows = 3): WizardFloor => ({ rows, runs: null })
const newBuilding = (n: number): WizardBuilding => ({ name: `Здание ${n}`, floors: [newFloor()] })

function resize<T>(list: T[], n: number, make: (i: number) => T): T[] {
  return n <= list.length ? list.slice(0, n) : [...list, ...Array.from({ length: n - list.length }, (_, i) => make(list.length + i))]
}

/** B2: пошаговая массовая генерация зданий, этажей и рядов. */
export function LayoutWizardPage() {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const existing = useWarehouseStore((s) => s.buildings.length)
  const generate = useWarehouseStore((s) => s.generate)
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [buildings, setBuildings] = useState<WizardBuilding[]>([newBuilding(1), newBuilding(2)])
  const [defaultRuns, setDefaultRuns] = useState<RackRun[]>(() =>
    templates[0] ? [{ templateId: templates[0].id, count: 4 }] : [],
  )
  const [allFloors, setAllFloors] = useState(2)
  const [allRows, setAllRows] = useState(3)
  const [mode, setMode] = useState<'replace' | 'append'>('replace')

  const updateBuilding = (bi: number, patch: Partial<WizardBuilding>) =>
    setBuildings((list) => list.map((b, i) => (i === bi ? { ...b, ...patch } : b)))
  const updateFloor = (bi: number, fi: number, patch: Partial<WizardFloor>) =>
    setBuildings((list) =>
      list.map((b, i) =>
        i === bi ? { ...b, floors: b.floors.map((f, j) => (j === fi ? { ...f, ...patch } : f)) } : b,
      ),
    )

  const runsOf = (f: WizardFloor) => f.runs ?? defaultRuns
  const tplCells = new Map(templates.map((t) => [t.id, templateCells(t)]))
  const runRacks = (runs: RackRun[]) => runs.reduce((s, r) => s + r.count, 0)
  const runCells = (runs: RackRun[]) =>
    runs.reduce((s, r) => s + r.count * (tplCells.get(r.templateId) ?? 0), 0)
  const totals = buildings.reduce(
    (acc, b) => {
      for (const f of b.floors) {
        acc.floors++
        acc.rows += f.rows
        acc.racks += f.rows * runRacks(runsOf(f))
        acc.cells += f.rows * runCells(runsOf(f))
      }
      return acc
    },
    { floors: 0, rows: 0, racks: 0, cells: 0 },
  )

  const create = () => {
    const spec: GenerateSpec = {
      buildings: buildings.map((b) => ({
        name: b.name,
        floors: b.floors.map((f, fi) => ({
          name: `Этаж ${fi + 1}`,
          rows: Array.from({ length: f.rows }, (_, ri) => ({
            name: `Ряд ${ri + 1}`,
            racks: runsOf(f),
          })),
        })),
      })),
    }
    generate(spec, mode)
    toast.success(`Создано: ${buildings.length} зд., ${totals.racks} стеллажей`)
    navigate('/layout')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Шаги */}
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((title, i) => (
          <button
            key={title}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              'flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm transition-colors',
              i === step && 'border-primary bg-primary text-primary-foreground',
              i < step && 'border-primary/40 text-primary',
            )}
          >
            <span
              className={cn(
                'flex size-5 items-center justify-center rounded-full bg-muted text-xs text-foreground',
                i === step && 'bg-primary-foreground text-primary',
              )}
            >
              {i < step ? <CheckIcon className="size-3" /> : i + 1}
            </span>
            {title}
          </button>
        ))}
        <StatsLine stats={totals} className="ml-auto" />
      </div>

      <Card className="gap-4 py-5">
        {step === 0 && (
          <>
            <CardHeader className="px-5">
              <CardTitle>Сколько зданий?</CardTitle>
              <CardDescription>Задайте количество и названия.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5">
              <NumberStepper
                min={1}
                max={20}
                value={buildings.length}
                onChange={(n) => setBuildings((list) => resize(list, n, (i) => newBuilding(i + 1)))}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {buildings.map((b, bi) => (
                  <Input
                    key={bi}
                    value={b.name}
                    onChange={(e) => updateBuilding(bi, { name: e.target.value })}
                  />
                ))}
              </div>
            </CardContent>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader className="px-5">
              <CardTitle>Этажи в зданиях</CardTitle>
              <CardDescription>У каждого здания может быть своё число этажей.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5">
              <BulkSet
                label="Всем зданиям по"
                value={allFloors}
                onValue={setAllFloors}
                onApply={() =>
                  setBuildings((list) =>
                    list.map((b) => ({ ...b, floors: resize(b.floors, allFloors, () => newFloor()) })),
                  )
                }
              />
              {buildings.map((b, bi) => (
                <div key={bi} className="flex items-center gap-4 rounded-md border p-3">
                  <span className="w-40 truncate font-medium">{b.name}</span>
                  <NumberStepper
                    min={1}
                    max={20}
                    value={b.floors.length}
                    onChange={(n) =>
                      updateBuilding(bi, { floors: resize(b.floors, n, () => newFloor()) })
                    }
                  />
                  <FloorStack floors={b.floors.length} />
                </div>
              ))}
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="px-5">
              <CardTitle>Ряды на этажах</CardTitle>
              <CardDescription>Сколько рядов стеллажей на каждом этаже.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5">
              <BulkSet
                label="Всем этажам по"
                value={allRows}
                onValue={setAllRows}
                onApply={() =>
                  setBuildings((list) =>
                    list.map((b) => ({ ...b, floors: b.floors.map((f) => ({ ...f, rows: allRows })) })),
                  )
                }
              />
              {buildings.map((b, bi) => (
                <div key={bi} className="rounded-md border p-3">
                  <div className="mb-2 font-medium">{b.name}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {b.floors.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-3">
                        <span className="w-16 text-sm text-muted-foreground">Этаж {fi + 1}</span>
                        <NumberStepper
                          min={0}
                          max={50}
                          value={f.rows}
                          onChange={(n) => updateFloor(bi, fi, { rows: n })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="px-5">
              <CardTitle>Состав рядов</CardTitle>
              <CardDescription>
                Общий состав применяется ко всем рядам. Для отдельного этажа можно задать свой.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5">
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="mb-2 text-sm font-medium">Общий состав ряда</div>
                <RackRunsEditor value={defaultRuns} onChange={setDefaultRuns} />
              </div>
              {buildings.map((b, bi) =>
                b.floors.map((f, fi) => (
                  <div key={`${bi}-${fi}`} className="rounded-md border p-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={f.runs !== null}
                        onChange={(e) =>
                          updateFloor(bi, fi, { runs: e.target.checked ? [...defaultRuns] : null })
                        }
                      />
                      <span className="font-medium">
                        {b.name} › Этаж {fi + 1}
                      </span>
                      <span className="text-muted-foreground">
                        — {f.runs ? 'свой состав' : 'общий состав'}, {f.rows} ряд(ов)
                      </span>
                    </label>
                    {f.runs && (
                      <div className="mt-3">
                        <RackRunsEditor value={f.runs} onChange={(runs) => updateFloor(bi, fi, { runs })} />
                      </div>
                    )}
                  </div>
                )),
              )}
            </CardContent>
          </>
        )}

        {step === 4 && (
          <>
            <CardHeader className="px-5">
              <CardTitle>Итог</CardTitle>
              <CardDescription>
                <StatsLine stats={totals} className="text-sm" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {buildings.map((b, bi) => (
                  <div key={bi} className="rounded-md border p-3">
                    <div className="mb-2 font-medium">{b.name}</div>
                    <div className="flex flex-col-reverse gap-1.5">
                      {b.floors.map((f, fi) => (
                        <div key={fi} className="rounded border bg-muted/40 p-1.5">
                          <div className="mb-1 text-[11px] text-muted-foreground">Этаж {fi + 1}</div>
                          <div className="space-y-0.5">
                            {Array.from({ length: f.rows }, (_, ri) => (
                              <RunsStrip key={ri} runs={runsOf(f)} />
                            ))}
                            {f.rows === 0 && <div className="text-[11px] text-muted-foreground">нет рядов</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Существующие здания ({existing}):</span>
                <Button
                  size="sm"
                  variant={mode === 'replace' ? 'default' : 'outline'}
                  onClick={() => setMode('replace')}
                >
                  заменить
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'append' ? 'default' : 'outline'}
                  onClick={() => setMode('append')}
                >
                  оставить и добавить новые
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeftIcon /> Назад
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            Далее <ArrowRightIcon />
          </Button>
        ) : (
          <Button onClick={create} disabled={templates.length === 0}>
            <SparklesIcon /> Создать
          </Button>
        )}
      </div>
    </div>
  )
}

function BulkSet({
  label,
  value,
  onValue,
  onApply,
}: {
  label: string
  value: number
  onValue: (n: number) => void
  onApply: () => void
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {label}
      <NumberStepper min={1} max={50} value={value} onChange={onValue} />
      <Button variant="secondary" size="sm" onClick={onApply}>
        Применить
      </Button>
    </div>
  )
}

/** Схематичное здание: этажи стопкой. */
function FloorStack({ floors }: { floors: number }) {
  return (
    <div className="ml-auto flex flex-col gap-0.5">
      {Array.from({ length: floors }, (_, i) => (
        <div key={i} className="h-2 w-16 rounded-[2px] bg-slate-300" />
      ))}
    </div>
  )
}

function RunsStrip({ runs }: { runs: RackRun[] }) {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const color = new Map(templates.map((t) => [t.id, t.color]))
  return (
    <div className="flex gap-px">
      {runs.flatMap((r, i) =>
        Array.from({ length: r.count }, (_, j) => (
          <div
            key={`${i}-${j}`}
            className="h-2.5 w-2 rounded-[1px]"
            style={{ backgroundColor: color.get(r.templateId) ?? '#ccc' }}
          />
        )),
      )}
    </div>
  )
}
