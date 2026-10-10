import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/useAppStore'

// Временная страница-заглушка: проверяет, что Tailwind, shadcn и localStorage работают.
function App() {
  const { notes, addNote, removeNote, reset } = useAppStore()
  const [text, setText] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    addNote(value)
    setText('')
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">fc-racks</h1>

        <Card>
          <CardHeader>
            <CardTitle>Проверка каркаса</CardTitle>
            <CardDescription>
              Записи сохраняются в localStorage и переживают перезагрузку страницы.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="note">Новая запись</Label>
                <Input
                  id="note"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Например: Стеллаж A-1"
                />
              </div>
              <Button type="submit">Добавить</Button>
            </form>

            {notes.length > 0 && (
              <ul className="divide-y rounded-md border">
                {notes.map((note) => (
                  <li key={note.id} className="flex items-center justify-between px-3 py-2">
                    <span>{note.text}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeNote(note.id)}>
                      Удалить
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {notes.length > 0 && (
              <Button variant="outline" onClick={reset}>
                Очистить всё
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default App
