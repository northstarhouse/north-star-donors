'use client'
import { useState, useEffect, useRef } from 'react'
import { ClipboardList, Plus, X, Paperclip, Trash2, Download, Save, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface MeetingFile { name: string; path: string }

interface Meeting {
  id: number
  meeting_date: string
  meeting_time: string | null
  agenda: string | null
  notes: string | null
  files: MeetingFile[]
  created_at: string
}

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white'
const SUPABASE_URL = 'https://uvzwhhwzelaelfhfkvdb.supabase.co'
const BUCKET = 'meeting-files'

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtTime(t: string | null) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${((h % 12) || 12)}:${String(m).padStart(2, '0')} ${ampm}`
}

function publicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [selected, setSelected] = useState<Meeting | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [creating, setCreating] = useState(false)

  const [agenda, setAgenda] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState<'agenda' | 'notes' | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('development_meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
    if (data) setMeetings(data as Meeting[])
  }

  function select(m: Meeting) {
    setSelected(m)
    setAgenda(m.agenda ?? '')
    setNotes(m.notes ?? '')
  }

  async function createMeeting() {
    if (!newDate) return
    setCreating(true)
    const { data } = await supabase
      .from('development_meetings')
      .insert({ meeting_date: newDate, meeting_time: newTime || null, files: [] })
      .select()
      .single()
    if (data) {
      await load()
      select(data as Meeting)
      setNewOpen(false)
      setNewDate('')
      setNewTime('')
    }
    setCreating(false)
  }

  async function saveField(field: 'agenda' | 'notes', value: string) {
    if (!selected) return
    setSaving(field)
    await supabase.from('development_meetings').update({ [field]: value }).eq('id', selected.id)
    setSaving(null)
    setMeetings(prev => prev?.map(m => m.id === selected.id ? { ...m, [field]: value } : m) ?? null)
    setSelected(prev => prev ? { ...prev, [field]: value } : null)
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.length) return
    setUploading(true)
    const file = e.target.files[0]
    const path = `${selected.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (!error) {
      const newFiles = [...(selected.files ?? []), { name: file.name, path }]
      await supabase.from('development_meetings').update({ files: newFiles }).eq('id', selected.id)
      const updated = { ...selected, files: newFiles }
      setSelected(updated)
      setMeetings(prev => prev?.map(m => m.id === selected.id ? updated : m) ?? null)
    }
    setUploading(false)
    e.target.value = ''
  }

  async function deleteFile(path: string) {
    if (!selected) return
    await supabase.storage.from(BUCKET).remove([path])
    const newFiles = selected.files.filter(f => f.path !== path)
    await supabase.from('development_meetings').update({ files: newFiles }).eq('id', selected.id)
    const updated = { ...selected, files: newFiles }
    setSelected(updated)
    setMeetings(prev => prev?.map(m => m.id === selected.id ? updated : m) ?? null)
  }

  async function deleteMeeting() {
    if (!selected || !confirm('Delete this meeting?')) return
    if (selected.files?.length) {
      await supabase.storage.from(BUCKET).remove(selected.files.map(f => f.path))
    }
    await supabase.from('development_meetings').delete().eq('id', selected.id)
    setSelected(null)
    await load()
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = meetings?.filter(m => m.meeting_date >= today) ?? []
  const past = meetings?.filter(m => m.meeting_date < today) ?? []

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="meetings" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
              <ClipboardList size={16} className="text-stone-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Development Meetings
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">Agendas, notes, and attachments</p>
            </div>
          </div>
          <button onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm rounded-lg font-medium"
            style={{ background: 'var(--gold)' }}>
            <Plus size={14} /> New Meeting
          </button>
        </div>

        <div className="px-8 pb-8 flex gap-5 flex-1 min-h-0">
          {/* Meeting list */}
          <div className="w-72 flex-shrink-0 space-y-1 overflow-y-auto">
            {meetings === null ? (
              <p className="text-sm text-stone-400 py-8 text-center">Loading...</p>
            ) : meetings.length === 0 ? (
              <p className="text-sm text-stone-400 py-8 text-center">No meetings yet.</p>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-1 pb-1">Upcoming</p>
                    {upcoming.map(m => <MeetingRow key={m.id} m={m} active={selected?.id === m.id} onClick={() => select(m)} />)}
                    {past.length > 0 && <div className="pt-2" />}
                  </>
                )}
                {past.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-1 pb-1">Past</p>
                    {past.map(m => <MeetingRow key={m.id} m={m} active={selected?.id === m.id} onClick={() => select(m)} />)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="flex-1 bg-white rounded-xl border border-stone-200 shadow-sm overflow-y-auto">
              {/* Meeting header */}
              <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
                    {fmtDate(selected.meeting_date)}
                  </p>
                  {selected.meeting_time && (
                    <p className="text-sm text-stone-400 mt-0.5">{fmtTime(selected.meeting_time)}</p>
                  )}
                </div>
                <button onClick={deleteMeeting}
                  className="p-1.5 text-stone-300 hover:text-red-400 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Agenda */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Agenda</label>
                    <button onClick={() => saveField('agenda', agenda)} disabled={saving === 'agenda'}
                      className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-amber-600 transition-colors disabled:opacity-40">
                      <Save size={10} /> {saving === 'agenda' ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  <textarea
                    className={inputCls + ' resize-none'}
                    rows={6}
                    placeholder="Meeting agenda…"
                    value={agenda}
                    onChange={e => setAgenda(e.target.value)}
                    onBlur={() => saveField('agenda', agenda)}
                  />
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Notes & Minutes</label>
                    <button onClick={() => saveField('notes', notes)} disabled={saving === 'notes'}
                      className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-amber-600 transition-colors disabled:opacity-40">
                      <Save size={10} /> {saving === 'notes' ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  <textarea
                    className={inputCls + ' resize-none'}
                    rows={8}
                    placeholder="Meeting notes and minutes…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={() => saveField('notes', notes)}
                  />
                </div>

                {/* Files */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      Attachments {selected.files?.length > 0 && `(${selected.files.length})`}
                    </label>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-amber-600 transition-colors disabled:opacity-40">
                      <Paperclip size={10} /> {uploading ? 'Uploading…' : 'Attach file'}
                    </button>
                    <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} />
                  </div>
                  {selected.files?.length > 0 ? (
                    <div className="space-y-1">
                      {selected.files.map(f => (
                        <div key={f.path} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg">
                          <Paperclip size={11} className="text-stone-400 flex-shrink-0" />
                          <span className="text-sm text-stone-700 flex-1 truncate">{f.name}</span>
                          <a href={publicUrl(f.path)} target="_blank" rel="noreferrer"
                            className="p-1 text-stone-300 hover:text-amber-600 transition-colors">
                            <Download size={12} />
                          </a>
                          <button onClick={() => deleteFile(f.path)}
                            className="p-1 text-stone-300 hover:text-red-400 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-300 italic">No files attached</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-300 text-sm">
              Select a meeting to view details
            </div>
          )}
        </div>
      </div>

      {/* New meeting modal */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-800 text-sm">New Meeting</h2>
              <button onClick={() => setNewOpen(false)} className="p-1.5 text-stone-300 hover:text-stone-500 rounded-lg">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Date</label>
                <input type="date" className={inputCls} value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Time (optional)</label>
                <input type="time" className={inputCls} value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={createMeeting} disabled={!newDate || creating}
                  className="flex-1 py-2 text-white text-sm rounded-lg font-medium disabled:opacity-40"
                  style={{ background: 'var(--gold)' }}>
                  {creating ? 'Creating…' : 'Create Meeting'}
                </button>
                <button onClick={() => setNewOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MeetingRow({ m, active, onClick }: { m: Meeting; active: boolean; onClick: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const isUpcoming = m.meeting_date >= today
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
      style={{ background: active ? 'rgba(181,161,133,0.12)' : 'transparent' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-stone-700">
          {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {m.files?.length > 0 && (
          <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
            <Paperclip size={9} />{m.files.length}
          </span>
        )}
      </div>
      {m.meeting_time && (
        <p className="text-[11px] text-stone-400 mt-0.5">{fmtTime(m.meeting_time)}</p>
      )}
      {m.agenda && (
        <p className="text-[11px] text-stone-400 mt-0.5 truncate">{m.agenda.split('\n')[0]}</p>
      )}
    </button>
  )
}
