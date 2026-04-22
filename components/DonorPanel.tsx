'use client'
import { useState } from 'react'
import { X, MapPin, Mail, Phone, Briefcase, Plus, DollarSign } from 'lucide-react'
import { DonorWithStats, Donation } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import TierBadge from './TierBadge'
import StatusBadge from './StatusBadge'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

interface Props {
  donor: DonorWithStats
  onClose: () => void
  onUpdated: () => void
}

const goldBtn = { background: 'var(--gold)' }

export default function DonorPanel({ donor, onClose, onUpdated }: Props) {
  const [notes, setNotes] = useState(donor.donor_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [showAddDonation, setShowAddDonation] = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [newType, setNewType] = useState<Donation['type']>('one-time')
  const [newDonationNotes, setNewDonationNotes] = useState('')
  const [editField, setEditField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({
    formal_name: donor.formal_name,
    informal_first_name: donor.informal_first_name ?? '',
    email: donor.email ?? '',
    phone: donor.phone ?? '',
    employer: donor.employer ?? '',
    address: donor.address ?? '',
  })

  async function saveNotes() {
    setSaving(true)
    await supabase.from('donors').update({ donor_notes: notes, updated_at: new Date().toISOString() }).eq('id', donor.id)
    setSaving(false)
    onUpdated()
  }

  async function saveField(field: string) {
    await supabase.from('donors').update({ [field]: editValues[field as keyof typeof editValues] || null, updated_at: new Date().toISOString() }).eq('id', donor.id)
    setEditField(null)
    onUpdated()
  }

  async function addDonation() {
    const amount = parseFloat(newAmount)
    if (!amount || !newDate) return
    await supabase.from('donations').insert({
      donor_id: donor.id,
      amount,
      date: newDate,
      type: newType,
      donation_notes: newDonationNotes || null,
    })
    setShowAddDonation(false)
    setNewAmount('')
    setNewDonationNotes('')
    onUpdated()
  }

  const historicalExtra = donor.historical_donation_count - donor.donations.length
  const displayLifetime = Math.max(donor.lifetime_total, donor.historical_lifetime_giving)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
              {donor.formal_name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <TierBadge tier={donor.tier} />
              <StatusBadge status={donor.status} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg ml-2 flex-shrink-0 text-stone-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Giving summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
              <p className="text-xs text-stone-400 font-medium mb-1">This Year</p>
              <p className="text-lg font-semibold text-stone-800">{fmt(donor.current_year_total)}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
              <p className="text-xs text-stone-400 font-medium mb-1">Lifetime</p>
              <p className="text-lg font-semibold text-stone-800">{fmt(displayLifetime)}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
              <p className="text-xs text-stone-400 font-medium mb-1">Gifts</p>
              <p className="text-lg font-semibold text-stone-800">{donor.total_donation_count}</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Contact</h3>
            <div className="space-y-1.5">
              {(['formal_name', 'informal_first_name', 'email', 'phone', 'employer', 'address'] as const).map(field => {
                const icons: Record<string, React.ReactNode> = {
                  email: <Mail size={13} />, phone: <Phone size={13} />,
                  employer: <Briefcase size={13} />, address: <MapPin size={13} />,
                }
                const labels: Record<string, string> = {
                  formal_name: 'Formal Name', informal_first_name: 'Informal First Name',
                  email: 'Email', phone: 'Phone', employer: 'Employer', address: 'Address',
                }
                return (
                  <div key={field} className="flex items-start gap-2">
                    <span className="text-stone-300 mt-0.5 w-4 flex-shrink-0">{icons[field]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">{labels[field]}</p>
                      {editField === field ? (
                        <div className="flex gap-1 mt-0.5">
                          {field === 'address' ? (
                            <textarea className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" rows={2}
                              value={editValues[field]} onChange={e => setEditValues(v => ({ ...v, [field]: e.target.value }))} />
                          ) : (
                            <input className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300"
                              value={editValues[field]} onChange={e => setEditValues(v => ({ ...v, [field]: e.target.value }))} />
                          )}
                          <button onClick={() => saveField(field)} className="px-2 py-1 text-white text-xs rounded-lg" style={goldBtn}>Save</button>
                          <button onClick={() => setEditField(null)} className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-lg hover:bg-stone-200">✕</button>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-700 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1 min-h-[1.25rem]"
                          onClick={() => setEditField(field)}>
                          {editValues[field] || <span className="text-stone-300 italic text-xs">Click to add</span>}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Donor Notes</h3>
            <textarea
              className="w-full border border-stone-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
              rows={4}
              placeholder="Add notes about this donor..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button onClick={saveNotes} disabled={saving}
              className="px-3 py-1.5 text-white text-sm rounded-lg disabled:opacity-50" style={goldBtn}>
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          {/* Donation history */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Donation History</h3>
              <button onClick={() => setShowAddDonation(!showAddDonation)}
                className="flex items-center gap-1 px-2.5 py-1 text-white text-xs rounded-lg" style={goldBtn}>
                <Plus size={11} /> Add Gift
              </button>
            </div>

            {showAddDonation && (
              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-stone-400">Amount</label>
                    <div className="relative mt-0.5">
                      <DollarSign size={12} className="absolute left-2.5 top-2 text-stone-400" />
                      <input type="number" className="w-full border border-stone-200 rounded-lg px-2 py-1.5 pl-6 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        placeholder="0" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400">Date</label>
                    <input type="date" className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      value={newDate} onChange={e => setNewDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400">Type</label>
                  <select className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={newType} onChange={e => setNewType(e.target.value as Donation['type'])}>
                    <option value="one-time">One-time</option>
                    <option value="recurring">Recurring</option>
                    <option value="grant">Grant</option>
                    <option value="in-kind">In-Kind</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-400">Notes (optional)</label>
                  <input className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Any notes about this gift..." value={newDonationNotes} onChange={e => setNewDonationNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={addDonation} className="px-3 py-1.5 text-white text-sm rounded-lg" style={goldBtn}>Add</button>
                  <button onClick={() => setShowAddDonation(false)} className="px-3 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-0">
              {donor.donations
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-stone-800">{fmt(d.amount)}</span>
                      {d.donation_notes && <p className="text-xs text-stone-400 mt-0.5">{d.donation_notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500">{fmtDate(d.date)}</p>
                      <span className="text-xs text-stone-400 capitalize">{d.type}</span>
                    </div>
                  </div>
                ))}
              {historicalExtra > 0 && (
                <p className="text-xs text-stone-400 italic pt-1">
                  + {historicalExtra} earlier gift{historicalExtra > 1 ? 's' : ''} · lifetime total {fmt(donor.historical_lifetime_giving)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
