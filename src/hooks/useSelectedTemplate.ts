import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useWarehouseStore } from '@/store/useWarehouseStore'

/** Выбранный шаблон хранится в ?id=..., поэтому выбор сохраняется при переходе между A1 и A2. */
export function useSelectedTemplate() {
  const templates = useWarehouseStore((s) => s.rackTemplates)
  const [params, setParams] = useSearchParams()
  const id = params.get('id')
  const selected = templates.find((t) => t.id === id) ?? templates[0]
  const select = (templateId: string) => setParams({ id: templateId }, { replace: true })
  return { templates, selected, select }
}

/** Сколько стеллажей использует каждый шаблон. */
export function useTemplateUsage() {
  const buildings = useWarehouseStore((s) => s.buildings)
  return useMemo(() => {
    const usage = new Map<string, number>()
    for (const b of buildings)
      for (const f of b.floors)
        for (const r of f.rows)
          for (const k of r.racks) usage.set(k.templateId, (usage.get(k.templateId) ?? 0) + 1)
    return usage
  }, [buildings])
}
