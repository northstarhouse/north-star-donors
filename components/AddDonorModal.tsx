'use client'
import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Donation } from '@/lib/types'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const goldBtn = { background: 'var(--gold)' }
const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"

export default function AddDonorModal({ onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    formal_name: '',
    informal_first_name: '',
    email: '',
    phone: '',
    employer: '',
    address: '',
  })
  const [giftAmount, setGiftAmount] = useState('')
  const [giftDate, setGiftDate] = useState(new Date().toISOString().slice(0, 10))
  const [giftType, setGiftType] = useState<Donation['type']>('one-time')
  const [giftNotes, setGiftNotes] = useState('')
  const [error, setError] = useState('')

  function set(patch: Partial<typeof form>) { setForm(f => ({ ...f, ...patch })) }

  async function save() {
    if (!form.formal_name.trim()) { setError('Formal name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const { data: donor, error: dErr } = await supabase
        .from('donors')
        .insert({
          formal_name: form.formal_name.trim(),
          informal_first_name: form.informal_first_name.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          employer: form.employer.trim() || null,
          address: form.address.trim() || null,
          historical_lifetime_giving: 0,
          historical_donation_count: 0,
        })
        .select('id')
        .single()

      if (dErr) throw dErr

      const amount = parseFloat(giftAmount)
      if (amount > 0 && giftDate && donor) {
        await supabase.from('donations').insert({
          donor_id: donor.id,
          amount,
          date: giftDate,
          type: giftType,
          donation_notes: giftNotes.trim() || null,
        })
      }

      onCreated()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save donor')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>Add Donor</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Contact Info</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Formal Name <span className="text-red-400">*</span></label>
                <input className={inputCls} placeholder="e.g. Mr. and Mrs. John Smith" value={form.formal_name} onChange={e => set({ formal_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Informal First Name</label>
                <input className={inputCls} placeholder="e.g. John" value={form.informal_first_name} onChange={e => set({ informal_first_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">Email</label>
                  <input className={inputCls} type="email" placeholder="email@example.com" value={form.email} onChange={e => set({ email: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">Phone</label>
                  <input className={inputCls} type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={e => set({ phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Employer</label>
                <input className={inputCls} placeholder="Company or organization" value={form.employer} onChange={e => set({ employer: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Address</label>
                <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Mailing address" value={form.address} onChange={e => set({ address: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">First Gift <span className="font-normal normal-case text-stone-300">(optional)</span></h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Amount</label>
                <div className="relative">
                  <DollarSign size={12} className="absolute left-2.5 top-2.5 text-stone-400" />
                  <input type="number" className={inputCls + ' pl-6'} placeholder="0" value={giftAmount} onChange={e => setGiftAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Date</label>
                <input type="date" className={inputCls} value={giftDate} onChange={e => setGiftDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Type</label>
              <select className={inputCls} value={giftType} onChange={e => setGiftType(e.target.value as Donation['type'])}>
                <option value="one-time">One-time</option>
                <option value="recurring">Recurring</option>
                <option value="grant">Grant</option>
                <option value="in-kind">In-Kind</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Notes</label>
              <input className={inputCls} placeholder="Any notes about this gift..." value={giftNotes} onChange={e => setGiftNotes(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium" style={goldBtn}>
              {saving ? 'Saving...' : 'Add Donor'}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
