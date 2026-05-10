'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Circle, FileText, MessageSquare, Paperclip, Save, User } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

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

interface TaskComment {
  id: string
  task_id: string
  author: string
  content: string
  created_at: string
}

const TEAM_MEMBERS = ['Kaelen', 'Haley', 'Derek']
const AUTHOR_COLORS: Record<string, string> = { Kaelen: '#886c44', Haley: '#5a7a8a', Derek: '#6b7c5a' }

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

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const DEFAULT_NOTES = `Current read

Checklist

Blockers

Links / files

Watch / parking lot
`

function fmtRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') return <Check size={16} className="text-emerald-500" />
  if (status === 'in_progress') return <Circle size={16} className="text-amber-500 fill-amber-100" />
  return <Circle size={16} className="text-stone-300" />
}

export default function TaskDetailClient({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(Boolean(taskId))
  const [notes, setNotes] = useState('')
  const [notesDirty, setNotesDirty] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [commentAuthor, setCommentAuthor] = useState(TEAM_MEMBERS[0])
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setTask(null)
      setComments([])
      const [taskRes, commentsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, initiative:initiatives(id,title,area,status,created_at,updated_at)')
          .eq('id', taskId)
          .single(),
        supabase
          .from('task_comments')
          .select('*')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true }),
      ])
      if (taskRes.data) {
        const loaded = taskRes.data as Task
        setTask(loaded)
        setNotes(loaded.notes ?? '')
      }
      if (commentsRes.data) setComments(commentsRes.data as TaskComment[])
      setNotesDirty(false)
      setLoading(false)
    }
    if (taskId) load()
  }, [taskId])

  async function saveNotes() {
    if (!task) return
    setSavingNotes(true)
    const nextNotes = notes.trim() ? notes : null
    const { data } = await supabase
      .from('tasks')
      .update({ notes: nextNotes })
      .eq('id', task.id)
      .select('*, initiative:initiatives(id,title,area,status,created_at,updated_at)')
      .single()
    if (data) {
      setTask(data as Task)
      setNotes((data as Task).notes ?? '')
      setNotesDirty(false)
    }
    setSavingNotes(false)
  }

  async function addComment() {
    if (!task || !newComment.trim()) return
    setSavingComment(true)
    const { data } = await supabase
      .from('task_comments')
      .insert({ task_id: task.id, author: commentAuthor, content: newComment.trim() })
      .select()
      .single()
    if (data) setComments(prev => [...prev, data as TaskComment])
    setNewComment('')
    setSavingComment(false)
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 min-h-screen overflow-auto" style={{ background: 'var(--page-bg)' }}>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-stone-400 hover:text-amber-700 mb-5">
            <ArrowLeft size={14} /> Development Dashboard
          </Link>

          {!taskId ? (
            <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center text-sm text-stone-400">
              Missing task id.
            </div>
          ) : loading ? (
            <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center text-sm text-stone-400">
              Loading task...
            </div>
          ) : !task ? (
            <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center text-sm text-stone-400">
              Task not found.
            </div>
          ) : (
            <div className="space-y-5">
              <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
                <div className="flex items-start gap-3">
                  <StatusIcon status={task.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
                      Task Detail
                    </p>
                    <h1 className="text-2xl leading-tight text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
                      {task.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="inline-flex px-2 py-1 rounded border text-[11px] font-medium bg-stone-100 text-stone-600 border-stone-200">
                        {STATUS_LABELS[task.status]}
                      </span>
                      {task.label && (
                        <span className={`inline-flex px-2 py-1 rounded border text-[11px] font-medium ${LABEL_COLORS[task.label]}`}>
                          {task.label}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium bg-stone-50 text-stone-600 border-stone-200">
                          <User size={10} />{task.assigned_to}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-[11px] text-stone-500">
                          Due {new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {task.initiative && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-100">
                          <FileText size={10} />{task.initiative.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {task.attachment_url && (
                  <a
                    href={task.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600 hover:border-amber-300 hover:text-amber-700"
                  >
                    <Paperclip size={13} /> Open attachment
                  </a>
                )}
              </section>

              <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">Notes</h2>
                    <p className="text-[11px] text-stone-400 mt-0.5">Working context. Markdown is fine.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notes && (
                      <button
                        onClick={() => { setNotes(DEFAULT_NOTES); setNotesDirty(true) }}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-500 hover:border-amber-300 hover:text-amber-700"
                      >
                        Add headings
                      </button>
                    )}
                    <button
                      onClick={saveNotes}
                      disabled={!notesDirty || savingNotes}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                      style={{ background: 'var(--gold)' }}
                    >
                      <Save size={12} />{savingNotes ? 'Saving...' : 'Save notes'}
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full min-h-[320px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm leading-relaxed text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y font-mono"
                  placeholder={DEFAULT_NOTES}
                  value={notes}
                  onChange={e => { setNotes(e.target.value); setNotesDirty(true) }}
                />
              </section>

              <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={15} className="text-stone-400" />
                  <h2 className="text-sm font-bold text-stone-800">Comments</h2>
                  {comments.length > 0 && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                      {comments.length}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-stone-300 italic">No comments yet.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                          style={{ background: AUTHOR_COLORS[comment.author] ?? 'var(--gold)' }}
                        >
                          {comment.author[0]}
                        </div>
                        <div className="flex-1 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-semibold text-stone-700">{comment.author}</span>
                            <span className="text-[10px] text-stone-400">{fmtRelative(comment.created_at)}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 items-start pt-4 mt-4 border-t border-stone-100">
                  <select
                    value={commentAuthor}
                    onChange={e => setCommentAuthor(e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600 flex-shrink-0"
                  >
                    {TEAM_MEMBERS.map(member => <option key={member}>{member}</option>)}
                  </select>
                  <div className="flex-1">
                    <textarea
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                      rows={3}
                      placeholder="Leave a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim() || savingComment}
                        className="px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-40 font-medium"
                        style={{ background: 'var(--gold)' }}
                      >
                        {savingComment ? 'Posting...' : 'Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
