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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{donor.formal_name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <TierBadge tier={donor.tier} />
              <StatusBadge status={donor.status} />
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full ml-2 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-6 py-4 space-y-6">
          {/* Giving summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-700 font-medium">This Year</p>
              <p className="text-lg font-bold text-amber-900">{fmt(donor.current_year_total)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 font-medium">Lifetime</p>
              <p className="text-lg font-bold text-gray-800">{fmt(displayLifetime)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 font-medium">Gifts</p>
              <p className="text-lg font-bold text-gray-800">{donor.total_donation_count}</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact</h3>
            <div className="space-y-1">
              {(['formal_name', 'informal_first_name', 'email', 'phone', 'employer', 'address'] as const).map(field => {
                const icons: Record<string, React.ReactNode> = {
                  email: <Mail size={14} />, phone: <Phone size={14} />,
                  employer: <Briefcase size={14} />, address: <MapPin size={14} />,
                }
                const labels: Record<string, string> = {
                  formal_name: 'Formal Name', informal_first_name: 'Informal First Name',
                  email: 'Email', phone: 'Phone', employer: 'Employer', address: 'Address',
                }
                return (
                  <div key={field} className="flex items-start gap-2 group">
                    <span className="text-gray-400 mt-1 w-4 flex-shrink-0">{icons[field]}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-400">{labels[field]}</span>
                      {editField === field ? (
                        <div className="flex gap-1 mt-0.5">
                          {field === 'address' ? (
                            <textarea
                              className="flex-1 text-sm border rounded px-2 py-1 resize-none"
                              rows={2}
                              value={editValues[field]}
                              onChange={e => setEditValues(v => ({ ...v, [field]: e.target.value }))}
                            />
                          ) : (
                            <input
                              className="flex-1 text-sm border rounded px-2 py-1"
                              value={editValues[field]}
                              onChange={e => setEditValues(v => ({ ...v, [field]: e.target.value }))}
                            />
                          )}
                          <button onClick={() => saveField(field)} className="px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600">Save</button>
                          <button onClick={() => setEditField(null)} className="px-2 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300">✕</button>
                        </div>
                      ) : (
                        <p
                          className="text-sm text-gray-800 cursor-pointer hover:bg-amber-50 rounded px-1 -mx-1 min-h-[1.25rem]"
                          onClick={() => setEditField(field)}
                        >
                          {editValues[field] || <span className="text-gray-400 italic">Click to add</span>}
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
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Donor Notes</h3>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              rows={4}
              placeholder="Add notes about this donor..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          {/* Donation history */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Donation History</h3>
              <button
                onClick={() => setShowAddDonation(!showAddDonation)}
                className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600"
              >
                <Plus size={12} /> Add Gift
              </button>
            </div>

            {showAddDonation && (
              <div className="border rounded-lg p-3 bg-amber-50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Amount</label>
                    <div className="relative">
                      <DollarSign size={12} className="absolute left-2 top-2 text-gray-400" />
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1 pl-5 text-sm"
                        placeholder="0"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Date</label>
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Type</label>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={newType}
                    onChange={e => setNewType(e.target.value as Donation['type'])}
                  >
                    <option value="one-time">One-time</option>
                    <option value="recurring">Recurring</option>
                    <option value="grant">Grant</option>
                    <option value="in-kind">In-Kind</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Notes (optional)</label>
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Any notes about this gift..."
                    value={newDonationNotes}
                    onChange={e => setNewDonationNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={addDonation} className="px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600">Add</button>
                  <button onClick={() => setShowAddDonation(false)} className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {donor.donations
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{fmt(d.amount)}</span>
                      {d.donation_notes && <p className="text-xs text-gray-500 mt-0.5">{d.donation_notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{fmtDate(d.date)}</p>
                      <span className="text-xs text-gray-400 capitalize">{d.type}</span>
                    </div>
                  </div>
                ))}
              {historicalExtra > 0 && (
                <p className="text-xs text-gray-400 italic pt-1">
                  + {historicalExtra} additional historical gift{historicalExtra > 1 ? 's' : ''} (imported summary — lifetime total: {fmt(donor.historical_lifetime_giving)})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
