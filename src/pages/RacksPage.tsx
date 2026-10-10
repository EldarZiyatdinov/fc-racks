import { ArrowDownIcon, ArrowUpIcon, CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberStepper } from '@/components/NumberStepper'
import { RackFacade } from '@/components/rack/RackFacade'
import { PresetsCard } from '@/components/templates/PresetsCard'
import { TemplateList } from '@/components/templates/TemplateList'
import { TemplateMetaCard } from '@/components/templates/TemplateMetaCard'
import { useSelectedTemplate } from '@/hooks/useSelectedTemplate'
import { useWarehouseStore } from '@/store/useWarehouseStore'

/** Конструктор шаблонов стеллажей: фасад с полками и ячейками, пресеты и формула. */
export function RacksPage() {
  const { templates, selected, select } = useSelectedTemplate()
  const addTemplate = useWarehouseStore((s) => s.addTemplate)
  const addShelf = useWarehouseStore((s) => s.addShelf)
  const removeShelf = useWarehouseStore((s) => s.removeShelf)
  const duplicateShelf = useWarehouseStore((s) => s.duplicateShelf)
  const moveShelf = useWarehouseStore((s) => s.moveShelf)
  const setCells = useWarehouseStore((s) => s.setCells)

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr_320px]">
      <TemplateList templates={templates} selectedId={selected?.id} onSelect={select} />

      {selected ? (
        <>
          <Card className="gap-4 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">Конструктор: {selected.name}</CardTitle>
              <CardDescription>
                «+» внутри полки добавляет ячейку, справа — число ячеек, порядок, копия и удаление
                полки.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 overflow-x-auto px-4 pb-2">
              <Button variant="outline" size="sm" onClick={() => addShelf(selected.id, 'top')}>
                <PlusIcon /> Полка сверху
              </Button>

              <RackFacade
                shelves={selected.shelves}
                size="lg"
                renderShelfEnd={(shelf) => (
                  <button
                    type="button"
                    title="Добавить ячейку"
                    disabled={shelf.cells >= 50}
                    onClick={() => setCells(selected.id, shelf.id, shelf.cells + 1)}
                    className="flex w-7 shrink-0 items-center justify-center self-stretch rounded-sm border border-dashed border-slate-400 text-slate-500 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <PlusIcon className="size-4" />
                  </button>
                )}
                renderShelfAside={(shelf, index) => {
                  const last = selected.shelves.length - 1
                  return (
                    <div className="flex items-center gap-1 pl-3 opacity-70 transition-opacity group-hover/shelf:opacity-100">
                      <span className="w-14 text-xs text-muted-foreground">
                        Полка {index + 1}
                      </span>
                      <NumberStepper
                        size="xs"
                        min={1}
                        max={50}
                        value={shelf.cells}
                        onChange={(n) => setCells(selected.id, shelf.id, n)}
                      />
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
                        title="Дублировать полку"
                        onClick={() => duplicateShelf(selected.id, shelf.id)}
                      >
                        <CopyIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="Удалить полку"
                        className="text-destructive"
                        disabled={selected.shelves.length <= 1}
                        onClick={() => removeShelf(selected.id, shelf.id)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  )
                }}
              />

              <Button variant="outline" size="sm" onClick={() => addShelf(selected.id, 'bottom')}>
                <PlusIcon /> Полка снизу
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <TemplateMetaCard template={selected} onSelect={select} />
            <PresetsCard templateId={selected.id} />
          </div>
        </>
      ) : (
        <EmptyTemplates onCreate={() => select(addTemplate())} />
      )}
    </div>
  )
}

function EmptyTemplates({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="items-center py-16 lg:col-span-2">
      <p className="text-muted-foreground">Нет ни одного шаблона стеллажа.</p>
      <Button onClick={onCreate}>
        <PlusIcon /> Создать шаблон
      </Button>
    </Card>
  )
}
