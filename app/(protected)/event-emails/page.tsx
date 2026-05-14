'use client'
import { useState, useEffect, useRef } from 'react'
import { Mail, Copy, Check, ChevronDown, ChevronUp, CalendarDays, X, Plus, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface EventEmailGroup {
  id: string
  name: string
  recipients: { name: string; email: string }[]
  created_at: string
}

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700'
const goldBtn = { background: 'var(--gold)' }

export default function EventEmailsPage() {
  const [groups, setGroups] = useState<EventEmailGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [savingGroup, setSavingGroup] = useState(false)

  const [newRecipName, setNewRecipName] = useState<Record<string, string>>({})
  const [newRecipEmail, setNewRecipEmail] = useState<Record<string, string>>({})
  const [csvPreview, setCsvPreview] = useState<{ groupId: string; rows: { name: string; email: string }[] } | null>(null)
  const [importingCsv, setImportingCsv] = useState(false)
  const csvInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [modal, setModal] = useState<EventEmailGroup | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('event_email_groups').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setGroups(data as EventEmailGroup[]); setLoading(false) })
  }, [])

  async function createGroup() {
    if (!newGroupName.trim()) return
    setSavingGroup(true)
    const { data } = await supabase.from('event_email_groups').insert({ name: newGroupName.trim(), recipients: [] }).select().single()
    if (data) setGroups(prev => [data as EventEmailGroup, ...prev])
    setNewGroupName('')
    setShowNewGroup(false)
    setSavingGroup(false)
  }

  async function deleteGroup(id: string) {
    if (!confirm('Delete this event email group?')) return
    await supabase.from('event_email_groups').delete().eq('id', id)
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  async function addRecipient(group: EventEmailGroup) {
    const email = (newRecipEmail[group.id] ?? '').trim()
    const name = (newRecipName[group.id] ?? '').trim()
    if (!email) return
    const updated = [...group.recipients, { name, email }]
    await supabase.from('event_email_groups').update({ recipients: updated }).eq('id', group.id)
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, recipients: updated } : g))
    setNewRecipName(prev => ({ ...prev, [group.id]: '' }))
    setNewRecipEmail(prev => ({ ...prev, [group.id]: '' }))
  }

  async function removeRecipient(group: EventEmailGroup, idx: number) {
    const updated = group.recipients.filter((_, i) => i !== idx)
    await supabase.from('event_email_groups').update({ recipients: updated }).eq('id', group.id)
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, recipients: updated } : g))
  }

  function parseCsv(text: string): { name: string; email: string }[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
    const emailCol = headers.findIndex(h => h === 'email' || h === 'email address' || h === 'e-mail')
    const firstNameCol = headers.findIndex(h => h === 'first name' || h === 'firstname' || h === 'first')
    const lastNameCol = headers.findIndex(h => h === 'last name' || h === 'lastname' || h === 'last')
    const nameCol = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname')
    if (emailCol === -1) return []
    return lines.slice(1).flatMap(line => {
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
      const email = cols[emailCol] ?? ''
      if (!email || !email.includes('@')) return []
      let name = ''
      if (nameCol !== -1) name = cols[nameCol] ?? ''
      else if (firstNameCol !== -1 || lastNameCol !== -1)
        name = [cols[firstNameCol] ?? '', cols[lastNameCol] ?? ''].filter(Boolean).join(' ')
      return [{ name, email }]
    })
  }

  function handleCsvFile(group: EventEmailGroup, file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const rows = parseCsv(e.target?.result as string)
      if (rows.length === 0) { alert('No valid email rows found. Make sure the CSV has an "Email" column header.'); return }
      setCsvPreview({ groupId: group.id, rows })
    }
    reader.readAsText(file)
  }

  async function confirmCsvImport() {
    if (!csvPreview) return
    setImportingCsv(true)
    const group = groups.find(g => g.id === csvPreview.groupId)
    if (!group) { setImportingCsv(false); return }
    const existing = new Set(group.recipients.map(r => r.email.toLowerCase()))
    const newRows = csvPreview.rows.filter(r => !existing.has(r.email.toLowerCase()))
    const updated = [...group.recipients, ...newRows]
    await supabase.from('event_email_groups').update({ recipients: updated }).eq('id', group.id)
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, recipients: updated } : g))
    setExpandedGroups(prev => { const n = new Set(prev); n.add(group.id); return n })
    setCsvPreview(null)
    setImportingCsv(false)
  }

  function copyEmails(group: EventEmailGroup) {
    navigator.clipboard.writeText(group.recipients.map(r => r.email).join(', '))
    setCopied(group.id)
    setTimeout(() => setCopied(null), 2000)
  }

  function openModal(group: EventEmailGroup) {
    setModal(group)
    setSubject(`${group.name} — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
    setBody('')
    setSent(false)
    setSendError(null)
  }

  async function handleSend() {
    if (!modal) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('https://uvzwhhwzelaelfhfkvdb.supabase.co/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ to: modal.recipients.map(r => r.email), subject, body }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Send failed')
      setSent(true)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="event-emails" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <CalendarDays size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                  Event Email Lists
                </h1>
                <p className="text-xs text-stone-400 mt-0.5">Custom email lists for events · click a group to email them</p>
              </div>
            </div>
            <button
              onClick={() => { setShowNewGroup(true); setNewGroupName('') }}
              className="flex items-center gap-1.5 px-3 py-2 text-white text-sm rounded-lg font-medium"
              style={goldBtn}
            >
              <Plus size={13} /> New Group
            </button>
          </div>
        </div>

        <div className="px-8 pb-8">
          {showNewGroup && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex gap-2 mb-4">
              <input
                autoFocus
                className={inputCls}
                placeholder="Group name (e.g. Spring Gala, Board Dinner...)"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createGroup(); if (e.key === 'Escape') setShowNewGroup(false) }}
              />
              <button onClick={createGroup} disabled={!newGroupName.trim() || savingGroup}
                className="px-4 py-2 text-white text-sm rounded-lg disabled:opacity-40 whitespace-nowrap font-medium"
                style={goldBtn}>
                {savingGroup ? 'Creating…' : 'Create'}
              </button>
              <button onClick={() => setShowNewGroup(false)}
                className="px-4 py-2 bg-stone-100 text-stone-500 text-sm rounded-lg hover:bg-stone-200">
                Cancel
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
          ) : groups.length === 0 && !showNewGroup ? (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-5 py-16 text-center">
              <CalendarDays size={28} className="text-stone-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-stone-400 italic">No event email groups yet.</p>
              <button onClick={() => setShowNewGroup(true)}
                className="mt-4 px-4 py-2 text-white text-sm rounded-lg font-medium"
                style={goldBtn}>
                Create your first group
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => {
                const isOpen = expandedGroups.has(group.id)
                return (
                  <div key={group.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3.5"
                      style={{ borderBottom: isOpen ? '0.5px solid #f0ece6' : 'none', background: '#fdfcfb' }}>
                      <button className="flex-1 flex items-center gap-3 text-left"
                        onClick={() => setExpandedGroups(prev => { const n = new Set(prev); n.has(group.id) ? n.delete(group.id) : n.add(group.id); return n })}>
                        <span className="text-sm font-semibold text-stone-800">{group.name}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                          {group.recipients.length} recipient{group.recipients.length !== 1 ? 's' : ''}
                        </span>
                        <span className="ml-auto text-stone-300">
                          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </span>
                      </button>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <input
                          type="file"
                          accept=".csv"
                          ref={el => { csvInputRefs.current[group.id] = el }}
                          style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(group, f); e.target.value = '' }}
                        />
                        <button onClick={() => csvInputRefs.current[group.id]?.click()}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 transition-colors">
                          <Upload size={11} /> Import CSV
                        </button>
                        <button onClick={() => copyEmails(group)} disabled={group.recipients.length === 0}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-colors">
                          {copied === group.id ? <><Check size={11} className="text-emerald-500" /> Copied</> : <><Copy size={11} /> Copy emails</>}
                        </button>
                        <button onClick={() => openModal(group)} disabled={group.recipients.length === 0}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-white font-medium disabled:opacity-40 transition-colors"
                          style={goldBtn}>
                          <Mail size={11} /> Email group
                        </button>
                        <button onClick={() => deleteGroup(group.id)}
                          className="p-1.5 text-stone-300 hover:text-red-400 rounded-lg transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div>
                        {group.recipients.map((r, i) => (
                          <div key={i} className="flex items-center gap-3 px-5 py-2.5"
                            style={{ borderBottom: '0.5px solid #f5f1eb' }}>
                            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                              style={{ background: 'var(--gold)' }}>
                              {(r.name?.[0] ?? r.email[0] ?? '?').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-stone-700">{r.name || <span className="italic text-stone-300 text-xs">No name</span>}</span>
                            </div>
                            <span className="text-xs text-stone-400 truncate max-w-[220px]">{r.email}</span>
                            <button onClick={() => removeRecipient(group, i)}
                              className="p-1 text-stone-200 hover:text-red-400 rounded transition-colors flex-shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="px-5 py-3 flex gap-2 bg-stone-50"
                          style={{ borderTop: group.recipients.length > 0 ? '0.5px solid #f0ece6' : 'none' }}>
                          <input className={inputCls + ' text-xs py-1.5'} placeholder="Name"
                            value={newRecipName[group.id] ?? ''}
                            onChange={e => setNewRecipName(prev => ({ ...prev, [group.id]: e.target.value }))} />
                          <input className={inputCls + ' text-xs py-1.5'} placeholder="Email"
                            value={newRecipEmail[group.id] ?? ''}
                            onChange={e => setNewRecipEmail(prev => ({ ...prev, [group.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') addRecipient(group) }} />
                          <button onClick={() => addRecipient(group)} disabled={!(newRecipEmail[group.id] ?? '').trim()}
                            className="px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-40 whitespace-nowrap font-medium"
                            style={goldBtn}>
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* CSV preview modal */}
      {csvPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div>
                <h2 className="font-semibold text-stone-800 text-sm">Import from CSV</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {csvPreview.rows.length} row{csvPreview.rows.length !== 1 ? 's' : ''} found
                  {(() => {
                    const group = groups.find(g => g.id === csvPreview.groupId)
                    const existing = new Set(group?.recipients.map(r => r.email.toLowerCase()) ?? [])
                    const dupes = csvPreview.rows.filter(r => existing.has(r.email.toLowerCase())).length
                    return dupes > 0 ? ` · ${dupes} duplicate${dupes !== 1 ? 's' : ''} will be skipped` : ''
                  })()}
                </p>
              </div>
              <button onClick={() => setCsvPreview(null)} className="p-1.5 text-stone-300 hover:text-stone-500 rounded-lg">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-3 max-h-72 overflow-y-auto space-y-1">
              {csvPreview.rows.map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-stone-50">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'var(--gold)' }}>
                    {(r.name?.[0] ?? r.email[0] ?? '?').toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-stone-700 flex-1 truncate">{r.name || <span className="text-stone-300 italic">No name</span>}</span>
                  <span className="text-[11px] text-stone-400 truncate max-w-[180px]">{r.email}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 flex gap-2 border-t border-stone-100">
              <button onClick={confirmCsvImport} disabled={importingCsv}
                className="flex-1 py-2 text-white text-sm rounded-lg font-medium disabled:opacity-40"
                style={goldBtn}>
                {importingCsv ? 'Importing…' : `Import ${csvPreview.rows.length} recipient${csvPreview.rows.length !== 1 ? 's' : ''}`}
              </button>
              <button onClick={() => setCsvPreview(null)} disabled={importingCsv}
                className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200 disabled:opacity-40">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div>
                <h2 className="font-semibold text-stone-800 text-sm">Email {modal.name}</h2>
                <p className="text-xs text-stone-400 mt-0.5">{modal.recipients.length} recipient{modal.recipients.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 text-stone-300 hover:text-stone-500 rounded-lg">
                <X size={15} />
              </button>
            </div>

            {sent ? (
              <div className="px-5 py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Check size={20} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-stone-700">Email sent!</p>
                <p className="text-xs text-stone-400 mt-1">Delivered to {modal.recipients.length} recipient{modal.recipients.length !== 1 ? 's' : ''} from info@northstarhouse.org</p>
                <button onClick={() => setModal(null)} className="mt-4 px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg">Done</button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Recipients ({modal.recipients.length})</p>
                  <div className="bg-stone-50 rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1">
                    {modal.recipients.map((r, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-stone-700 flex-shrink-0">{r.name || '—'}</span>
                        <span className="text-[10px] text-stone-400 truncate">{r.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Subject</label>
                  <input className={inputCls} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line..." />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Message</label>
                  <textarea className={inputCls + ' resize-none bg-stone-50'} rows={4}
                    value={body} onChange={e => setBody(e.target.value)} placeholder="Email body..." />
                </div>
                {sendError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{sendError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSend} disabled={!subject.trim() || sending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium"
                    style={goldBtn}>
                    <Mail size={13} /> {sending ? 'Sending…' : 'Send Email'}
                  </button>
                  <button onClick={() => setModal(null)} disabled={sending}
                    className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200 disabled:opacity-40">
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-stone-300 text-center">Sends from info@northstarhouse.org</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
