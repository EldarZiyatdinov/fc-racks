import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createDemoData } from '@/domain/demo'
import type {
  Building,
  Floor,
  Rack,
  RackRun,
  RackTemplate,
  Row,
  WarehouseData,
} from '@/domain/types'
import { TEMPLATE_COLORS } from '@/domain/types'
import { uid } from '@/lib/id'

/** Описание структуры для массовой генерации (мастер B2). */
export type GenerateSpec = {
  buildings: {
    name: string
    floors: { name: string; rows: { name: string; racks: RackRun[] }[] }[]
  }[]
}

type Data = Pick<WarehouseData, 'rackTemplates' | 'buildings'>

type Actions = {
  // Шаблоны
  addTemplate: (cells?: number[]) => string
  updateTemplate: (id: string, patch: Partial<Pick<RackTemplate, 'name' | 'color'>>) => void
  duplicateTemplate: (id: string) => string | undefined
  /** Возвращает число стеллажей, использующих шаблон; удаляет только если 0. */
  removeTemplate: (id: string) => number
  addShelf: (templateId: string, position: 'top' | 'bottom') => void
  removeShelf: (templateId: string, shelfId: string) => void
  duplicateShelf: (templateId: string, shelfId: string) => void
  moveShelf: (templateId: string, shelfId: string, dir: 'up' | 'down') => void
  setCells: (templateId: string, shelfId: string, cells: number) => void
  applyPreset: (templateId: string, cells: number[]) => void

  // Здания / этажи / ряды
  addBuilding: () => string
  renameBuilding: (id: string, name: string) => void
  removeBuilding: (id: string) => void
  addFloor: (buildingId: string) => string | undefined
  renameFloor: (id: string, name: string) => void
  duplicateFloor: (id: string) => string | undefined
  removeFloor: (id: string) => void
  addRow: (floorId: string) => string | undefined
  renameRow: (id: string, name: string) => void
  duplicateRow: (id: string) => void
  removeRow: (id: string) => void

  // Стеллажи
  addRack: (rowId: string, templateId: string, index?: number) => void
  setRackTemplate: (rackId: string, templateId: string) => void
  removeRack: (rackId: string) => void
  moveRack: (fromRowId: string, fromIndex: number, toRowId: string, toIndex: number) => void
  fillRow: (rowId: string, runs: RackRun[], mode: 'replace' | 'append') => void

  // Массовые операции
  generate: (spec: GenerateSpec, mode: 'replace' | 'append') => void
  importData: (data: WarehouseData) => void
  loadDemo: () => void
  reset: () => void
}

export type WarehouseState = Data & Actions

const MAX_CELLS = 50

function findTemplate(s: Data, id: string) {
  return s.rackTemplates.find((t) => t.id === id)
}

function findBuildingOfFloor(s: Data, floorId: string) {
  for (const b of s.buildings) {
    const index = b.floors.findIndex((f) => f.id === floorId)
    if (index >= 0) return { building: b, floor: b.floors[index], index }
  }
}

function findFloorOfRow(s: Data, rowId: string) {
  for (const b of s.buildings)
    for (const f of b.floors) {
      const index = f.rows.findIndex((r) => r.id === rowId)
      if (index >= 0) return { floor: f, row: f.rows[index], index }
    }
}

function findRowOfRack(s: Data, rackId: string) {
  for (const b of s.buildings)
    for (const f of b.floors)
      for (const r of f.rows) {
        const index = r.racks.findIndex((k) => k.id === rackId)
        if (index >= 0) return { row: r, rack: r.racks[index], index }
      }
}

function makeRacks(runs: RackRun[]): Rack[] {
  return runs.flatMap((run) =>
    Array.from({ length: Math.max(0, run.count) }, () => ({
      id: uid('rk'),
      templateId: run.templateId,
    })),
  )
}

function cloneRow(row: Row): Row {
  return {
    id: uid('row'),
    name: row.name,
    racks: row.racks.map((k) => ({ id: uid('rk'), templateId: k.templateId })),
  }
}

function cloneFloor(floor: Floor): Floor {
  return { id: uid('fl'), name: floor.name, rows: floor.rows.map(cloneRow) }
}

function nextName(prefix: string, existing: { name: string }[]) {
  const used = new Set(existing.map((e) => e.name))
  let n = existing.length + 1
  while (used.has(`${prefix} ${n}`)) n++
  return `${prefix} ${n}`
}

