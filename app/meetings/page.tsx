'use client'
import { useState, useEffect, useRef } from 'react'
import { ClipboardList, Plus, X, Paperclip, Trash2, Download, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface MeetingFile {
  name: string
  path: string
  type: 'agenda' | 'notes' | 'other'
}

interface Meeting {
  id: number
  meeting_date: string
  meeting_time: string | null
  files: MeetingFile[]
  created_at: string
}

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white'
const SUPABASE_URL = 'https://uvzwhhwzelaelfhfkvdb.supabase.co'
const BUCKET = 'meeting-files'

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
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
  const [uploading, setUploading] = useState<'agenda' | 'notes' | 'other' | null>(null)

  const agendaRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLInputElement>(null)
  const otherRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('development_meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
    if (data) setMeetings(data as Meeting[])
  }

  function select(m: Meeting) {
    setSelected({ ...m, files: m.files ?? [] })
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

  async function uploadFile(type: 'agenda' | 'notes' | 'other', e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.length) return
    setUploading(type)
    const file = e.target.files[0]
    const path = `${selected.id}/${type}-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (!error) {
      // For agenda/notes, replace existing; for other, append
      const kept = type === 'other'
        ? selected.files
        : selected.files.filter(f => f.type !== type)
      // Remove old file from storage if replacing
      if (type !== 'other') {
        const old = selected.files.find(f => f.type === type)
        if (old) await supabase.storage.from(BUCKET).remove([old.path])
      }
      const newFiles: MeetingFile[] = [...kept, { name: file.name, path, type }]
      await supabase.from('development_meetings').update({ files: newFiles }).eq('id', selected.id)
      const updated = { ...selected, files: newFiles }
      setSelected(updated)
      setMeetings(prev => prev?.map(m => m.id === selected.id ? updated : m) ?? null)
    }
    setUploading(null)
    e.target.value = ''
  }

  async function deleteFile(f: MeetingFile) {
    if (!selected) return
    await supabase.storage.from(BUCKET).remove([f.path])
    const newFiles = selected.files.filter(x => x.path !== f.path)
    await supabase.from('development_meetings').update({ files: newFiles }).eq('id', selected.id)
    const updated = { ...selected, files: newFiles }
    setSelected(updated)
    setMeetings(prev => prev?.map(m => m.id === selected.id ? updated : m) ?? null)
  }

  async function deleteMeeting() {
    if (!selected || !confirm('Delete this meeting and all its files?')) return
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

  const agendaFile = selected?.files.find(f => f.type === 'agenda') ?? null
  const notesFile = selected?.files.find(f => f.type === 'notes') ?? null
  const otherFiles = selected?.files.filter(f => f.type === 'other') ?? []

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
          <div className="w-64 flex-shrink-0 space-y-1 overflow-y-auto">
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
                    {past.length > 0 && <div className="pt-3" />}
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
                <FileSlot
                  label="Agenda"
                  file={agendaFile}
                  uploading={uploading === 'agenda'}
                  onUpload={e => uploadFile('agenda', e)}
                  onDelete={() => agendaFile && deleteFile(agendaFile)}
                  inputRef={agendaRef}
                />

                {/* Meeting Notes */}
                <FileSlot
                  label="Meeting Notes"
                  file={notesFile}
                  uploading={uploading === 'notes'}
                  onUpload={e => uploadFile('notes', e)}
                  onDelete={() => notesFile && deleteFile(notesFile)}
                  inputRef={notesRef}
                />

                {/* Other attachments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      Other Attachments {otherFiles.length > 0 && `(${otherFiles.length})`}
                    </label>
                    <button onClick={() => otherRef.current?.click()} disabled={uploading === 'other'}
                      className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-amber-600 transition-colors disabled:opacity-40">
                      <Paperclip size={10} /> {uploading === 'other' ? 'Uploading…' : 'Attach'}
                    </button>
                    <input ref={otherRef} type="file" className="hidden" onChange={e => uploadFile('other', e)} />
                  </div>
                  {otherFiles.length > 0 ? (
                    <div className="space-y-1">
                      {otherFiles.map(f => (
                        <FileRow key={f.path} f={f} onDelete={() => deleteFile(f)} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-300 italic">No additional attachments</p>
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

function FileSlot({
  label, file, uploading, onUpload, onDelete, inputRef,
}: {
  label: string
  file: MeetingFile | null
  uploading: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: () => void
  inputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 block">{label}</label>
      {file ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 rounded-xl border border-stone-100">
          <Paperclip size={13} className="text-stone-400 flex-shrink-0" />
          <span className="text-sm text-stone-700 flex-1 truncate">{file.name}</span>
          <a href={publicUrl(file.path)} target="_blank" rel="noreferrer"
            className="p-1.5 text-stone-300 hover:text-amber-600 transition-colors" title="Download">
            <Download size={13} />
          </a>
          <button onClick={onDelete}
            className="p-1.5 text-stone-300 hover:text-red-400 transition-colors" title="Remove">
            <X size={13} />
          </button>
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="p-1.5 text-stone-300 hover:text-amber-600 transition-colors disabled:opacity-40" title="Replace">
            <Upload size={13} />
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-colors disabled:opacity-40">
          <Upload size={14} />
          {uploading ? 'Uploading…' : `Upload ${label}`}
        </button>
      )}
      <input ref={inputRef} type="file" className="hidden" onChange={onUpload} />
    </div>
  )
}

function FileRow({ f, onDelete }: { f: MeetingFile; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg">
      <Paperclip size={11} className="text-stone-400 flex-shrink-0" />
      <span className="text-sm text-stone-700 flex-1 truncate">{f.name}</span>
      <a href={publicUrl(f.path)} target="_blank" rel="noreferrer"
        className="p-1 text-stone-300 hover:text-amber-600 transition-colors">
        <Download size={12} />
      </a>
      <button onClick={onDelete} className="p-1 text-stone-300 hover:text-red-400 transition-colors">
        <X size={12} />
      </button>
    </div>
  )
}

function MeetingRow({ m, active, onClick }: { m: Meeting; active: boolean; onClick: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const files = m.files ?? []
  const hasAgenda = files.some(f => f.type === 'agenda')
  const hasNotes = files.some(f => f.type === 'notes')
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
      style={{ background: active ? 'rgba(181,161,133,0.12)' : 'transparent' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-stone-700">
          {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          {hasAgenda && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">Agenda</span>}
          {hasNotes && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">Notes</span>}
        </div>
      </div>
      {m.meeting_time && (
        <p className="text-[11px] text-stone-400 mt-0.5">{fmtTime(m.meeting_time)}</p>
      )}
    </button>
  )
}
