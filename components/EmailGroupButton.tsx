'use client'
import { useState } from 'react'
import { Mail, X, AlertCircle, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const TEAM_MEMBERS = ['Kaelen', 'Haley', 'Derek', 'Gerrie', 'Jen']

interface Volunteer {
  id: number
  'First Name': string
  'Last Name': string
  'Email': string | null
  'Status': string | null
  'Team': string | null
  'Overview Notes': string | null
}

function parseTeams(t: string | null): string[] {
  return (t ?? '').split(',').map(s => s.replace(/\bNEW\b/g, '').trim()).filter(Boolean)
}

interface Props {
  tag: string
  label?: string
  defaultSubject?: string
  defaultBody?: string
  variant?: 'primary' | 'ghost'
}

export default function EmailGroupButton({ tag, label, defaultSubject, defaultBody, variant = 'primary' }: Props) {
  const [open, setOpen] = useState(false)
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState(defaultSubject ?? '')
  const [body, setBody] = useState(defaultBody ?? '')
  const [sender, setSender] = useState(TEAM_MEMBERS[0])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  async function openModal() {
    setLoading(true)
    setOpen(true)
    setSent(false)
    const { data } = await supabase.from('2026 Volunteers').select('*')
    if (data) {
      const matched = (data as Volunteer[]).filter(v => {
        const activeStatus = (v.Status ?? '').trim().toLowerCase() === 'active'
        const hasTag = parseTeams(v.Team).some(t => t.toLowerCase().includes(tag.toLowerCase()))
        return activeStatus && hasTag && v.Email?.trim()
      })
      setVolunteers(matched)
    }
    setLoading(false)
    if (!subject) setSubject(`${tag} Committee — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
  }

  async function handleSend() {
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(
        'https://uvzwhhwzelaelfhfkvdb.supabase.co/functions/v1/send-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bcc: volunteers.map(v => v.Email!.trim()),
            subject,
            body,
            sender,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Send failed')
      setSent(true)
      await supabase.from('volunteer_email_logs').insert({
        sent_at: new Date().toISOString(),
        team_tag: tag,
        recipient_count: volunteers.length,
        recipients: volunteers.map(v => `${v['First Name']} ${v['Last Name']} <${v.Email}>`),
        subject,
        sender,
      }).catch(() => {})
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  const btnStyle = variant === 'primary'
    ? 'flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg font-medium'
    : 'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border border-stone-200 text-stone-600 bg-white hover:bg-stone-50'

  return (
    <>
      <button onClick={openModal} className={btnStyle} style={variant === 'primary' ? { background: 'var(--gold)' } : {}}>
        <Mail size={12} />
        {label ?? `Email ${tag} Group`}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div>
                <h2 className="font-semibold text-stone-800 text-sm">Email {tag} Group</h2>
                {!loading && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    {volunteers.length === 0
                      ? 'No active volunteers found with this tag'
                      : `${volunteers.length} active volunteer${volunteers.length !== 1 ? 's' : ''} tagged "${tag}"`}
                  </p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-stone-300 hover:text-stone-500 rounded-lg">
                <X size={15} />
              </button>
            </div>

            {loading ? (
              <div className="px-5 py-10 text-center text-stone-400 text-sm">Loading recipients...</div>
            ) : volunteers.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <AlertCircle size={24} className="text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-stone-600">No active volunteers found tagged "{tag}".</p>
                <p className="text-xs text-stone-400 mt-1">Check that the tag matches a team name in the volunteer database.</p>
                <button onClick={() => setOpen(false)} className="mt-4 px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg">Close</button>
              </div>
            ) : sent ? (
              <div className="px-5 py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Check size={20} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-stone-700">Email sent!</p>
                <p className="text-xs text-stone-400 mt-1">Delivered to {volunteers.length} recipient{volunteers.length !== 1 ? 's' : ''} from info@thenorthstarhouse.org</p>
                <button onClick={() => setOpen(false)} className="mt-4 px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg">Close</button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                {/* Recipients preview */}
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Recipients (BCC)</p>
                  <div className="bg-stone-50 rounded-lg p-2.5 max-h-28 overflow-y-auto space-y-1">
                    {volunteers.map(v => (
                      <div key={v.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-stone-700">{v['First Name']} {v['Last Name']}</span>
                        <span className="text-[10px] text-stone-400 truncate">{v.Email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Subject</label>
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Message</label>
                  <textarea
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700 resize-none bg-stone-50"
                    rows={4}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Email body..."
                  />
                </div>

                {/* Sender */}
                <div>
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Sent by</label>
                  <select
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
                    value={sender} onChange={e => setSender(e.target.value)}>
                    {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {sendError && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-1">{sendError}</p>
                  )}
                  <button onClick={handleSend} disabled={!subject.trim() || sending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium"
                    style={{ background: 'var(--gold)' }}>
                    <Mail size={13} /> {sending ? 'Sending…' : 'Send Email'}
                  </button>
                  <button onClick={() => setOpen(false)}
                    className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-stone-300 text-center">Opens your email client with recipients pre-filled in BCC</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
