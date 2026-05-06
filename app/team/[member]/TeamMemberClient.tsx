'use client'
import { useState, useEffect } from 'react'
import { FileText, Paperclip } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

type TaskLabel = 'Proof Reading' | 'Graphic Design' | 'Grant Writing' | 'Blog Post' | 'Brainstorming' | 'Research' | 'Technical' | 'Editing' | 'Decision' | 'Other'
type TaskStatus = 'todo' | 'in_progress' | 'done'

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
  const [loading, setLoading] = useState(true)

  const meta = MEMBER_META[member] ?? {
    display: member.charAt(0).toUpperCase() + member.slice(1),
    initials: member[0]?.toUpperCase() ?? '?',
    accent: '#886c44',
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('tasks')
        .select('*, initiative:initiatives(id,title,area,status,created_at,updated_at)')
        .ilike('assigned_to', meta.display)
        .order('created_at', { ascending: false })
      if (data) setTasks(data as Task[])
      setLoading(false)
    }
    load()
  }, [member, meta.display])

  const current   = tasks.filter(t => t.status === 'in_progress')
  const completed = tasks.filter(t => t.status === 'done')

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-6">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0"
              style={{ background: meta.accent }}>
              {meta.initials}
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
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">Current Focus</h2>
                    <p className="text-[11px] text-stone-400 mt-0.5">In-progress tasks</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    {current.length}
                  </span>
                </div>
                <div>
                  {current.length === 0 ? (
                    <p className="px-5 py-10 text-xs text-stone-300 text-center italic">Nothing in progress.</p>
                  ) : current.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">Completed</h2>
                    <p className="text-[11px] text-stone-400 mt-0.5">Done tasks</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {completed.length}
                  </span>
                </div>
                <div>
                  {completed.length === 0 ? (
                    <p className="px-5 py-10 text-xs text-stone-300 text-center italic">No completed tasks yet.</p>
                  ) : completed.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
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
