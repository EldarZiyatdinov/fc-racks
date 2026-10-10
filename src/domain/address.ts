import type { Building, Floor, RackTemplate, Row } from './types'

/** Адрес ячейки по позициям (с единицы): З1-Э2-Р3-С4-П2-Я1. Полки считаются снизу вверх. */
export function cellAddress(b: number, f: number, r: number, k: number, p: number, c: number) {
  return `З${b + 1}-Э${f + 1}-Р${r + 1}-С${k + 1}-П${p + 1}-Я${c + 1}`
}

/** Префикс адреса стеллажа: З1-Э2-Р3-С4. */
export function rackAddress(b: number, f: number, r: number, k: number) {
  return `З${b + 1}-Э${f + 1}-Р${r + 1}-С${k + 1}`
}

export function templateCells(t: Pick<RackTemplate, 'shelves'>) {
  return t.shelves.reduce((sum, s) => sum + s.cells, 0)
}

export type Stats = { floors: number; rows: number; racks: number; cells: number }

type TemplateMap = Map<string, RackTemplate>

export function templateMap(templates: RackTemplate[]): TemplateMap {
  return new Map(templates.map((t) => [t.id, t]))
}

export function rowStats(row: Row, tpl: TemplateMap): Stats {
  let cells = 0
  for (const k of row.racks) {
    const t = tpl.get(k.templateId)
    if (t) cells += templateCells(t)
  }
  return { floors: 0, rows: 1, racks: row.racks.length, cells }
}

function sumStats(list: Stats[]): Stats {
  return list.reduce(
    (a, s) => ({
      floors: a.floors + s.floors,
      rows: a.rows + s.rows,
      racks: a.racks + s.racks,
      cells: a.cells + s.cells,
    }),
    { floors: 0, rows: 0, racks: 0, cells: 0 },
  )
}

export function floorStats(floor: Floor, tpl: TemplateMap): Stats {
  return { ...sumStats(floor.rows.map((r) => rowStats(r, tpl))), floors: 1 }
}

export function buildingStats(building: Building, tpl: TemplateMap): Stats {
  return sumStats(building.floors.map((f) => floorStats(f, tpl)))
}

export function totalStats(buildings: Building[], tpl: TemplateMap): Stats {
  return sumStats(buildings.map((b) => buildingStats(b, tpl)))
}

/** Сжимает состав ряда в последовательные группы: [A, A, B] → [{A, 2}, {B, 1}]. */
export function compressRacks(templateIds: string[]) {
  const runs: { templateId: string; count: number }[] = []
  for (const id of templateIds) {
    const last = runs[runs.length - 1]
    if (last && last.templateId === id) last.count++
    else runs.push({ templateId: id, count: 1 })
  }
  return runs
}

/** Склонение: plural(5, ['ячейка', 'ячейки', 'ячеек']). */
export function plural(n: number, forms: [string, string, string]) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1]
  return forms[2]
}

/** Плоский список всех ячеек с адресами — удобный «развёрнутый» вид для бэкенда. */
export function expandCells(data: { rackTemplates: RackTemplate[]; buildings: Building[] }) {
  const tpl = templateMap(data.rackTemplates)
  const cells: {
    address: string
    building: string
    floor: string
    row: string
    rackId: string
    template: string
    shelf: number
    cell: number
  }[] = []
  data.buildings.forEach((b, bi) =>
    b.floors.forEach((f, fi) =>
      f.rows.forEach((r, ri) =>
        r.racks.forEach((k, ki) => {
          const t = tpl.get(k.templateId)
          t?.shelves.forEach((s, si) => {
            for (let c = 0; c < s.cells; c++)
              cells.push({
                address: cellAddress(bi, fi, ri, ki, si, c),
                building: b.name,
                floor: f.name,
                row: r.name,
                rackId: k.id,
                template: t.name,
                shelf: si + 1,
                cell: c + 1,
              })
          })
        }),
      ),
    ),
  )
  return cells
}
