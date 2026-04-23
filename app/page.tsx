'use client'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Plus, X, Check, Circle, Pencil, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

type TaskLabel = 'Proof Reading' | 'Graphic Design' | 'Grant Writing' | 'Blog Post' | 'Brainstorming' | 'Other'
type TaskStatus = 'todo' | 'in_progress' | 'done'

interface Task {
  id: string
  title: string
  label: TaskLabel | null
  status: TaskStatus
  due_date: string | null
  notes: string | null
  created_at: string
}

const LABELS: TaskLabel[] = ['Proof Reading', 'Graphic Design', 'Grant Writing', 'Blog Post', 'Brainstorming', 'Other']

const LABEL_COLORS: Record<TaskLabel, string> = {
  'Proof Reading':  'bg-purple-100 text-purple-700 border-purple-200',
  'Graphic Design': 'bg-pink-100 text-pink-700 border-pink-200',
  'Grant Writing':  'bg-blue-100 text-blue-700 border-blue-200',
  'Blog Post':      'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Brainstorming':  'bg-amber-100 text-amber-700 border-amber-200',
  'Other':          'bg-stone-100 text-stone-500 border-stone-200',
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLabel, setNewLabel] = useState<TaskLabel | ''>('')
  const [newDue, setNewDue] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [filterLabel, setFilterLabel] = useState<TaskLabel | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({
      title: newTitle.trim(),
      label: newLabel || null,
      due_date: newDue || null,
      notes: newNotes.trim() || null,
      status: 'todo',
    })
    setNewTitle('')
    setNewLabel('')
    setNewDue('')
    setNewNotes('')
    setShowAdd(false)
    setSaving(false)
    await loadTasks()
  }

  async function cycleStatus(task: Task) {
    const next = STATUS_CYCLE[task.status]
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return
    await supabase.from('tasks').update({ title: editTitle.trim(), updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editTitle.trim() } : t))
    setEditingId(null)
  }

  async function saveNotes(id: string) {
    const notes = notesDraft[id] ?? ''
    await supabase.from('tasks').update({ notes: notes || null, updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: notes || null } : t))
  }

  function toggleExpand(task: Task) {
    if (expandedId === task.id) {
      setExpandedId(null)
    } else {
      setExpandedId(task.id)
      setNotesDraft(prev => ({ ...prev, [task.id]: task.notes ?? '' }))
    }
  }

  const filtered = tasks.filter(t => {
    if (filterLabel !== 'all' && t.label !== filterLabel) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })

  const todo = filtered.filter(t => t.status === 'todo')
  const inProgress = filtered.filter(t => t.status === 'in_progress')
  const done = filtered.filter(t => t.status === 'done')

  function StatusIcon({ status }: { status: TaskStatus }) {
    if (status === 'done') return <Check size={15} className="text-emerald-500" />
    if (status === 'in_progress') return <Circle size={15} className="text-amber-500 fill-amber-100" />
    return <Circle size={15} className="text-stone-300" />
  }

  function TaskRow({ task }: { task: Task }) {
    const expanded = expandedId === task.id
    return (
      <div className={`border-b border-stone-100 last:border-0 ${task.status === 'done' ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-3 px-4 py-3 group">
          <button
            onClick={(e) => { e.stopPropagation(); cycleStatus(task) }}
            className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
            title="Cycle status"
          >
            <StatusIcon status={task.status} />
          </button>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(task)}>
            {editingId === task.id ? (
              <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  className="flex-1 border border-stone-200 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null) }}
                />
                <button onClick={() => saveEdit(task.id)} className="px-2 py-0.5 text-white text-xs rounded-lg" style={goldBtn}>Save</button>
                <button onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-lg">✕</button>
              </div>
            ) : (
              <p className={`text-sm text-stone-800 ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {task.label && (
                <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] font-medium ${LABEL_COLORS[task.label as TaskLabel]}`}>
                  {task.label}
                </span>
              )}
              {task.due_date && (
                <span className="text-[10px] text-stone-400">
                  Due {new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {task.status === 'in_progress' && (
                <span className="text-[10px] text-amber-600 font-medium">In Progress</span>
              )}
              {task.notes && !expanded && (
                <span className="text-[10px] text-stone-400 italic">has notes</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(task.id); setEditTitle(task.title) }}
                className="p-1 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded"
              >
                <X size={11} />
              </button>
            </div>
            <button onClick={() => toggleExpand(task)} className="p-1 text-stone-300 hover:text-stone-500 rounded">
              <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notes panel */}
        {expanded && (
          <div className="px-4 pb-3 pt-0 pl-11">
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700 bg-stone-50"
              rows={4}
              placeholder="Add notes..."
              value={notesDraft[task.id] ?? ''}
              onChange={e => setNotesDraft(prev => ({ ...prev, [task.id]: e.target.value }))}
              onBlur={() => saveNotes(task.id)}
            />
            <p className="text-[10px] text-stone-300 mt-1">Auto-saves when you click away</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <LayoutDashboard size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Development Dashboard
              </h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm"
              style={goldBtn}
            >
              <Plus size={15} />
              Add Task
            </button>
          </div>
        </div>

        <div className="px-8 pb-8 flex-1 flex flex-col gap-5">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600"
              value={filterLabel}
              onChange={e => setFilterLabel(e.target.value as TaskLabel | 'all')}
            >
              <option value="all">All Labels</option>
              {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {(filterLabel !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => { setFilterLabel('all'); setFilterStatus('all') }}
                className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1.5"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Add task form */}
          {showAdd && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
              <h3 className="text-sm font-semibold text-stone-700">New Task</h3>
              <input
                autoFocus
                className={inputCls}
                placeholder="Task title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) addTask() }}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Label</label>
                  <select className={inputCls} value={newLabel} onChange={e => setNewLabel(e.target.value as TaskLabel | '')}>
                    <option value="">No label</option>
                    {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Due Date (optional)</label>
                  <input type="date" className={inputCls} value={newDue} onChange={e => setNewDue(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">Notes (optional)</label>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={3}
                  placeholder="Any notes..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={addTask} disabled={!newTitle.trim() || saving} className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                  {saving ? 'Adding...' : 'Add Task'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
              </div>
            </div>
          )}

          {/* Task columns */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">To Do</h3>
                  <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{todo.length}</span>
                </div>
                <div>
                  {todo.length === 0
                    ? <p className="px-4 py-6 text-xs text-stone-300 text-center italic">No tasks</p>
                    : todo.map(t => <TaskRow key={t.id} task={t} />)
                  }
                </div>
              </div>

              <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between bg-amber-50/50">
                  <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Progress</h3>
                  <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{inProgress.length}</span>
                </div>
                <div>
                  {inProgress.length === 0
                    ? <p className="px-4 py-6 text-xs text-stone-300 text-center italic">No tasks</p>
                    : inProgress.map(t => <TaskRow key={t.id} task={t} />)
                  }
                </div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                  <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Done</h3>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{done.length}</span>
                </div>
                <div>
                  {done.length === 0
                    ? <p className="px-4 py-6 text-xs text-stone-300 text-center italic">No tasks</p>
                    : done.map(t => <TaskRow key={t.id} task={t} />)
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
