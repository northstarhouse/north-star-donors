'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cacheRead, cacheWrite, TTL_SHORT } from '@/lib/cache'

/* -- Types --------------------------------------------------- */
export type Channel     = 'Social' | 'Email' | 'Blog' | 'Events'
export type EntryStatus = 'draft' | 'scheduled' | 'published'

export interface CalEntry {
  id: number
  title: string
  channel: Channel
  date: string        // 'YYYY-MM-DD'
  notes: string | null
  status: EntryStatus
  created_at: string
}

interface CalendarComment {
  id: number
  month: string
  content: string
  created_at: string
}

/* -- Constants ---------------------------------------------- */
const CHANNELS: Channel[]      = ['Social', 'Email', 'Blog', 'Events']
const STATUSES: EntryStatus[]  = ['draft', 'scheduled', 'published']

const CH: Record<Channel, { bg: string; text: string; bar: string }> = {
  Social: { bg: 'bg-amber-100',   text: 'text-amber-800',   bar: '#f59e0b' },
  Email:  { bg: 'bg-emerald-100', text: 'text-emerald-800', bar: '#10b981' },
  Blog:   { bg: 'bg-blue-100',    text: 'text-blue-800',    bar: '#3b82f6' },
  Events: { bg: 'bg-orange-100',  text: 'text-orange-800',  bar: '#f97316' },
}

