import { uid } from '@/lib/id'
import type { Building, RackRun, RackTemplate, WarehouseData } from './types'

function template(name: string, cells: number[]): RackTemplate {
  return { id: uid('tpl'), name, shelves: cells.map((c) => ({ id: uid('sh'), cells: c })) }
}

function racks(runs: RackRun[]) {
  return runs.flatMap((run) =>
    Array.from({ length: run.count }, () => ({ id: uid('rk'), templateId: run.templateId })),
  )
}

/** Демо-склад: 3 шаблона, 3 здания с разным числом этажей и рядов. */
export function createDemoData(): WarehouseData {
  // Полки снизу вверх.
  const a = template('Тип A · пирамида', [4, 3, 2])
  const b = template('Тип B · высокий', [3, 3, 3, 2, 2])
  const c = template('Тип C · паллетный', [2, 2])

  const buildings: Building[] = [
    {
      id: uid('bld'),
      name: 'Здание 1',
      floors: [
        {
          id: uid('fl'),
          name: 'Этаж 1',
          rows: [
            { id: uid('row'), name: 'Ряд 1', racks: racks([{ templateId: a.id, count: 4 }]) },
            { id: uid('row'), name: 'Ряд 2', racks: racks([{ templateId: a.id, count: 4 }]) },
            {
              id: uid('row'),
              name: 'Ряд 3',
              racks: racks([
                { templateId: c.id, count: 2 },
                { templateId: b.id, count: 3 },
              ]),
            },
          ],
        },
        {
          id: uid('fl'),
          name: 'Этаж 2',
          rows: [
            { id: uid('row'), name: 'Ряд 1', racks: racks([{ templateId: b.id, count: 5 }]) },
            { id: uid('row'), name: 'Ряд 2', racks: racks([{ templateId: b.id, count: 5 }]) },
          ],
        },
      ],
    },
    {
      id: uid('bld'),
      name: 'Здание 2',
      floors: [
        {
          id: uid('fl'),
          name: 'Этаж 1',
          rows: [
            { id: uid('row'), name: 'Ряд 1', racks: racks([{ templateId: c.id, count: 6 }]) },
            {
              id: uid('row'),
              name: 'Ряд 2',
              racks: racks([
                { templateId: a.id, count: 2 },
                { templateId: c.id, count: 2 },
              ]),
            },
          ],
        },
      ],
    },
    {
      id: uid('bld'),
      name: 'Здание 3',
      floors: [1, 2, 3].map((n) => ({
        id: uid('fl'),
        name: `Этаж ${n}`,
        rows: [1, 2, 3, 4].map((r) => ({
          id: uid('row'),
          name: `Ряд ${r}`,
          racks: racks([{ templateId: r % 2 ? a.id : b.id, count: 3 + (r % 3) }]),
        })),
      })),
    },
  ]

  return { version: 1, rackTemplates: [a, b, c], buildings }
}
