'use client'
import { useState, useRef, KeyboardEvent } from 'react'

export interface MentionItem {
  id: string
  name: string
  type: 'donor' | 'sponsor'
}

interface Props {
  value: string
  onChange: (val: string) => void
  onMentionSelect?: (item: MentionItem | null) => void
  className?: string
  rows?: number
  placeholder?: string
  items: MentionItem[]
  singleLine?: boolean
}

export default function MentionTextarea({ value, onChange, onMentionSelect, className, rows = 3, placeholder, items, singleLine = false }: Props) {
  const [atIndex, setAtIndex] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  const filtered = atIndex !== null
    ? items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  function handleInput(val: string, selectionStart: number | null) {
    const pos = selectionStart ?? val.length
    const before = val.slice(0, pos)
    const lastAt = before.lastIndexOf('@')

    if (lastAt !== -1) {
      const afterAt = before.slice(lastAt + 1)
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setAtIndex(lastAt)
        setQuery(afterAt)
        setActiveIdx(0)
      } else {
        setAtIndex(null)
      }
    } else {
      setAtIndex(null)
    }

    // In singleLine mode, manual edits clear the linked contact
    if (singleLine) onMentionSelect?.(null)
    onChange(val)
  }

  function selectItem(item: MentionItem) {
    if (atIndex === null) return

    if (singleLine) {
      // Replace entire field with just the name (no @ prefix)
      onChange(item.name)
      onMentionSelect?.(item)
      setAtIndex(null)
      setQuery('')
      setTimeout(() => {
        inputRef.current?.setSelectionRange(item.name.length, item.name.length)
        inputRef.current?.focus()
      }, 0)
    } else {
      // Insert @name at cursor position
      const before = value.slice(0, atIndex)
      const after = value.slice(atIndex + 1 + query.length)
      const inserted = before + '@' + item.name + ' ' + after
      onChange(inserted)
      onMentionSelect?.(item)
      setAtIndex(null)
      setQuery('')
      setTimeout(() => {
        const pos = before.length + 1 + item.name.length + 1
        inputRef.current?.setSelectionRange(pos, pos)
        inputRef.current?.focus()
      }, 0)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (atIndex === null || filtered.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' || e.key === 'Tab') { if (filtered[activeIdx]) { e.preventDefault(); selectItem(filtered[activeIdx]) } }
    else if (e.key === 'Escape') { setAtIndex(null) }
  }

  const dropdown = atIndex !== null && filtered.length > 0 && (
    <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden w-72">
      {filtered.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onMouseDown={e => { e.preventDefault(); selectItem(item) }}
          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${i === activeIdx ? 'bg-amber-50 text-amber-800' : 'text-stone-700 hover:bg-stone-50'}`}
        >
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${item.type === 'donor' ? 'bg-stone-100 text-stone-500' : 'bg-blue-100 text-blue-600'}`}>
            {item.type === 'donor' ? 'Donor' : 'Sponsor'}
          </span>
          {item.name}
        </button>
      ))}
      <p className="px-4 py-1.5 text-[10px] text-stone-300 border-t border-stone-100">↑↓ navigate · Enter to select · Esc to close</p>
    </div>
  )

  if (singleLine) {
    return (
      <div className="relative">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={e => handleInput(e.target.value, e.target.selectionStart)}
          onKeyDown={handleKeyDown}
        />
        {dropdown}
      </div>
    )
  }

  return (
    <div className="relative">
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        className={className}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={e => handleInput(e.target.value, e.target.selectionStart)}
        onKeyDown={handleKeyDown}
      />
      {dropdown}
    </div>
  )
}
