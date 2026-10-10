import { z } from 'zod'

// Единый источник правды о формате данных: из этой схемы выводятся TS-типы,
// и по ней же валидируется импортируемый JSON.

export const shelfSchema = z.object({
  id: z.string().min(1),
  cells: z.number().int().min(1, 'На полке должна быть хотя бы одна ячейка').max(50),
})

export const rackTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string().min(1),
  // Полки перечисляются снизу вверх.
  shelves: z.array(shelfSchema).min(1, 'У стеллажа должна быть хотя бы одна полка'),
})

export const rackSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
})

export const rowSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  racks: z.array(rackSchema),
})

export const floorSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  rows: z.array(rowSchema),
})

export const buildingSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  floors: z.array(floorSchema),
})

export const warehouseSchema = z
  .object({
    version: z.literal(1),
    rackTemplates: z.array(rackTemplateSchema),
    buildings: z.array(buildingSchema),
  })
  .superRefine((data, ctx) => {
    const templateIds = new Set(data.rackTemplates.map((t) => t.id))
    data.buildings.forEach((b, bi) =>
      b.floors.forEach((f, fi) =>
        f.rows.forEach((r, ri) =>
          r.racks.forEach((k, ki) => {
            if (!templateIds.has(k.templateId)) {
              ctx.addIssue({
                code: 'custom',
                path: ['buildings', bi, 'floors', fi, 'rows', ri, 'racks', ki, 'templateId'],
                message: `Шаблон «${k.templateId}» не найден в rackTemplates`,
              })
            }
          }),
        ),
      ),
    )
  })
