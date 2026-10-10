import { useMemo, useRef, useState } from 'react'
import { CheckCircle2Icon, CopyIcon, DownloadIcon, FileUpIcon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StatsLine } from '@/components/StatsLine'
import { expandCells, templateMap, totalStats } from '@/domain/address'
import { warehouseSchema } from '@/domain/schema'
import type { WarehouseData } from '@/domain/types'
import { useWarehouseStore } from '@/store/useWarehouseStore'

type Parsed =
  | { ok: true; data: WarehouseData }
  | { ok: false; errors: string[] }

function parse(text: string): Parsed {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { ok: false, errors: [`Некорректный JSON: ${(e as Error).message}`] }
  }
  const result = warehouseSchema.safeParse(raw)
  if (result.success) return { ok: true, data: result.data }
  return {
    ok: false,
    errors: result.error.issues
      .slice(0, 20)
      .map((i) => `${i.path.join('.') || '(корень)'}: ${i.message}`),
  }
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** Экспорт текущих данных в JSON и восстановление из JSON. */
export function JsonPage() {
  const rackTemplates = useWarehouseStore((s) => s.rackTemplates)
  const buildings = useWarehouseStore((s) => s.buildings)
  const importData = useWarehouseStore((s) => s.importData)

  const json = useMemo(
    () => JSON.stringify({ version: 1, rackTemplates, buildings } satisfies WarehouseData, null, 2),
    [rackTemplates, buildings],
  )
  const expanded = useMemo(
    () => JSON.stringify(expandCells({ rackTemplates, buildings }), null, 2),
    [rackTemplates, buildings],
  )

  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const check = (value: string) => {
    setText(value)
    setParsed(value.trim() ? parse(value) : null)
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">Экспорт</CardTitle>
          <CardDescription>
            <StatsLine stats={totalStats(buildings, templateMap(rackTemplates))} />
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          <Tabs defaultValue="data">
            <div className="flex flex-wrap items-center gap-2">
              <TabsList>
                <TabsTrigger value="data">Данные</TabsTrigger>
                <TabsTrigger value="cells">Все ячейки</TabsTrigger>
              </TabsList>
            </div>
            {(
              [
                ['data', json, 'fc-racks.json', 'Иерархия зданий + шаблоны. Из этого JSON интерфейс восстанавливается целиком.'],
                ['cells', expanded, 'fc-racks-cells.json', 'Плоский список всех ячеек — только для чтения (например, для бэкенда/WMS). address — адрес по позициям, fullAddressId — по ID: здание/этаж/ряд/стеллаж/полка/номер ячейки; ID каждого уровня — отдельными полями.'],
              ] as const
            ).map(([value, content, file, hint]) => (
              <TabsContent key={value} value={value} className="space-y-2">
                <p className="text-xs text-muted-foreground">{hint}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(content).then(
                        () => toast.success('Скопировано'),
                        () => toast.error('Не удалось скопировать'),
                      )
                    }
                  >
                    <CopyIcon /> Копировать
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(file, content)}>
                    <DownloadIcon /> Скачать {file}
                  </Button>
                  {value === 'data' && (
                    <Button size="sm" variant="ghost" onClick={() => check(json)}>
                      В поле импорта →
                    </Button>
                  )}
                </div>
                <pre className="max-h-[60vh] overflow-auto rounded-md border bg-slate-950 p-3 font-mono text-xs text-slate-100">
                  {content}
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">Импорт / восстановление</CardTitle>
          <CardDescription>
            Вставьте JSON или загрузите файл — он будет проверен по схеме перед импортом.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) check(await file.text())
                e.target.value = ''
              }}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUpIcon /> Загрузить файл
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => check(e.target.value)}
            placeholder='{"version": 1, "rackTemplates": [...], "buildings": [...]}'
            className="h-80 font-mono text-xs"
          />

          {parsed && !parsed.ok && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <div className="mb-1 font-medium">Ошибки проверки:</div>
              <ul className="list-disc space-y-0.5 pl-5 font-mono text-xs">
                {parsed.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed?.ok && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm">
              <CheckCircle2Icon className="size-4 text-emerald-600" />
              <span>
                JSON корректен: {parsed.data.rackTemplates.length} шабл.,{' '}
                <StatsLine
                  stats={totalStats(parsed.data.buildings, templateMap(parsed.data.rackTemplates))}
                />
              </span>
              <ConfirmDialog
                title="Импортировать данные?"
                description="Текущие шаблоны и расстановка будут заменены данными из JSON."
                confirmText="Импортировать"
                onConfirm={() => {
                  importData(parsed.data)
                  toast.success('Данные восстановлены из JSON')
                  setText('')
                  setParsed(null)
                }}
              >
                <Button size="sm" className="ml-auto">
                  <UploadIcon /> Импортировать
                </Button>
              </ConfirmDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
