import { NavLink, Outlet } from 'react-router'
import { DatabaseIcon, RotateCcwIcon, WarehouseIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StatsLine } from '@/components/StatsLine'
import { templateMap, totalStats } from '@/domain/address'
import { cn } from '@/lib/utils'
import { useWarehouseStore } from '@/store/useWarehouseStore'

const NAV: { title: string; links: { to: string; label: string; end?: boolean }[] }[] = [
  {
    title: 'Шаблоны',
    links: [
      { to: '/templates', label: 'Визуально', end: true },
      { to: '/templates/form', label: 'Форма' },
    ],
  },
  {
    title: 'Расстановка',
    links: [
      { to: '/layout', label: 'План', end: true },
      { to: '/layout/wizard', label: 'Мастер' },
      { to: '/layout/table', label: 'Таблица' },
    ],
  },
  {
    title: 'Результат',
    links: [
      { to: '/view', label: 'Просмотр' },
      { to: '/json', label: 'JSON' },
    ],
  },
]

export function AppShell() {
  const buildings = useWarehouseStore((s) => s.buildings)
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const loadDemo = useWarehouseStore((s) => s.loadDemo)
  const reset = useWarehouseStore((s) => s.reset)
  const stats = totalStats(buildings, templateMap(templates))

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-2 font-semibold">
            <WarehouseIcon className="size-5 text-primary" />
            fc-racks
          </div>

          <nav className="flex flex-wrap items-center gap-4">
            {NAV.map((group) => (
              <div key={group.title} className="flex items-center gap-1">
                <span className="mr-1 text-xs tracking-wide text-muted-foreground uppercase">
                  {group.title}
                </span>
                {group.links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cn(
                        'rounded-md px-2.5 py-1 text-sm transition-colors hover:bg-accent',
                        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <StatsLine
              stats={stats}
              show={['racks', 'cells']}
              className="hidden lg:inline"
            />
            <ConfirmDialog
              title="Загрузить демо-склад?"
              description="Текущие шаблоны и расстановка будут заменены демо-данными."
              confirmText="Загрузить"
              onConfirm={() => {
                loadDemo()
                toast.success('Демо-склад загружен')
              }}
            >
              <Button variant="outline" size="sm">
                <DatabaseIcon /> Демо
              </Button>
            </ConfirmDialog>
            <ConfirmDialog
              title="Очистить всё?"
              description="Будут удалены все шаблоны, здания, этажи и ряды."
              confirmText="Очистить"
              destructive
              onConfirm={() => {
                reset()
                toast('Данные очищены')
              }}
            >
              <Button variant="ghost" size="sm">
                <RotateCcwIcon /> Сбросить
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
