import { useState } from 'react'
import { WandSparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RackFacade } from '@/components/rack/RackFacade'
import { useWarehouseStore } from '@/store/useWarehouseStore'

// Полки снизу вверх.
const PRESETS: { name: string; cells: number[] }[] = [
  { name: '3 × 3', cells: [3, 3, 3] },
  { name: 'Пирамида', cells: [4, 3, 2] },
  { name: '5 × 4', cells: [4, 4, 4, 4, 4] },
  { name: '3 + 2', cells: [3, 3, 3, 2, 2] },
  { name: 'Паллетный', cells: [2, 2] },
  { name: 'Мелочь', cells: [6, 6, 6, 6, 6, 6] },
]

const toSpec = (cells: number[]) => cells.map((c, i) => ({ id: String(i), cells: c }))

/** Разбирает «4-3-2» / «4, 3, 2» / «4 3 2» в массив ячеек по полкам снизу вверх. */
function parseFormula(text: string): number[] | null {
  const parts = text.split(/[\s,;\-–]+/).filter(Boolean)
  if (parts.length === 0) return null
  const nums = parts.map(Number)
  if (nums.some((n) => !Number.isInteger(n) || n < 1 || n > 50)) return null
  return nums
}

/** A3: быстрое создание — пресеты и формула. */
export function PresetsCard({ templateId }: { templateId: string }) {
  const applyPreset = useWarehouseStore((s) => s.applyPreset)
  const [formula, setFormula] = useState('')

  const applyFormula = () => {
    const cells = parseFormula(formula)
    if (!cells) {
      toast.error('Формула: числа от 1 до 50 через дефис, например 4-3-2')
      return
    }
    applyPreset(templateId, cells)
    setFormula('')
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">Быстрое создание</CardTitle>
        <CardDescription>Пресет или формула заменят текущие полки.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(templateId, p.cells)}
              className="flex flex-col items-center gap-1 rounded-md border p-2 text-[11px] hover:border-primary hover:bg-accent"
            >
              <RackFacade shelves={toSpec(p.cells)} size="xs" />
              {p.name}
            </button>
          ))}
        </div>
        <form
          className="space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            applyFormula()
          }}
        >
          <div className="flex gap-2">
            <Input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="4-3-2"
              className="font-mono"
            />
            <Button type="submit" variant="secondary">
              <WandSparklesIcon /> Применить
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ячейки по полкам <b>снизу вверх</b>: «4-3-2» — внизу 4, посередине 3, наверху 2.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
