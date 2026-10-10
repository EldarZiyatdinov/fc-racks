import type { z } from 'zod'
import type {
  buildingSchema,
  floorSchema,
  rackSchema,
  rackTemplateSchema,
  rowSchema,
  shelfSchema,
  warehouseSchema,
} from './schema'

export type Shelf = z.infer<typeof shelfSchema>
export type RackTemplate = z.infer<typeof rackTemplateSchema>
export type Rack = z.infer<typeof rackSchema>
export type Row = z.infer<typeof rowSchema>
export type Floor = z.infer<typeof floorSchema>
export type Building = z.infer<typeof buildingSchema>
export type WarehouseData = z.infer<typeof warehouseSchema>

/** Фрагмент состава ряда: «шаблон × количество». */
export type RackRun = { templateId: string; count: number }

export const TEMPLATE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
  '#84cc16',
]
