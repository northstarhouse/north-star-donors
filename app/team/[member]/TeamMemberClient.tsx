'use client'
import { useState, useEffect, useRef } from 'react'
import { FileText, Paperclip, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

type TaskLabel = 'Proof Reading' | 'Graphic Design' | 'Grant Writing' | 'Blog Post' | 'Brainstorming' | 'Research' | 'Technical' | 'Editing' | 'Decision' | 'Other'
type TaskStatus = 'todo' | 'in_progress' | 'done'
type Section = 'current' | 'completed'

interface Task {
  id: string
  title: string
  label: TaskLabel | null
  status: TaskStatus
  due_date: string | null
  notes: string | null
  attachment_url: string | null
  assigned_to: string | null
  initiative: { id: string; title: string; area: string } | null
  created_at: string
}

interface FocusEntry {
  id: string
  member: string
  section: Section
  content: string
  created_at: string
}

const LABEL_COLORS: Record<TaskLabel, string> = {
  'Proof Reading':  'bg-purple-100 text-purple-700 border-purple-200',
  'Graphic Design': 'bg-pink-100 text-pink-700 border-pink-200',
  'Grant Writing':  'bg-blue-100 text-blue-700 border-blue-200',
  'Blog Post':      'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Brainstorming':  'bg-amber-100 text-amber-700 border-amber-200',
  'Research':       'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Technical':      'bg-slate-100 text-slate-700 border-slate-200',
  'Editing':        'bg-orange-100 text-orange-700 border-orange-200',
  'Decision':       'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Other':          'bg-stone-100 text-stone-500 border-stone-200',
}

const MEMBER_META: Record<string, { display: string; initials: string; accent: string }> = {
  kaelen: { display: 'Kaelen', initials: 'K', accent: '#886c44' },
  haley:  { display: 'Haley',  initials: 'H', accent: '#5a7a8a' },
  derek:  { display: 'Derek',  initials: 'D', accent: '#6b7c5a' },
}

export default function TeamMemberClient({ member }: { member: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<FocusEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState<Section | null>(null)
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const meta = MEMBER_META[member] ?? {
    display: member.charAt(0).toUpperCase() + member.slice(1),
    initials: member[0]?.toUpperCase() ?? '?',
    accent: '#886c44',
  }

  useEffect(() => {
    const { data } = supabase.storage.from('team-photos').getPublicUrl(member)
    setPhotoUrl(data.publicUrl)
    setPhotoError(false)
  }, [member])

  useEffect(() => {
    async function load() {
      const [tasksRes, entriesRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, initiative:initiatives(id,title,area,status,created_at,updated_at)')
          .ilike('assigned_to', meta.display)
          .order('created_at', { ascending: false }),
        supabase
          .from('team_focus_entries')
          .select('*')
          .eq('member', member)
          .order('created_at', { ascending: true }),
      ])
      if (tasksRes.data) setTasks(tasksRes.data as Task[])
      if (entriesRes.data) setEntries(entriesRes.data as FocusEntry[])
      setLoading(false)
    }
    load()
  }, [member, meta.display])

  useEffect(() => {
    if (addingTo) inputRef.current?.focus()
  }, [addingTo])

  async function addEntry() {
    if (!newItem.trim() || !addingTo) return
    setSaving(true)
    const { data } = await supabase
      .from('team_focus_entries')
      .insert({ member, section: addingTo, content: newItem.trim() })
      .select()
      .single()
    if (data) setEntries(prev => [...prev, data as FocusEntry])
    setNewItem('')
    setAddingTo(null)
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    await supabase.from('team_focus_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const currentTasks    = tasks.filter(t => t.status === 'in_progress')
  const completedTasks  = tasks.filter(t => t.status === 'done')
  const currentEntries  = entries.filter(e => e.section === 'current')
  const completedEntries = entries.filter(e => e.section === 'completed')

  const currentCount   = currentTasks.length + currentEntries.length
  const completedCount = completedTasks.length + completedEntries.length

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-6">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
              style={{ background: meta.accent }}>
              {meta.initials}
              {photoUrl && (
                <img
                  key={photoUrl}
                  src={photoUrl}
                  alt={meta.display}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: photoError ? 'none' : 'block' }}
                  onError={() => setPhotoError(true)}
                  onLoad={() => setPhotoError(false)}
                />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                {meta.display}
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">Team Member · North Star House</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Current Focus */}
              <Section
                title="Current Focus"
                subtitle="In-progress tasks"
                count={currentCount}
                countColor="bg-amber-100 text-amber-700"
                addingTo={addingTo}
                section="current"
                newItem={newItem}
                saving={saving}
                inputRef={inputRef}
                onStartAdd={() => { setAddingTo('current'); setNewItem('') }}
                onCancelAdd={() => setAddingTo(null)}
                onNewItemChange={setNewItem}
                onAdd={addEntry}
              >
                {currentEntries.map(e => (
                  <ManualEntry key={e.id} entry={e} onDelete={deleteEntry} />
                ))}
                {currentTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {currentCount === 0 && (
                  <p className="px-5 py-8 text-xs text-stone-300 text-center italic">Nothing in progress.</p>
                )}
              </Section>

              {/* Completed */}
              <Section
                title="Completed"
                subtitle="Done tasks"
                count={completedCount}
                countColor="bg-emerald-100 text-emerald-700"
                addingTo={addingTo}
                section="completed"
                newItem={newItem}
                saving={saving}
                inputRef={inputRef}
                onStartAdd={() => { setAddingTo('completed'); setNewItem('') }}
                onCancelAdd={() => setAddingTo(null)}
                onNewItemChange={setNewItem}
                onAdd={addEntry}
              >
                {completedEntries.map(e => (
                  <ManualEntry key={e.id} entry={e} onDelete={deleteEntry} />
                ))}
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {completedCount === 0 && (
                  <p className="px-5 py-8 text-xs text-stone-300 text-center italic">No completed tasks yet.</p>
                )}
              </Section>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({
  title, subtitle, count, countColor, addingTo, section,
  newItem, saving, inputRef,
  onStartAdd, onCancelAdd, onNewItemChange, onAdd, children,
}: {
  title: string
  subtitle: string
  count: number
  countColor: string
  addingTo: Section | null
  section: Section
  newItem: string
  saving: boolean
  inputRef: React.RefObject<HTMLInputElement>
  onStartAdd: () => void
  onCancelAdd: () => void
  onNewItemChange: (v: string) => void
  onAdd: () => void
  children: React.ReactNode
}) {
  const isAdding = addingTo === section
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-800">{title}</h2>
          <p className="text-[11px] text-stone-400 mt-0.5">{subtitle}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${countColor}`}>
          {count}
        </span>
      </div>

      <div className="flex-1">{children}</div>

      {/* Add item area */}
      <div className="px-5 py-3 border-t border-stone-50">
        {isAdding ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
              placeholder="Add an item..."
              value={newItem}
              onChange={e => onNewItemChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onAdd(); if (e.key === 'Escape') onCancelAdd() }}
            />
            <button
              onClick={onAdd}
              disabled={!newItem.trim() || saving}
              className="px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-40 font-medium"
              style={{ background: 'var(--gold)' }}
            >
              {saving ? '…' : 'Add'}
            </button>
            <button onClick={onCancelAdd} className="p-1.5 text-stone-300 hover:text-stone-500">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onStartAdd}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-600 transition-colors"
          >
            <Plus size={13} /> Add item
          </button>
        )}
      </div>
    </div>
  )
}

function ManualEntry({ entry, onDelete }: { entry: FocusEntry; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-start gap-2 px-5 py-3 border-b border-stone-50 last:border-0 group">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-300 flex-shrink-0" />
      <p className="flex-1 text-sm text-stone-700 leading-snug">{entry.content}</p>
      <button
        onClick={() => onDelete(entry.id)}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-300 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="px-5 py-3.5 border-b border-stone-50 last:border-0">
      <p className={`text-sm leading-snug ${task.status === 'done' ? 'line-through text-stone-400' : 'text-stone-800'}`}>
        {task.title}
      </p>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {task.label && (
          <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] font-medium ${LABEL_COLORS[task.label as TaskLabel]}`}>
            {task.label}
          </span>
        )}
        {task.initiative && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-medium bg-blue-50 text-blue-700 border-blue-100">
            <FileText size={9} />{task.initiative.title}
          </span>
        )}
        {task.due_date && (
          <span className="text-[10px] text-stone-400">
            Due {new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.attachment_url && (
          <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
            <Paperclip size={9} />attachment
          </span>
        )}
      </div>
      {task.notes && (
        <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed line-clamp-2">{task.notes}</p>
      )}
    </div>
  )
}
