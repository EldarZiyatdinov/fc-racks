import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Заготовка стора: всё состояние приложения автоматически сохраняется в localStorage.
// Сюда будет добавлена логика стеллажей и их распределения.
export type Note = {
  id: string
  text: string
}

type AppState = {
  notes: Note[]
  addNote: (text: string) => void
  removeNote: (id: string) => void
  reset: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (text) =>
        set((state) => ({
          notes: [...state.notes, { id: crypto.randomUUID(), text }],
        })),
      removeNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      reset: () => set({ notes: [] }),
    }),
    { name: 'fc-racks-store' },
  ),
)
