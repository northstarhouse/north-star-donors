'use client'
import { useState, useEffect, useMemo } from 'react'
import { Mail, Copy, Check, ChevronDown, ChevronUp, Users, AlertCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'


interface Volunteer {
  id: number
  'First Name': string
  'Last Name': string
  'Email': string | null
  'Status': string | null
  'Team': string | null
  'Overview Notes': string | null
  'Phone Number': string | null
}

interface EmailLog {
  sent_at: string
  team_tag: string
  recipient_count: number
  subject: string
  sender: string
}

interface EventEmailGroup {
  id: string
  name: string
  recipients: { name: string; email: string }[]
  created_at: string
}

const GROUPS = [
  { tag: 'Board Member',  label: 'Board Members' },
  { tag: 'Construction',  label: 'Construction' },
  { tag: 'Docent',        label: 'Docents' },
  { tag: 'Events Team',   label: 'Events Team' },
  { tag: 'Landscaping',   label: 'Grounds' },
  { tag: 'Interiors',     label: 'Interiors' },
  { tag: 'Event Support', label: 'Event Support' },
  { tag: 'Fundraising',   label: 'Fundraising' },
  { tag: 'Staff',         label: 'Staff' },
  { tag: 'Venue',         label: 'Venue' },
] as const

function parseTeams(t: string | null | string[]): string[] {
  if (Array.isArray(t)) return t.map(s => s.replace(/\bNEW\b/g, '').trim()).filter(Boolean)
  return (t ?? '').split(/[,|]/).map(s => s.replace(/\bNEW\b/g, '').trim()).filter(Boolean)
}

function isActive(v: Volunteer) {
  return (v.Status ?? '').trim().toLowerCase() === 'active'
}

function membersForTag(volunteers: Volunteer[], tag: string): Volunteer[] {
  const tagLower = tag.toLowerCase()
  return volunteers.filter(v => parseTeams(v.Team).some(t => t.toLowerCase() === tagLower))
}

function displayName(tag: string): string {
  return GROUPS.find(g => g.tag === tag)?.label ?? tag
}

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700'

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[] | null>(null)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [activeOnly, setActiveOnly] = useState(true)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  // Modal state
  const [modal, setModal] = useState<{ team: string; members: Volunteer[] } | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    function fetchVolunteers() {
      supabase.from('2026 Volunteers').select('*')
        .then(({ data }) => { if (data) setVolunteers(data as Volunteer[]) })
    }
    fetchVolunteers()
    supabase.from('volunteer_email_logs').select('*').order('sent_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setLogs(data as EmailLog[]) })

    supabase.from('event_email_groups').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setEventGroups(data as EventEmailGroup[]) })

    const channel = supabase
      .channel('volunteers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: '2026 Volunteers' }, fetchVolunteers)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const displayed = useMemo(() => {
    if (!volunteers) return []
    return activeOnly ? volunteers.filter(isActive) : volunteers
  }, [volunteers, activeOnly])

  const groups = useMemo(() =>
    GROUPS.map(g => ({ ...g, members: membersForTag(displayed, g.tag) })),
    [displayed]
  )

  function toggleTeam(team: string) {
    setExpandedTeams(prev => {
      const next = new Set(prev)
      next.has(team) ? next.delete(team) : next.add(team)
      return next
    })
  }

  function copyEmails(members: Volunteer[], team: string) {
    const emails = members.filter(v => v.Email?.trim()).map(v => v.Email!.trim()).join(', ')
    navigator.clipboard.writeText(emails)
    setCopied(team)
    setTimeout(() => setCopied(null), 2000)
  }

  function openModal(team: string, members: Volunteer[]) {
    const withEmail = members.filter(v => v.Email?.trim())
    setModal({ team, members: withEmail })
    setSubject(`${displayName(team)} — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
    setBody('')
    setSent(false)
  }

  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Event email groups
  const [eventGroups, setEventGroups] = useState<EventEmailGroup[]>([])
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [copiedEvent, setCopiedEvent] = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [savingGroup, setSavingGroup] = useState(false)
  const [managingGroup, setManagingGroup] = useState<EventEmailGroup | null>(null)
  const [newRecipName, setNewRecipName] = useState('')
  const [newRecipEmail, setNewRecipEmail] = useState('')

  async function handleSend() {
    if (!modal) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(
        'https://uvzwhhwzelaelfhfkvdb.supabase.co/functions/v1/send-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: modal.members.map(v => v.Email!.trim()),
            subject,
            body,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Send failed')
      setSent(true)
      await supabase.from('volunteer_email_logs').insert({
        sent_at: new Date().toISOString(),
        team_tag: modal.team,
        recipient_count: modal.members.length,
        recipients: modal.members.map(v => `${v['First Name']} ${v['Last Name']} <${v.Email}>`),
        subject,
      }).then(async () => {
        const { data } = await supabase.from('volunteer_email_logs').select('*').order('sent_at', { ascending: false }).limit(20)
        if (data) setLogs(data as EmailLog[])
      }).catch(() => {})
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  async function createEventGroup() {
    if (!newGroupName.trim()) return
    setSavingGroup(true)
    const { data } = await supabase.from('event_email_groups').insert({ name: newGroupName.trim(), recipients: [] }).select().single()
    if (data) setEventGroups(prev => [data as EventEmailGroup, ...prev])
    setNewGroupName('')
    setShowNewGroup(false)
    setSavingGroup(false)
  }

  async function deleteEventGroup(id: string) {
    if (!confirm('Delete this event email group?')) return
    await supabase.from('event_email_groups').delete().eq('id', id)
    setEventGroups(prev => prev.filter(g => g.id !== id))
    if (managingGroup?.id === id) setManagingGroup(null)
  }

  async function addRecipient(group: EventEmailGroup) {
    if (!newRecipEmail.trim()) return
    const updated = [...group.recipients, { name: newRecipName.trim(), email: newRecipEmail.trim() }]
    await supabase.from('event_email_groups').update({ recipients: updated }).eq('id', group.id)
    const updatedGroup = { ...group, recipients: updated }
    setEventGroups(prev => prev.map(g => g.id === group.id ? updatedGroup : g))
    setManagingGroup(updatedGroup)
    setNewRecipName('')
    setNewRecipEmail('')
  }

  async function removeRecipient(group: EventEmailGroup, idx: number) {
    const updated = group.recipients.filter((_, i) => i !== idx)
    await supabase.from('event_email_groups').update({ recipients: updated }).eq('id', group.id)
    const updatedGroup = { ...group, recipients: updated }
    setEventGroups(prev => prev.map(g => g.id === group.id ? updatedGroup : g))
    setManagingGroup(updatedGroup)
  }

  function copyEventEmails(group: EventEmailGroup) {
    const emails = group.recipients.map(r => r.email).join(', ')
    navigator.clipboard.writeText(emails)
    setCopiedEvent(group.id)
    setTimeout(() => setCopiedEvent(null), 2000)
  }

  function openEventModal(group: EventEmailGroup) {
    const members = group.recipients.map((r, i) => ({
      id: i,
      'First Name': r.name.split(' ')[0] || r.name,
      'Last Name': r.name.split(' ').slice(1).join(' '),
      'Email': r.email,
      'Status': 'Active',
      'Team': group.name,
      'Overview Notes': null,
      'Phone Number': null,
    } as Volunteer))
    setModal({ team: group.name, members })
    setSubject(`${group.name} — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
    setBody('')
    setSent(false)
  }

  const goldBtn = { background: 'var(--gold)' }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="volunteers" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <Users size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                  Volunteer Email Lists
                </h1>
                <p className="text-xs text-stone-400 mt-0.5">Auto-populated from volunteer database · click a group to email them</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer select-none">
              <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)}
                className="rounded border-stone-300 accent-amber-500" />
              Active only
            </label>
          </div>
        </div>

        <div className="px-8 pb-8 flex gap-6">
          {/* Team groups */}
          <div className="flex-1 space-y-3">
            {volunteers === null ? (
              <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
            ) : (
              groups.map(({ tag, label, members }) => {
                const withEmail = members.filter(v => v.Email?.trim())
                const noEmail = members.filter(v => !v.Email?.trim())
                const isOpen = expandedTeams.has(tag)
                return (
                  <div key={tag} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center gap-3 px-5 py-3.5"
                      style={{ borderBottom: isOpen ? '0.5px solid #f0ece6' : 'none', background: '#fdfcfb' }}>
                      <button className="flex-1 flex items-center gap-3 text-left" onClick={() => toggleTeam(tag)}>
                        <span className="text-sm font-semibold text-stone-800">{label}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                          {withEmail.length} {withEmail.length !== members.length ? `/ ${members.length}` : ''} with email
                        </span>
                        {noEmail.length > 0 && (
                          <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                            <AlertCircle size={10} />{noEmail.length} no email
                          </span>
                        )}
                        <span className="ml-auto text-stone-300">
                          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </span>
                      </button>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => copyEmails(members, tag)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 transition-colors">
                          {copied === tag ? <><Check size={11} className="text-emerald-500" /> Copied</> : <><Copy size={11} /> Copy emails</>}
                        </button>
                        <button onClick={() => openModal(tag, members)} disabled={withEmail.length === 0}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-white font-medium disabled:opacity-40 transition-colors"
                          style={goldBtn}>
                          <Mail size={11} /> Email group
                        </button>
                      </div>
                    </div>

                    {/* Member list */}
                    {isOpen && (
                      <div>
                        {[...members].sort((a, b) => (a['Last Name'] ?? '').localeCompare(b['Last Name'] ?? '')).map((v, i) => (
                          <div key={v.id}
                            className="flex items-center gap-3 px-5 py-2.5"
                            style={{ borderBottom: i < members.length - 1 ? '0.5px solid #f5f1eb' : 'none' }}>
                            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                              style={{ background: 'var(--gold)', opacity: isActive(v) ? 1 : 0.4 }}>
                              {(v['First Name']?.[0] ?? '') + (v['Last Name']?.[0] ?? '')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-stone-700">{v['First Name']} {v['Last Name']}</span>
                              {v['Overview Notes'] && (
                                <span className="text-xs text-stone-400 ml-2">{v['Overview Notes']}</span>
                              )}
                              {!isActive(v) && (
                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-2">Interested</span>
                              )}
                            </div>
                            {v.Email ? (
                              <a href={`mailto:${v.Email.trim()}`}
                                className="text-xs text-stone-400 hover:text-amber-600 transition-colors truncate max-w-[200px]">
                                {v.Email.trim()}
                              </a>
                            ) : (
                              <span className="text-xs text-stone-300 italic">no email</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Event Emails */}
          <div className="flex-1 space-y-3 mt-8">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-base font-semibold text-stone-700" style={{ fontFamily: 'var(--font-serif)' }}>Event Emails</h2>
                <p className="text-xs text-stone-400 mt-0.5">Custom email lists for specific events</p>
              </div>
              <button onClick={() => { setShowNewGroup(true); setNewGroupName('') }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg font-medium"
                style={goldBtn}>
                <Mail size={11} /> New Group
              </button>
            </div>

            {showNewGroup && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex gap-2">
                <input
                  autoFocus
                  className={inputCls}
                  placeholder="Group name (e.g. Spring Gala, Board Dinner...)"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createEventGroup(); if (e.key === 'Escape') setShowNewGroup(false) }}
                />
                <button onClick={createEventGroup} disabled={!newGroupName.trim() || savingGroup}
                  className="px-3 py-2 text-white text-sm rounded-lg disabled:opacity-40 whitespace-nowrap font-medium"
                  style={goldBtn}>
                  {savingGroup ? 'Creating…' : 'Create'}
                </button>
                <button onClick={() => setShowNewGroup(false)}
                  className="px-3 py-2 bg-stone-100 text-stone-500 text-sm rounded-lg hover:bg-stone-200">
                  Cancel
                </button>
              </div>
            )}

            {eventGroups.length === 0 && !showNewGroup && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-5 py-8 text-center">
                <p className="text-sm text-stone-400 italic">No event email groups yet.</p>
              </div>
            )}

            {eventGroups.map(group => {
              const isOpen = expandedEvents.has(group.id)
              return (
                <div key={group.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: isOpen ? '0.5px solid #f0ece6' : 'none', background: '#fdfcfb' }}>
                    <button className="flex-1 flex items-center gap-3 text-left"
                      onClick={() => setExpandedEvents(prev => { const n = new Set(prev); n.has(group.id) ? n.delete(group.id) : n.add(group.id); return n })}>
                      <span className="text-sm font-semibold text-stone-800">{group.name}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                        {group.recipients.length} recipient{group.recipients.length !== 1 ? 's' : ''}
                      </span>
                      <span className="ml-auto text-stone-300">
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </span>
                    </button>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => copyEventEmails(group)} disabled={group.recipients.length === 0}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-colors">
                        {copiedEvent === group.id ? <><Check size={11} className="text-emerald-500" /> Copied</> : <><Copy size={11} /> Copy emails</>}
                      </button>
                      <button onClick={() => openEventModal(group)} disabled={group.recipients.length === 0}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-white font-medium disabled:opacity-40 transition-colors"
                        style={goldBtn}>
                        <Mail size={11} /> Email group
                      </button>
                      <button onClick={() => deleteEventGroup(group.id)}
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
                            {(r.name?.[0] ?? '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-stone-700">{r.name || <span className="text-stone-300 italic text-xs">No name</span>}</span>
                          </div>
                          <span className="text-xs text-stone-400 truncate max-w-[200px]">{r.email}</span>
                          <button onClick={() => removeRecipient(group, i)}
                            className="p-1 text-stone-200 hover:text-red-400 rounded transition-colors flex-shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {/* Add recipient inline */}
                      <div className="px-5 py-3 flex gap-2 bg-stone-50" style={{ borderTop: group.recipients.length > 0 ? '0.5px solid #f0ece6' : 'none' }}>
                        <input className={inputCls + ' text-xs py-1.5'} placeholder="Name"
                          value={newRecipName} onChange={e => setNewRecipName(e.target.value)} />
                        <input className={inputCls + ' text-xs py-1.5'} placeholder="Email"
                          value={newRecipEmail} onChange={e => setNewRecipEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addRecipient(group) }} />
                        <button onClick={() => addRecipient(group)} disabled={!newRecipEmail.trim()}
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

          {/* Log sidebar */}
          {logs.length > 0 && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden sticky top-6">
                <div className="px-4 py-3" style={{ borderBottom: '0.5px solid #f0ece6', background: '#fdfcfb' }}>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Recent Sends</p>
                </div>
                <div className="divide-y divide-stone-50">
                  {logs.map((log, i) => (
                    <div key={i} className="px-4 py-3">
                      <p className="text-xs font-semibold text-stone-700">{displayName(log.team_tag)}</p>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">{log.subject}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-stone-400">{log.recipient_count} recipients · {log.sender}</span>
                        <span className="text-[10px] text-stone-300">
                          {new Date(log.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div>
                <h2 className="font-semibold text-stone-800 text-sm">Email {displayName(modal.team)}</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {modal.members.length} active volunteer{modal.members.length !== 1 ? 's' : ''} tagged &quot;{modal.team}&quot;
                </p>
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
                <p className="text-xs text-stone-400 mt-1">
                  Delivered to {modal.members.length} recipient{modal.members.length !== 1 ? 's' : ''} from info@northstarhouse.org
                </p>
                <button onClick={() => setModal(null)} className="mt-4 px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg">
                  Done
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                {/* Recipients */}
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                    Recipients ({modal.members.length})
                  </p>
                  <div className="bg-stone-50 rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1">
                    {modal.members.map(v => (
                      <div key={v.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-stone-700 flex-shrink-0">{v['First Name']} {v['Last Name']}</span>
                        <span className="text-[10px] text-stone-400 truncate">{v.Email}</span>
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

                {sendError && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{sendError}</p>
                )}
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
