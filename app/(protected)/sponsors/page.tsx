'use client'
import { useState, useEffect, useRef } from 'react'
import { Award, Plus, X, Pencil, Check, Upload, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cacheRead, cacheWrite, TTL_SHORT } from '@/lib/cache'
import Sidebar from '@/components/Sidebar'

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface Sponsor {
  id: number
  'Business Name': string
  'Main Contact': string | null
  'Donation': string | null
  'Fair Market Value': string | null
  'Area Supported': string | null
  'NSH Contact': string | null
  'Notes': string | null
  'Phone Number': string | null
  'Email Address': string | null
  'Mailing Address': string | null
  'Date Recieved': string | null
  'Acknowledged': string | null
  logo_url: string | null
  sponsor_status: 'current' | 'past' | 'potential' | null
}

interface InKind {
  id: number
  sponsor_id: number
  description: string
  date: string
  value: number
}

interface Ack {
  id: number
  sponsor_id: number
  date: string
  method: string | null
  notes: string | null
}

/* â”€â”€ Tiers (in-kind value) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TIERS = [
  { name: 'Innovator', min: 5000, range: '$5,000+', color: '#7c3aed', bg: '#f3f0ff', border: '#c4b5fd',
    benefits: ['Builder benefits, plus:', 'One "Sponsor Highlight" article in one of our quarterly newsletters', 'An 8"x8" commemorative brick placed as part of the brick terrace capital project', 'Picnic lunch or reception for you and ten guests in the North Star House'] },
  { name: 'Builder', min: 2500, range: '$2,500-$4,999', color: '#1565c0', bg: '#e3f2fd', border: '#90caf9',
    benefits: ['Believer benefits, plus:', 'Named Solo Sponsor of one NSHC event (name/logo in materials, event signage, recognized from stage)', 'A 4"x8" commemorative brick placed as part of the brick terrace capital project', 'Personal VIP tour of the upstairs construction project!'] },
  { name: 'Believer', min: 1000, range: '$1,000-$2,499', color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7',
    benefits: ['Company name/logo listed as a Sponsor in event programs, newsletters, website and yearly Sponsorship Banner', 'Invitation to State of the Star membership celebration', 'Two complimentary tickets to a NSHC event', 'Custom made plaque with yearly stars', 'Sponsor Spotlight on our social media platforms'] },
  { name: 'Friend of NSH', min: 250, range: '$250-$999', color: '#b45309', bg: '#fffbeb', border: '#fcd34d',
    benefits: ['Business name listed as a Friend in event programs, newsletters, and website', 'Invitation to State of the Star membership celebration'] },
]

function getTier(total: number) {
  return TIERS.find(t => total >= t.min) ?? null
}

/* â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const fmt = (n: number) => '$' + n.toLocaleString()
const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700 bg-white'
const goldBtn = { background: 'var(--gold)' }

const EMPTY_FORM: Partial<Sponsor> = {
  'Business Name': '', 'Main Contact': '', 'Donation': '', 'Fair Market Value': '',
  'Area Supported': '', 'NSH Contact': '', 'Phone Number': '', 'Email Address': '',
  'Mailing Address': '', 'Date Recieved': '', 'Notes': '',
}

/* â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[] | null>(null)
  const [allInKind, setAllInKind] = useState<InKind[]>([])
  const [selected, setSelected] = useState<Sponsor | null>(null)
  const [acks, setAcks] = useState<Ack[]>([])
  const [inkind, setInkind] = useState<InKind[]>([])

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Sponsor>>({})
  const [editSaving, setEditSaving] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<Partial<Sponsor>>(EMPTY_FORM)
  const [addSaving, setAddSaving] = useState(false)

  const [inkindForm, setInkindForm] = useState({ description: '', date: today(), value: '' })
  const [inkindSaving, setInkindSaving] = useState(false)

  const [ackForm, setAckForm] = useState({ date: today(), method: '', notes: '' })
  const [ackSaving, setAckSaving] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'current' | 'past' | 'potential'>('current')

  const CURRENT_YEAR = new Date().getFullYear()

  function today() { return new Date().toISOString().slice(0, 10) }

  /* â”€â”€ Load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    const cs = cacheRead<Sponsor[]>('sponsors')
    const ck = cacheRead<InKind[]>('sponsors-inkind')
    if (cs) setSponsors(cs)
    if (ck) setAllInKind(ck)
    supabase.from('Sponsors').select('*').order('Date Recieved', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).then(({ data }) => {
      if (data) { setSponsors(data as Sponsor[]); cacheWrite('sponsors', data, TTL_SHORT) }
    })
    supabase.from('Sponsor In-Kind').select('*').then(({ data }) => {
      if (data) { setAllInKind(data as InKind[]); cacheWrite('sponsors-inkind', data, TTL_SHORT) }
    })
  }, [])

  useEffect(() => {
    if (!selected) { setAcks([]); setInkind([]); return }
    supabase.from('Sponsor Acknowledgments').select('*').eq('sponsor_id', selected.id).order('date', { ascending: false })
      .then(({ data }) => { if (data) setAcks(data as Ack[]) })
    supabase.from('Sponsor In-Kind').select('*').eq('sponsor_id', selected.id).order('date', { ascending: false })
      .then(({ data }) => { if (data) setInkind(data as InKind[]) })
  }, [selected])

  /* â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function inKindTotal(sponsorId: number) {
    return allInKind.filter(e => e.sponsor_id === sponsorId).reduce((s, e) => s + (Number(e.value) || 0), 0)
  }

  function resolvedTab(s: Sponsor): 'current' | 'past' | 'potential' {
    if (s.sponsor_status) return s.sponsor_status
    if (s['Date Recieved'] && new Date(s['Date Recieved']).getFullYear() === CURRENT_YEAR) return 'current'
    return 'past'
  }

  const currentSponsors  = sponsors?.filter(s => resolvedTab(s) === 'current') ?? []
  const pastSponsors     = sponsors?.filter(s => resolvedTab(s) === 'past') ?? []
  const potentialSponsors = sponsors?.filter(s => resolvedTab(s) === 'potential') ?? []
  const visibleSponsors  = tab === 'current' ? currentSponsors : tab === 'past' ? pastSponsors : potentialSponsors

  const totalInKindAll = allInKind.reduce((s, e) => s + (Number(e.value) || 0), 0)
  const tieredCount = visibleSponsors.filter(s => getTier(inKindTotal(s.id))).length

  /* â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function switchTab(t: 'current' | 'past' | 'potential') {
    setTab(t)
    setSelected(null)
    setEditing(false)
  }

  function selectSponsor(s: Sponsor) {
    setSelected(prev => prev?.id === s.id ? null : s)
    setEditing(false)
    setConfirmDelete(false)
    setInkindForm({ description: '', date: today(), value: '' })
    setAckForm({ date: today(), method: '', notes: '' })
  }

  async function saveEdit() {
    if (!selected) return
    setEditSaving(true)
    const { data } = await supabase.from('Sponsors').update(editForm).eq('id', selected.id).select().single()
    if (data) {
      const updated = { ...selected, ...editForm } as Sponsor
      setSelected(updated)
      setSponsors(prev => prev?.map(s => s.id === selected.id ? updated : s) ?? null)
    }
    setEditing(false)
    setEditSaving(false)
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm['Business Name']) return
    setAddSaving(true)
    const row: Partial<Sponsor> = {}
    Object.entries(addForm).forEach(([k, v]) => { if (v) (row as Record<string, unknown>)[k] = v })
    const { data } = await supabase.from('Sponsors').insert(row).select().single()
    if (data) {
      setSponsors(prev => [...(prev ?? []), data as Sponsor])
      setSelected(data as Sponsor)
    }
    setShowAdd(false)
    setAddForm(EMPTY_FORM)
    setAddSaving(false)
  }

  async function deleteSponsor() {
    if (!selected) return
    await supabase.from('Sponsors').delete().eq('id', selected.id)
    setSponsors(prev => prev?.filter(s => s.id !== selected.id) ?? null)
    setSelected(null)
    setEditing(false)
    setConfirmDelete(false)
  }

  async function setStatus(s: Sponsor, status: 'current' | 'past' | 'potential') {
    await supabase.from('Sponsors').update({ sponsor_status: status }).eq('id', s.id)
    setSponsors(prev => prev?.map(sp => sp.id === s.id ? { ...sp, sponsor_status: status } : sp) ?? null)
    setSelected(prev => prev?.id === s.id ? { ...prev, sponsor_status: status } : prev)
  }

  async function submitInKind(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !inkindForm.description || !inkindForm.date || !inkindForm.value) return
    setInkindSaving(true)
    const payload = { sponsor_id: selected.id, description: inkindForm.description, date: inkindForm.date, value: parseFloat(inkindForm.value) }
    const { data } = await supabase.from('Sponsor In-Kind').insert(payload).select().single()
    if (data) {
      setInkind(prev => [...prev, data as InKind].sort((a, b) => b.date.localeCompare(a.date)))
      setAllInKind(prev => [...prev, data as InKind])
    }
    setInkindForm({ description: '', date: today(), value: '' })
    setInkindSaving(false)
  }

  async function deleteInKind(id: number) {
    await supabase.from('Sponsor In-Kind').delete().eq('id', id)
    setInkind(prev => prev.filter(e => e.id !== id))
    setAllInKind(prev => prev.filter(e => e.id !== id))
  }

  async function submitAck(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !ackForm.date) return
    setAckSaving(true)
    const payload = { sponsor_id: selected.id, date: ackForm.date, method: ackForm.method || null, notes: ackForm.notes || null }
    const { data } = await supabase.from('Sponsor Acknowledgments').insert(payload).select().single()
    if (data) setAcks(prev => [...prev, data as Ack].sort((a, b) => b.date.localeCompare(a.date)))
    setAckForm({ date: today(), method: '', notes: '' })
    setAckSaving(false)
  }

  async function deleteAck(id: number) {
    await supabase.from('Sponsor Acknowledgments').delete().eq('id', id)
    setAcks(prev => prev.filter(a => a.id !== id))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `sponsor-${selected.id}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('sponsor-logos').upload(filename, file, { contentType: file.type })
    if (uploadErr) { alert('Upload failed: ' + uploadErr.message); setLogoUploading(false); return }
    const { data: urlData } = supabase.storage.from('sponsor-logos').getPublicUrl(filename)
    const url = urlData.publicUrl
    await supabase.from('Sponsors').update({ logo_url: url }).eq('id', selected.id)
    const updated = { ...selected, logo_url: url }
    setSelected(updated)
    setSponsors(prev => prev?.map(s => s.id === selected.id ? updated : s) ?? null)
    setLogoUploading(false)
    e.target.value = ''
  }

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="sponsors" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <Award size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Sponsors
              </h1>
            </div>
            <button onClick={() => { setAddForm(EMPTY_FORM); setShowAdd(true) }}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
              <Plus size={15} /> Add Sponsor
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-white border border-stone-200 rounded-xl p-1 shadow-sm w-fit">
            {([['current', `${CURRENT_YEAR} Sponsors`], ['past', 'Past Sponsors'], ['potential', 'Potential']] as const).map(([t, label]) => (
              <button key={t} onClick={() => switchTab(t)}
                className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                style={tab === t ? goldBtn : {}}>
                {label}
              </button>
            ))}
          </div>

          {/* Stats */}
          {sponsors !== null && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label={tab === 'current' ? `${CURRENT_YEAR} Sponsors` : tab === 'past' ? 'Past Sponsors' : 'Potential Sponsors'} value={String(visibleSponsors.length)} />
              <StatCard label="Total In-Kind Value" value={fmt(totalInKindAll)} />
              <StatCard label="Tiered Sponsors" value={String(tieredCount)} />
            </div>
          )}
        </div>

        <div className="px-8 pb-8 flex-1">
          {sponsors === null ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading sponsors...</div>
          ) : (
            <div className="grid gap-5 grid-cols-[320px_1fr]" style={{ height: 'calc(100vh - 200px)' }}>
              {/* List */}
              <div className="space-y-2 overflow-y-auto pr-1">
                {visibleSponsors.length === 0 && (
                  <div className="text-center py-16 text-stone-400 text-sm">
                    No {tab === 'current' ? `${CURRENT_YEAR}` : tab} sponsors yet.
                  </div>
                )}
                {visibleSponsors.map(s => {
                  const isSelected = selected?.id === s.id
                  const total = inKindTotal(s.id)
                  const tier = getTier(total)
                  return (
                    <div key={s.id}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${isSelected ? 'border-amber-300 bg-amber-50/80' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
                      <button className="flex-1 flex items-center gap-4 text-left min-w-0" onClick={() => selectSponsor(s)}>
                        <SponsorAvatar sponsor={s} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800 text-sm truncate">{s['Business Name']}</p>
                          <div className="flex gap-3 mt-0.5">
                            {s['Main Contact'] && <span className="text-xs text-stone-400 truncate">{s['Main Contact']}</span>}
                            {s['Area Supported'] && <span className="text-xs text-stone-300">{s['Area Supported']}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {total > 0 && <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>{fmt(total)}</span>}
                          {tier && <TierBadge tier={tier} />}
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Detail panel */}
              {selected ? (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 overflow-y-auto h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <SponsorAvatar sponsor={selected} size={48} />
                      <div>
                        <h2 className="font-bold text-stone-800 text-base leading-snug">{selected['Business Name']}</h2>
                        {selected['Area Supported'] && <p className="text-xs text-stone-400 mt-0.5">{selected['Area Supported']}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <select
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
                        value={resolvedTab(selected)}
                        onChange={e => setStatus(selected, e.target.value as 'current' | 'past' | 'potential')}
                      >
                        <option value="current">Current</option>
                        <option value="past">Past</option>
                        <option value="potential">Potential</option>
                      </select>
                      <button onClick={() => { setEditForm({ ...selected }); setEditing(true) }}
                        className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1">
                        <Pencil size={11} /> Edit
                      </button>
                      {confirmDelete ? (
                        <div className="flex items-center gap-1">
                          <button onClick={deleteSponsor}
                            className="px-2.5 py-1 text-xs text-white bg-red-500 rounded-lg font-medium flex items-center gap-1 hover:bg-red-600">
                            <Trash2 size={11} /> Delete?
                          </button>
                          <button onClick={() => setConfirmDelete(false)}
                            className="px-2 py-1 text-xs text-stone-400 border border-stone-200 rounded-lg hover:bg-stone-50">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(true)}
                          className="p-1.5 text-stone-300 border border-stone-200 rounded-lg hover:text-red-400 hover:border-red-200 hover:bg-red-50 transition-colors"
                          title="Delete sponsor">
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button onClick={() => { setSelected(null); setEditing(false); setConfirmDelete(false) }}
                        className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Edit form */}
                  {editing && (
                    <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 mb-5 space-y-3">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Edit Sponsor</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ['Business Name', 'Business Name'], ['Main Contact', 'Main Contact'],
                          ['Donation', 'Donation'], ['Fair Market Value', 'Fair Market Value'],
                          ['Area Supported', 'Area Supported'], ['NSH Contact', 'NSH Contact'],
                          ['Phone Number', 'Phone'], ['Email Address', 'Email'],
                          ['Mailing Address', 'Address'], ['Date Recieved', 'Date Received'],
                        ] as [keyof Sponsor, string][]).map(([key, label]) => (
                          <div key={key}>
                            <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">{label}</label>
                            <input className={inputCls} value={(editForm[key] as string) ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                        <textarea className={inputCls + ' resize-none'} rows={3} value={(editForm['Notes'] as string) ?? ''} onChange={e => setEditForm(f => ({ ...f, Notes: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium" style={goldBtn}>
                          {editSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(false)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Logo */}
                  <Section label="Logo">
                    {selected.logo_url ? (
                      <div className="flex items-center gap-3">
                        <img src={selected.logo_url} alt="logo" className="max-h-14 max-w-36 object-contain border border-stone-200 rounded-lg p-1" />
                        <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
                          className="text-xs px-3 py-1.5 border rounded-lg hover:bg-stone-50" style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>
                          {logoUploading ? 'Uploading...' : 'Replace'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
                        className="w-full py-3 text-sm rounded-lg border-dashed border-2 flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
                        style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>
                        <Upload size={13} />{logoUploading ? 'Uploading...' : 'Upload Logo'}
                      </button>
                    )}
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </Section>

                  {/* Info */}
                  <Section label="Details">
                    <div className="space-y-2">
                      <InfoRow label="Main Contact" value={selected['Main Contact']} />
                      <InfoRow label="Donation" value={selected['Donation']} />
                      <InfoRow label="Fair Market Value" value={selected['Fair Market Value']} />
                      <InfoRow label="Area Supported" value={selected['Area Supported']} />
                      <InfoRow label="NSH Contact" value={selected['NSH Contact']} />
                      <InfoRow label="Phone" value={selected['Phone Number']} />
                      <InfoRow label="Email" value={selected['Email Address']} href={selected['Email Address'] ? `mailto:${selected['Email Address']}` : undefined} />
                      <InfoRow label="Address" value={selected['Mailing Address']} />
                      <InfoRow label="Date Received" value={selected['Date Recieved']} />
                      {selected['Notes'] && (
                        <div className="bg-stone-50 rounded-lg p-3 mt-2">
                          <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">{selected['Notes']}</p>
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* In-Kind */}
                  <Section label="In-Kind Contributions">
                    {(() => {
                      const total = inkind.reduce((s, e) => s + (Number(e.value) || 0), 0)
                      const tier = getTier(total)
                      return (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-stone-800">{fmt(total)}</span>
                            <span className="text-xs text-stone-400">total in-kind value</span>
                            {tier && <TierBadge tier={tier} />}
                          </div>
                          {tier && (
                            <div className="rounded-lg p-3 mb-3 text-xs space-y-1" style={{ background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }}>
                              <p className="font-bold">{tier.name} Benefits - {tier.range}</p>
                              {tier.benefits.map((b, i) => (
                                <p key={i} style={{ paddingLeft: b.endsWith(':') ? 0 : 12 }}>{b.endsWith(':') ? b : `- ${b}`}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                    <form onSubmit={submitInKind} className="bg-stone-50 rounded-lg p-3 mb-3 space-y-2">
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Scope of Work *</label>
                        <textarea className={inputCls + ' resize-none'} rows={2} required placeholder="Describe the in-kind work or service..."
                          value={inkindForm.description} onChange={e => setInkindForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Date *</label>
                          <input type="date" className={inputCls} required value={inkindForm.date} onChange={e => setInkindForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Value ($) *</label>
                          <input type="number" min="0" className={inputCls} required placeholder="e.g. 1500" value={inkindForm.value} onChange={e => setInkindForm(f => ({ ...f, value: e.target.value }))} />
                        </div>
                      </div>
                      <button type="submit" disabled={inkindSaving || !inkindForm.description || !inkindForm.value}
                        className="w-full py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                        {inkindSaving ? 'Saving...' : 'Add In-Kind Entry'}
                      </button>
                    </form>
                    {inkind.length === 0 ? (
                      <p className="text-xs text-stone-300 italic">No in-kind entries yet.</p>
                    ) : (
                      <div className="space-y-0">
                        {inkind.map(e => (
                          <div key={e.id} className="flex gap-3 items-start py-2 border-b border-stone-100 last:border-0 group">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-stone-800">{fmt(Number(e.value))}</span>
                                <span className="text-xs text-stone-400">{e.date}</span>
                              </div>
                              <p className="text-xs text-stone-500 leading-relaxed">{e.description}</p>
                            </div>
                            <button onClick={() => deleteInKind(e.id)} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* Acknowledgments */}
                  <Section label="Acknowledgment Log">
                    <form onSubmit={submitAck} className="bg-stone-50 rounded-lg p-3 mb-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Date</label>
                          <input type="date" className={inputCls} required value={ackForm.date} onChange={e => setAckForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Method</label>
                          <input className={inputCls} placeholder="Letter, email, call..." value={ackForm.method} onChange={e => setAckForm(f => ({ ...f, method: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                        <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Details..." value={ackForm.notes} onChange={e => setAckForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <button type="submit" disabled={ackSaving}
                        className="w-full py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                        {ackSaving ? 'Saving...' : 'Log Acknowledgment'}
                      </button>
                    </form>
                    {acks.length === 0 ? (
                      <p className="text-xs text-stone-300 italic">No acknowledgments logged yet.</p>
                    ) : (
                      <div className="space-y-0">
                        {acks.map(a => (
                          <div key={a.id} className="flex gap-3 items-start py-2 border-b border-stone-100 last:border-0 group">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-sm font-semibold text-stone-800">{a.date}</span>
                                {a.method && (
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--gold)', background: '#faf5ee' }}>{a.method}</span>
                                )}
                              </div>
                              {a.notes && <p className="text-xs text-stone-500 leading-relaxed">{a.notes}</p>}
                            </div>
                            <button onClick={() => deleteAck(a.id)} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                </div>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Sponsor Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-semibold text-stone-800">New Sponsor</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400"><X size={16} /></button>
            </div>
            <form onSubmit={submitAdd} className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['Business Name', 'Business Name *', true], ['Main Contact', 'Main Contact', false],
                  ['Donation', 'Donation', false], ['Fair Market Value', 'Fair Market Value', false],
                  ['Area Supported', 'Area Supported', false], ['NSH Contact', 'NSH Contact', false],
                  ['Phone Number', 'Phone', false], ['Email Address', 'Email', false],
                  ['Mailing Address', 'Address', false], ['Date Recieved', 'Date Received', false],
                ] as [keyof Sponsor, string, boolean][]).map(([key, label, req]) => (
                  <div key={key}>
                    <label className="text-xs text-stone-500 mb-1 block">{label}</label>
                    <input required={req} className={inputCls} value={(addForm[key] as string) ?? ''} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Notes</label>
                <textarea className={inputCls + ' resize-none'} rows={3} value={(addForm['Notes'] as string) ?? ''} onChange={e => setAddForm(f => ({ ...f, Notes: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={addSaving || !addForm['Business Name']}
                  className="flex-1 py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                  {addSaving ? 'Saving...' : 'Add Sponsor'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-sm">
      <p className="text-xs text-stone-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-semibold text-stone-800">{value}</p>
    </div>
  )
}

function SponsorAvatar({ sponsor, size }: { sponsor: Sponsor; size: number }) {
  const [imgErr, setImgErr] = useState(false)
  const initials = (sponsor['Business Name'] || '?')[0].toUpperCase()
  if (sponsor.logo_url && !imgErr) {
    return (
      <img src={sponsor.logo_url} alt={sponsor['Business Name']} onError={() => setImgErr(true)}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8, border: '0.5px solid #e8e0d5', flexShrink: 0, padding: 4 }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: '#f0ece6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function TierBadge({ tier }: { tier: typeof TIERS[0] }) {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: tier.color, background: tier.bg, border: `1px solid ${tier.border}` }}>
      {tier.name}
    </span>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-stone-100 pt-4 mt-4">
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-3">{label}</p>
      {children}
    </div>
  )
}

function InfoRow({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-stone-400 w-24 flex-shrink-0 pt-px">{label}</span>
      {href
        ? <a href={href} className="text-stone-600 hover:underline" style={{ color: 'var(--gold)' }}>{value}</a>
        : <span className="text-stone-600 leading-relaxed">{value}</span>
      }
    </div>
  )
}
