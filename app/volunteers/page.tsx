'use client'
import { useState, useEffect, useMemo } from 'react'
import { Mail, Copy, Check, ChevronDown, ChevronUp, Users, AlertCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const TEAM_MEMBERS = ['Kaelen', 'Haley', 'Derek', 'Gerrie', 'Jen']

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

const GROUPS = [
  { tag: 'Board Member',  label: 'Board Members' },
  { tag: 'Restoration',   label: 'Construction' },
  { tag: 'Events Team',   label: 'Events Team' },
  { tag: 'Landscaping',   label: 'Grounds' },
  { tag: 'Interiors',     label: 'Interiors' },
  { tag: 'Event Support', label: 'Event Support' },
  { tag: 'Development',   label: 'Fundraising' },
  { tag: 'Staff',         label: 'Venue' },
] as const

function parseTeams(t: string | null): string[] {
  return (t ?? '').split(',').map(s => s.replace(/\bNEW\b/g, '').trim()).filter(Boolean)
}

function isActive(v: Volunteer) {
  return (v.Status ?? '').trim().toLowerCase() === 'active'
}

function membersForTag(volunteers: Volunteer[], tag: string): Volunteer[] {
  return volunteers.filter(v => parseTeams(v.Team).some(t => t === tag))
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
  const [sender, setSender] = useState(TEAM_MEMBERS[0])
  const [sent, setSent] = useState(false)

  useEffect(() => {
    supabase.from('2026 Volunteers').select('*')
      .then(({ data }) => { if (data) setVolunteers(data as Volunteer[]) })
    supabase.from('volunteer_email_logs').select('*').order('sent_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setLogs(data as EmailLog[]) })
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

  function buildMailto() {
    if (!modal) return '#'
    const bcc = modal.members.map(v => v.Email!.trim()).join(',')
    const params = new URLSearchParams()
    if (bcc) params.set('bcc', bcc)
    if (subject) params.set('subject', subject)
    if (body) params.set('body', body)
    return `mailto:?${params.toString()}`
  }

  async function handleSend() {
    if (!modal) return
    window.location.href = buildMailto()
    setSent(true)
    try {
      await supabase.from('volunteer_email_logs').insert({
        sent_at: new Date().toISOString(),
        team_tag: modal.team,
        recipient_count: modal.members.length,
        recipients: modal.members.map(v => `${v['First Name']} ${v['Last Name']} <${v.Email}>`),
        subject,
        sender,
      })
      // Refresh logs
      const { data } = await supabase.from('volunteer_email_logs').select('*').order('sent_at', { ascending: false }).limit(20)
      if (data) setLogs(data as EmailLog[])
    } catch { /* log table may not exist */ }
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
                <p className="text-sm font-semibold text-stone-700">Email client opened</p>
                <p className="text-xs text-stone-400 mt-1">
                  {modal.members.length} recipients pre-filled in BCC. Review and send from your email app.
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
                    Recipients — BCC ({modal.members.length})
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

                <div>
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Sent by</label>
                  <select className={inputCls} value={sender} onChange={e => setSender(e.target.value)}>
                    {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={handleSend} disabled={!subject.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium"
                    style={goldBtn}>
                    <Mail size={13} /> Open in Email App
                  </button>
                  <button onClick={() => setModal(null)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-stone-300 text-center">Opens your email client with all recipients pre-filled in BCC</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