function initialData(): Data {
  const { rackTemplates, buildings } = createDemoData()
  return { rackTemplates, buildings }
}

const clampCells = (n: number) => Math.min(MAX_CELLS, Math.max(1, Math.round(n) || 1))

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    immer((set, get) => ({
      // Первый визит — сразу демо-склад; дальше состояние берётся из localStorage.
      ...initialData(),

      addTemplate: (cells = [3, 3, 3]) => {
        const id = uid('tpl')
        set((s) => {
          s.rackTemplates.push({
            id,
            name: nextName('Шаблон', s.rackTemplates),
            color: TEMPLATE_COLORS[s.rackTemplates.length % TEMPLATE_COLORS.length],
            shelves: cells.map((c) => ({ id: uid('sh'), cells: clampCells(c) })),
          })
        })
        return id
      },
      updateTemplate: (id, patch) =>
        set((s) => {
          const t = findTemplate(s, id)
          if (t) Object.assign(t, patch)
        }),
      duplicateTemplate: (id) => {
        const src = findTemplate(get(), id)
        if (!src) return
        const newId = uid('tpl')
        set((s) => {
          s.rackTemplates.push({
            id: newId,
            name: `${src.name} (копия)`,
            color: src.color,
            shelves: src.shelves.map((sh) => ({ id: uid('sh'), cells: sh.cells })),
          })
        })
        return newId
      },
      removeTemplate: (id) => {
        let usage = 0
        for (const b of get().buildings)
          for (const f of b.floors)
            for (const r of f.rows) usage += r.racks.filter((k) => k.templateId === id).length
        if (usage === 0)
          set((s) => {
            s.rackTemplates = s.rackTemplates.filter((t) => t.id !== id)
          })
        return usage
      },
      addShelf: (templateId, position) =>
        set((s) => {
          const t = findTemplate(s, templateId)
          if (!t) return
          const ref = position === 'top' ? t.shelves[t.shelves.length - 1] : t.shelves[0]
          const shelf = { id: uid('sh'), cells: ref?.cells ?? 3 }
          if (position === 'top') t.shelves.push(shelf)
          else t.shelves.unshift(shelf)
        }),
      removeShelf: (templateId, shelfId) =>
        set((s) => {
          const t = findTemplate(s, templateId)
          if (!t || t.shelves.length <= 1) return
          t.shelves = t.shelves.filter((sh) => sh.id !== shelfId)
        }),
      duplicateShelf: (templateId, shelfId) =>
        set((s) => {
          const t = findTemplate(s, templateId)
          const i = t?.shelves.findIndex((sh) => sh.id === shelfId) ?? -1
          if (!t || i < 0) return
          t.shelves.splice(i + 1, 0, { id: uid('sh'), cells: t.shelves[i].cells })
        }),
      moveShelf: (templateId, shelfId, dir) =>
        set((s) => {
          const t = findTemplate(s, templateId)
          const i = t?.shelves.findIndex((sh) => sh.id === shelfId) ?? -1
          if (!t || i < 0) return
          // Полки хранятся снизу вверх: «вверх» — к большему индексу.
          const j = dir === 'up' ? i + 1 : i - 1
          if (j < 0 || j >= t.shelves.length) return
          ;[t.shelves[i], t.shelves[j]] = [t.shelves[j], t.shelves[i]]
        }),
      setCells: (templateId, shelfId, cells) =>
        set((s) => {
          const sh = findTemplate(s, templateId)?.shelves.find((x) => x.id === shelfId)
          if (sh) sh.cells = clampCells(cells)
        }),
      applyPreset: (templateId, cells) =>
        set((s) => {
          const t = findTemplate(s, templateId)
          if (t && cells.length > 0)
            t.shelves = cells.map((c) => ({ id: uid('sh'), cells: clampCells(c) }))
        }),

      addBuilding: () => {
        const id = uid('bld')
        set((s) => {
          s.buildings.push({
            id,
            name: nextName('Здание', s.buildings),
            floors: [{ id: uid('fl'), name: 'Этаж 1', rows: [] }],
          })
        })
        return id
      },
      renameBuilding: (id, name) =>
        set((s) => {
          const b = s.buildings.find((x) => x.id === id)
          if (b) b.name = name
        }),
      removeBuilding: (id) =>
        set((s) => {
          s.buildings = s.buildings.filter((b) => b.id !== id)
        }),
      addFloor: (buildingId) => {
        if (!get().buildings.some((b) => b.id === buildingId)) return
        const id = uid('fl')
        set((s) => {
          const b = s.buildings.find((x) => x.id === buildingId)!
          b.floors.push({ id, name: nextName('Этаж', b.floors), rows: [] })
        })
        return id
      },
      renameFloor: (id, name) =>
        set((s) => {
          const found = findBuildingOfFloor(s, id)
          if (found) found.floor.name = name
        }),
      duplicateFloor: (id) => {
        const found = findBuildingOfFloor(get(), id)
        if (!found) return
        const copy = cloneFloor(found.floor)
        copy.name = nextName('Этаж', found.building.floors)
        set((s) => {
          const f = findBuildingOfFloor(s, id)!
          f.building.floors.splice(f.index + 1, 0, copy)
        })
        return copy.id
      },
      removeFloor: (id) =>
        set((s) => {
          const found = findBuildingOfFloor(s, id)
          if (found) found.building.floors.splice(found.index, 1)
        }),
      addRow: (floorId) => {
        if (!findBuildingOfFloor(get(), floorId)) return
        const id = uid('row')
        set((s) => {
          const { floor } = findBuildingOfFloor(s, floorId)!
          floor.rows.push({ id, name: nextName('Ряд', floor.rows), racks: [] })
        })
        return id
      },
      renameRow: (id, name) =>
        set((s) => {
          const found = findFloorOfRow(s, id)
          if (found) found.row.name = name
        }),
      duplicateRow: (id) =>
        set((s) => {
          const found = findFloorOfRow(s, id)
          if (!found) return
          const copy = cloneRow(found.row)
          copy.name = nextName('Ряд', found.floor.rows)
          found.floor.rows.splice(found.index + 1, 0, copy)
        }),
      removeRow: (id) =>
        set((s) => {
          const found = findFloorOfRow(s, id)
          if (found) found.floor.rows.splice(found.index, 1)
        }),

      addRack: (rowId, templateId, index) =>
        set((s) => {
          const found = findFloorOfRow(s, rowId)
          if (!found) return
          const rack = { id: uid('rk'), templateId }
          const racks = found.row.racks
          racks.splice(index ?? racks.length, 0, rack)
        }),
      setRackTemplate: (rackId, templateId) =>
        set((s) => {
          const found = findRowOfRack(s, rackId)
          if (found) found.rack.templateId = templateId
        }),
      removeRack: (rackId) =>
        set((s) => {
          const found = findRowOfRack(s, rackId)
          if (found) found.row.racks.splice(found.index, 1)
        }),
      moveRack: (fromRowId, fromIndex, toRowId, toIndex) =>
        set((s) => {
          const from = findFloorOfRow(s, fromRowId)?.row
          const to = findFloorOfRow(s, toRowId)?.row
          if (!from || !to || !from.racks[fromIndex]) return
          const [rack] = from.racks.splice(fromIndex, 1)
          to.racks.splice(Math.min(toIndex, to.racks.length), 0, rack)
        }),
      fillRow: (rowId, runs, mode) =>
        set((s) => {
          const found = findFloorOfRow(s, rowId)
          if (!found) return
          const racks = makeRacks(runs)
          found.row.racks = mode === 'replace' ? racks : [...found.row.racks, ...racks]
        }),

      generate: (spec, mode) =>
        set((s) => {
          const created: Building[] = spec.buildings.map((b) => ({
            id: uid('bld'),
            name: b.name,
            floors: b.floors.map((f) => ({
              id: uid('fl'),
              name: f.name,
              rows: f.rows.map((r) => ({ id: uid('row'), name: r.name, racks: makeRacks(r.racks) })),
            })),
          }))
          s.buildings = mode === 'replace' ? created : [...s.buildings, ...created]
        }),
      importData: (data) => set({ rackTemplates: data.rackTemplates, buildings: data.buildings }),
      loadDemo: () => set(initialData()),
      reset: () => set({ rackTemplates: [], buildings: [] }),
    })),
    {
      name: 'fc-racks',
      version: 1,
      partialize: (s): Data => ({ rackTemplates: s.rackTemplates, buildings: s.buildings }),
    },
  ),
)

/** Текущие данные в формате для экспорта / бэкенда (новый объект — не использовать как селектор хука). */
export function selectExport(s: WarehouseState): WarehouseData {
  return { version: 1, rackTemplates: s.rackTemplates, buildings: s.buildings }
}
