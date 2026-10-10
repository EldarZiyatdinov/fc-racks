import { useState } from 'react'
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NumberStepper } from '@/components/NumberStepper'
import { RackFacade } from '@/components/rack/RackFacade'
import { TemplateList } from '@/components/templates/TemplateList'
import { TemplateMetaCard } from '@/components/templates/TemplateMetaCard'
import { useSelectedTemplate } from '@/hooks/useSelectedTemplate'
import { useWarehouseStore } from '@/store/useWarehouseStore'
import { EmptyTemplates } from './TemplatesVisualPage'

/** A2: тот же шаблон, но через таблицу полок с живым превью. */
export function TemplatesFormPage() {
  const { templates, selected, select } = useSelectedTemplate()
  const addTemplate = useWarehouseStore((s) => s.addTemplate)
  const addShelf = useWarehouseStore((s) => s.addShelf)
  const removeShelf = useWarehouseStore((s) => s.removeShelf)
  const duplicateShelf = useWarehouseStore((s) => s.duplicateShelf)
  const moveShelf = useWarehouseStore((s) => s.moveShelf)
  const setCells = useWarehouseStore((s) => s.setCells)
  const applyPreset = useWarehouseStore((s) => s.applyPreset)
  const [allCells, setAllCells] = useState(3)

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr_320px]">
      <TemplateList templates={templates} selectedId={selected?.id} onSelect={select} />

      {selected ? (
        <>
          <div className="space-y-4">
            <Card className="gap-4 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-base">Полки: {selected.name}</CardTitle>
                <CardDescription>Строки идут сверху вниз — как полки на стеллаже.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Полка</TableHead>
                      <TableHead>Ячеек</TableHead>
                      <TableHead className="hidden md:table-cell">Вид</TableHead>
                      <TableHead className="w-32 text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.shelves
                      .map((shelf, index) => ({ shelf, index }))
                      .reverse()
                      .map(({ shelf, index }) => {
                        const last = selected.shelves.length - 1
                        return (
                          <TableRow key={shelf.id}>
                            <TableCell className="font-medium">
                              {index + 1}
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                {index === last && last > 0 ? 'верх' : index === 0 ? 'низ' : ''}
                              </span>
                            </TableCell>
                            <TableCell>
                              <NumberStepper
                                min={1}
                                max={50}
                                value={shelf.cells}
                                onChange={(n) => setCells(selected.id, shelf.id, n)}
                              />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex w-40 gap-0.5">
                                {Array.from({ length: shelf.cells }, (_, i) => (
                                  <div
                                    key={i}
                                    className="h-4 flex-1 rounded-[2px]"
                                    style={{ backgroundColor: selected.color }}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                title="Поднять выше"
                                disabled={index === last}
                                onClick={() => moveShelf(selected.id, shelf.id, 'up')}
                              >
                                <ArrowUpIcon />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                title="Опустить ниже"
                                disabled={index === 0}
                                onClick={() => moveShelf(selected.id, shelf.id, 'down')}
                              >
                                <ArrowDownIcon />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                title="Дублировать"
                                onClick={() => duplicateShelf(selected.id, shelf.id)}
                              >
                                <CopyIcon />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                title="Удалить"
                                className="text-destructive"
                                disabled={selected.shelves.length <= 1}
                                onClick={() => removeShelf(selected.id, shelf.id)}
                              >
                                <Trash2Icon />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => addShelf(selected.id, 'top')}>
                    <PlusIcon /> Полка сверху
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addShelf(selected.id, 'bottom')}
                  >
                    <PlusIcon /> Полка снизу
                  </Button>
                  <div className="ml-auto flex items-center gap-2 text-sm">
                    Всем полкам по
                    <NumberStepper min={1} max={50} value={allCells} onChange={setAllCells} />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        applyPreset(
                          selected.id,
                          selected.shelves.map(() => allCells),
                        )
                      }
                    >
                      Применить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <TemplateMetaCard template={selected} onSelect={select} />
          </div>

          <Card className="items-center gap-4 py-4 lg:sticky lg:top-20">
            <CardHeader className="w-full px-4">
              <CardTitle className="text-base">Превью</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <RackFacade
                shelves={selected.shelves}
                color={selected.color}
                size="md"
                showCellNumbers
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyTemplates onCreate={() => select(addTemplate())} />
      )}
    </div>
  )
}
