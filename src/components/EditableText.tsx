import { useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
  inputClassName?: string
}

/** Текст, который по клику превращается в поле ввода. Enter/blur — сохранить, Esc — отменить. */
export function EditableText({ value, onChange, className, inputClassName }: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  if (draft !== null) {
    const commit = () => {
      const v = draft.trim()
      if (v && v !== value) onChange(v)
      setDraft(null)
    }
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(null)
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn('h-7 w-40 px-2 py-0', inputClassName)}
      />
    )
  }

  return (
    <button
      type="button"
      title="Нажмите, чтобы переименовать"
      onClick={(e) => {
        e.stopPropagation()
        setDraft(value)
      }}
      className={cn(
        'group/edit inline-flex items-center gap-1.5 rounded px-1 text-left hover:bg-accent',
        className,
      )}
    >
      <span className="truncate">{value}</span>
      <PencilIcon className="size-3 shrink-0 opacity-0 transition-opacity group-hover/edit:opacity-50" />
    </button>
  )
}