const STATUS_PILL: Record<EntryStatus, string> = {
  draft:     'bg-stone-100 text-stone-500',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

type RhythmRule = {
  week: 1 | 2 | 3 | 4
  weekday: 1 | 2 | 3 | 4 | 5
  channel: Channel
  title: string
  notes?: string
  monthTitles?: Partial<Record<number, string>>
}

const RHYTHM_RULES: RhythmRule[] = [
  { week: 1, weekday: 1, channel: 'Social', title: 'Wedding Posting', monthTitles: { 1: 'Wedding Posting + scheduling for the month' } },
  { week: 1, weekday: 2, channel: 'Social', title: 'Testimonial or Small History' },
  { week: 1, weekday: 4, channel: 'Email',  title: 'Newsletter', monthTitles: { 1: 'Monthly email send out' } },
  { week: 1, weekday: 5, channel: 'Social', title: 'Volunteer Outreach - Events' },
  { week: 2, weekday: 1, channel: 'Social', title: 'Sponsor Spotlight' },
  { week: 2, weekday: 2, channel: 'Events', title: 'Upcoming Event / Tours' },
  { week: 2, weekday: 4, channel: 'Blog',   title: 'Planning Update' },
  { week: 2, weekday: 5, channel: 'Social', title: 'Volunteer Outreach - Restoration' },
  { week: 3, weekday: 1, channel: 'Events', title: 'Upcoming Event or Wedding' },
  { week: 3, weekday: 2, channel: 'Social', title: 'OPEN', notes: 'Open slot' },
  { week: 3, weekday: 4, channel: 'Blog',   title: 'History Update' },
  { week: 3, weekday: 5, channel: 'Social', title: 'Volunteer Outreach - Garden' },
  { week: 4, weekday: 1, channel: 'Social', title: 'OPEN', notes: 'Open slot' },
  { week: 4, weekday: 2, channel: 'Social', title: 'Restoration Video' },
  { week: 4, weekday: 4, channel: 'Email',  title: 'Development / Board Update' },
  { week: 4, weekday: 5, channel: 'Social', title: 'Volunteer Outreach - Docents' },
]

/* -- Helpers ------------------------------------------------ */
const pad = (n: number) => String(n).padStart(2, '0')

function firstThursdayDay(year: number, month: number): number {
  const d = new Date(year, month, 1)
  while (d.getDay() !== 4) d.setDate(d.getDate() + 1)
  return d.getDate()
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number): number | null {
  const first = new Date(year, month, 1)
  const offset = (weekday - first.getDay() + 7) % 7
  const day = 1 + offset + (occurrence - 1) * 7
  const max = new Date(year, month + 1, 0).getDate()
  return day <= max ? day : null
}

const inCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white'

/* -- Main component ----------------------------------------- */
export default function ContentCalendar() {
  const now   = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [entries, setEntries]         = useState<CalEntry[]>([])
  const [loadingEnt, setLoadingEnt]   = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [showAdd, setShowAdd]   = useState(false)
  const [addForm, setAddForm]   = useState({ title: '', channel: 'Social' as Channel, notes: '', status: 'draft' as EntryStatus })
  const [addSaving, setAddSaving] = useState(false)

  const [editId, setEditId]     = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', channel: 'Social' as Channel, notes: '', status: 'draft' as EntryStatus })
  const [editSaving, setEditSaving] = useState(false)

  const [comments, setComments] = useState<CalendarComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [seededMonthKey, setSeededMonthKey] = useState<string | null>(null)

  const monthKey = `${year}-${pad(month + 1)}`

  /* -- Load -------------------------------------------------- */
  const loadEntries = useCallback(() => {
    const ck = `cal:${monthKey}`
    const cached = cacheRead<CalEntry[]>(ck)
    if (cached) { setEntries(cached); setLoadingEnt(false) }

    const start = `${monthKey}-01`
    const nextMonthStart = `${year + (month === 11 ? 1 : 0)}-${pad(((month + 1) % 12) + 1)}-01`
    supabase.from('content_calendar').select('*')
      .gte('date', start).lt('date', nextMonthStart)
      .order('date').order('created_at')
      .then(({ data }) => {
        if (data) { setEntries(data as CalEntry[]); cacheWrite(ck, data, TTL_SHORT) }
        setLoadingEnt(false)
      })
  }, [monthKey])

  useEffect(() => { loadEntries() }, [loadEntries])

  useEffect(() => {
    setCommentsLoading(true)
    supabase.from('calendar_comments').select('*').eq('month', monthKey).order('created_at', { ascending: false })
      .then(({ data }) => {
        setComments((data as CalendarComment[]) ?? [])
        setCommentsLoading(false)
      })
  }, [monthKey])

  /* -- Navigation -------------------------------------------- */
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  /* -- Actions ----------------------------------------------- */
  async function saveAdd() {
    if (!addForm.title || !selectedDay) return
    setAddSaving(true)
    const date = `${monthKey}-${pad(selectedDay)}`
    const { data } = await supabase.from('content_calendar').insert({
      title: addForm.title.trim(), channel: addForm.channel,
      date, notes: addForm.notes.trim() || null, status: addForm.status,
    }).select().single()
    if (data) setEntries(prev => [...prev, data as CalEntry].sort((a,b) => a.date.localeCompare(b.date) || a.id - b.id))
    setAddForm({ title: '', channel: 'Social', notes: '', status: 'draft' })
    setShowAdd(false)
    setAddSaving(false)
  }

  async function saveEdit() {
    if (!editId) return
    setEditSaving(true)
    await supabase.from('content_calendar').update({
      title: editForm.title, channel: editForm.channel,
      notes: editForm.notes || null, status: editForm.status,
    }).eq('id', editId)
    setEntries(prev => prev.map(e => e.id === editId ? { ...e, ...editForm } : e))
    setEditId(null)
    setEditSaving(false)
  }

  async function deleteEntry(id: number) {
    await supabase.from('content_calendar').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function toggleScheduled(entry: CalEntry) {
    const next: EntryStatus = entry.status === 'scheduled' ? 'draft' : 'scheduled'
    await supabase.from('content_calendar').update({ status: next }).eq('id', entry.id)
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: next } : e))
  }

  async function saveComment() {
    if (!commentDraft.trim()) return
    setCommentSaving(true)
    const { data } = await supabase.from('calendar_comments').insert({
      month: monthKey,
      content: commentDraft.trim(),
    }).select().single()
    if (data) setComments(prev => [data as CalendarComment, ...prev])
    setCommentDraft('')
    setCommentSaving(false)
  }

  /* -- Derived ----------------------------------------------- */
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const uniqueEntries = entries.filter((entry, index, arr) =>
    arr.findIndex(other =>
      other.date === entry.date &&
      other.title.trim().toLowerCase() === entry.title.trim().toLowerCase() &&
      other.channel === entry.channel &&
      other.status === entry.status
    ) === index
  )

  const byDay: Record<string, CalEntry[]> = {}
  uniqueEntries.forEach(e => { if (!byDay[e.date]) byDay[e.date] = []; byDay[e.date].push(e) })

  const ftDay = firstThursdayDay(year, month)
  const todayD = now.getDate()
  const isNow  = year === now.getFullYear() && month === now.getMonth()
  const monthRhythm = RHYTHM_RULES.map(rule => ({
    ...rule,
    title: rule.monthTitles?.[month] ?? rule.title,
    day: nthWeekdayOfMonth(year, month, rule.weekday, rule.week),
  })).filter(rule => rule.day != null)

  const selStr  = selectedDay ? `${monthKey}-${pad(selectedDay)}` : null
  const selEnts = selStr ? (byDay[selStr] ?? []) : []

  async function applyMonthTemplate() {
    const start = `${monthKey}-01`
    const nextMonthStart = `${year + (month === 11 ? 1 : 0)}-${pad(((month + 1) % 12) + 1)}-01`
    const { data: existingRows } = await supabase
      .from('content_calendar')
      .select('date, title')
      .gte('date', start)
      .lt('date', nextMonthStart)

    const existingKeys = new Set((existingRows ?? []).map(e => `${e.date}|${String(e.title).trim().toLowerCase()}`))
    const missing = monthRhythm.map(rule => ({
      title: rule.title,
      channel: rule.channel,
      date: `${monthKey}-${pad(rule.day as number)}`,
      notes: rule.notes || null,
      status: 'draft' as EntryStatus,
    })).filter(entry => !existingKeys.has(`${entry.date}|${entry.title.trim().toLowerCase()}`))

    if (missing.length === 0) return
    setTemplateSaving(true)
    await supabase.from('content_calendar').insert(missing)
    setTemplateSaving(false)
    loadEntries()
  }

  useEffect(() => {
    if (loadingEnt || templateSaving || seededMonthKey === monthKey) return
    setSeededMonthKey(monthKey)
    void applyMonthTemplate()
  }, [loadingEnt, templateSaving, seededMonthKey, monthKey])

  /* -- Render ------------------------------------------------ */
  return (
    <div className="mt-5 flex gap-4 items-start">

      {/* ---- Main calendar col ---- */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* Calendar card */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
            <h2 className="text-sm font-bold text-stone-800">{MONTHS[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(null) }}
                className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 font-medium">
                Today
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50/60">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return (
                <div key={`e${i}`} className="min-h-[90px] border-r border-b border-stone-50 bg-stone-50/30" />
              )
              const dayStr   = `${monthKey}-${pad(day)}`
              const dayEnts  = byDay[dayStr] ?? []
              const isToday  = isNow && day === todayD
              const isMtg    = day === ftDay
              const isSel    = selectedDay === day

              return (
                <button key={day}
                  onClick={() => { setSelectedDay(p => p === day ? null : day); setShowAdd(false); setEditId(null) }}
                  className={`min-h-[90px] border-r border-b border-stone-50 p-1.5 text-left align-top transition-colors ${
                    isSel ? 'bg-amber-50' : 'hover:bg-stone-50/80'
                  }`}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                      isToday ? 'bg-amber-400 text-white' : 'text-stone-500'
                    }`}>{day}</span>
                    {isMtg && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded leading-none">MTG</span>}
                  </div>
                  {dayEnts.slice(0, 3).map(e => (
                    <div key={e.id}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded mb-0.5 truncate ${CH[e.channel].bg} ${CH[e.channel].text}`}>
                      {e.title}
                    </div>
                  ))}
                  {dayEnts.length > 3 && (
                    <p className="text-[10px] text-stone-400 pl-1">+{dayEnts.length - 3}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Month Comments</p>
              <h3 className="text-sm font-bold text-stone-800 mt-1">{MONTHS[month]} {year}</h3>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl border border-stone-200 p-3 mb-4">
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white"
              rows={3}
              placeholder={`Add a comment for ${MONTHS[month]}...`}
              value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveComment}
                disabled={commentSaving || !commentDraft.trim()}
                className="px-4 py-1.5 text-white text-xs rounded-lg font-medium disabled:opacity-40"
                style={{ background: 'var(--gold)' }}
              >
                {commentSaving ? 'Saving...' : 'Post Comment'}
              </button>
            </div>
          </div>

          {commentsLoading ? (
            <p className="text-sm text-stone-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-stone-300 italic">No month comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-3">
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  <p className="text-[10px] text-stone-400 mt-2">
                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ---- Sidebar ---- */}
      <div className="w-72 flex-shrink-0 space-y-3">
        {selectedDay && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Selected Day</p>
                <h3 className="text-sm font-bold text-stone-800 mt-1">{MONTHS[month]} {selectedDay}, {year}</h3>
                {selectedDay === ftDay && (
                  <p className="text-[11px] text-emerald-700 mt-1">Team Meeting - 10am</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setShowAdd(v => !v); setEditId(null); setAddForm({ title: '', channel: 'Social', notes: '', status: 'draft' }) }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white rounded-lg font-medium"
                  style={{ background: 'var(--gold)' }}>
                  <Plus size={11} /> Add
                </button>
                <button onClick={() => { setSelectedDay(null); setShowAdd(false); setEditId(null) }}
                  className="p-1.5 text-stone-300 hover:text-stone-500 rounded-lg hover:bg-stone-100">
                  <X size={14} />
                </button>
              </div>
            </div>

            {showAdd && (
              <div className="bg-stone-50 rounded-xl border border-stone-200 p-3 mb-4 space-y-2.5">
                <input autoFocus className={inCls} placeholder="Title..."
                  value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) saveAdd() }} />
                <div className="grid grid-cols-2 gap-2">
                  <select className={inCls} value={addForm.channel}
                    onChange={e => setAddForm(f => ({ ...f, channel: e.target.value as Channel }))}>
                    {CHANNELS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select className={inCls} value={addForm.status}
                    onChange={e => setAddForm(f => ({ ...f, status: e.target.value as EntryStatus }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea className={inCls + ' resize-none'} rows={2} placeholder="Notes..."
                  value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={saveAdd} disabled={addSaving || !addForm.title}
                    className="px-4 py-1.5 text-white text-xs rounded-lg font-medium disabled:opacity-40"
                    style={{ background: 'var(--gold)' }}>
                    {addSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setShowAdd(false)}
                    className="px-3 py-1.5 bg-stone-100 text-stone-500 text-xs rounded-lg hover:bg-stone-200">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!loadingEnt && selEnts.length === 0 && !showAdd && (
              <p className="text-xs text-stone-300 italic py-4">No content planned. Click Add to create an entry.</p>
            )}
            <div className="space-y-2">
              {selEnts.map(e => {
                const isEdit = editId === e.id
                return (
                  <div key={e.id} className={`flex items-start gap-3 rounded-lg px-2 -mx-2 ${e.status === 'scheduled' ? 'border-l-2 border-amber-400 pl-2' : ''}`}>
                    <span className="mt-2 w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CH[e.channel].bar }} />
                    {isEdit ? (
                      <div className="flex-1 bg-stone-50 rounded-xl border border-stone-200 p-3 space-y-2">
                        <input className={inCls} value={editForm.title}
                          onChange={ev => setEditForm(f => ({ ...f, title: ev.target.value }))} />
                        <div className="grid grid-cols-2 gap-2">
                          <select className={inCls} value={editForm.channel}
                            onChange={ev => setEditForm(f => ({ ...f, channel: ev.target.value as Channel }))}>
                            {CHANNELS.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <select className={inCls} value={editForm.status}
                            onChange={ev => setEditForm(f => ({ ...f, status: ev.target.value as EntryStatus }))}>
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <textarea className={inCls + ' resize-none'} rows={2} value={editForm.notes}
                          onChange={ev => setEditForm(f => ({ ...f, notes: ev.target.value }))} />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={editSaving}
                            className="px-3 py-1 text-white text-xs rounded-lg font-medium disabled:opacity-40"
                            style={{ background: 'var(--gold)' }}>
                            {editSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="px-3 py-1 bg-stone-100 text-stone-500 text-xs rounded-lg hover:bg-stone-200">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-start justify-between gap-2 py-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-800 leading-snug">{e.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CH[e.channel].bg} ${CH[e.channel].text}`}>{e.channel}</span>
                            <label className="flex items-center gap-1 cursor-pointer select-none" onClick={ev => ev.stopPropagation()}>
                              <input type="checkbox" checked={e.status === 'scheduled'} onChange={() => toggleScheduled(e)}
                                className="w-3 h-3 accent-amber-500 cursor-pointer" />
                            </label>
                          </div>
                          {e.notes && <p className="text-xs text-stone-400 mt-1 leading-snug">{e.notes}</p>}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => { setEditId(e.id); setEditForm({ title: e.title, channel: e.channel, notes: e.notes ?? '', status: e.status }); setShowAdd(false) }}
                            className="p-1.5 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => deleteEntry(e.id)}
                            className="p-1.5 text-stone-200 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Channel legend */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Channels</p>
          <div className="space-y-1.5">
            {CHANNELS.map(c => (
              <div key={c} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CH[c].bar }} />
                <span className="text-xs text-stone-600">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Add */}
        <QuickAdd monthKey={monthKey} onAdded={loadEntries} />

      </div>
    </div>
  )
}

/* -- Quick Add widget --------------------------------------- */
function QuickAdd({ monthKey, onAdded }: { monthKey: string; onAdded: () => void }) {
  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState({ title: '', channel: 'Social' as Channel, date: `${monthKey}-01`, notes: '', status: 'draft' as EntryStatus })

  useEffect(() => {
    setForm(f => ({ ...f, date: `${monthKey}-01` }))
  }, [monthKey])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.date) return
    setSaving(true)
    await supabase.from('content_calendar').insert({
      title: form.title.trim(), channel: form.channel,
      date: form.date, notes: form.notes.trim() || null, status: form.status,
    })
    setSaving(false)
    setForm(f => ({ ...f, title: '', notes: '' }))
    setOpen(false)
    onAdded()
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Quick Add</p>
        <button onClick={() => setOpen(v => !v)}
          className="p-1 text-stone-300 hover:text-stone-500 rounded transition-colors">
          {open ? <X size={13} /> : <Plus size={13} />}
        </button>
      </div>
      {open && (
        <form onSubmit={save} className="space-y-2">
          <input required autoFocus
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white"
            placeholder="Title..."
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input required type="date"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white"
            value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-1.5">
            <select
              className="w-full border border-stone-200 rounded-lg px-2 py-2 text-xs focus:outline-none text-stone-700 bg-white"
              value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as Channel }))}>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              className="w-full border border-stone-200 rounded-lg px-2 py-2 text-xs focus:outline-none text-stone-700 bg-white"
              value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EntryStatus }))}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <textarea
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-stone-600 bg-white resize-none"
            rows={2} placeholder="Notes..."
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <button type="submit" disabled={saving || !form.title || !form.date}
            className="w-full py-1.5 text-white text-xs rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'var(--gold)' }}>
            {saving ? 'Adding...' : 'Add Entry'}
          </button>
        </form>
      )}
    </div>
  )
}

