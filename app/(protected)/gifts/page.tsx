'use client'
import { useState, useEffect, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Heart, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Donor, Donation, DonorWithStats } from '@/lib/types'
import { getTier, getStatus } from '@/lib/tiers'
import Sidebar from '@/components/Sidebar'
import DonorPanel from '@/components/DonorPanel'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

type SortKey = 'date' | 'donor' | 'amount' | 'type'
type SortDir = 'asc' | 'desc'

const TYPE_PILL: Record<string, string> = {
  'one-time': 'bg-stone-100 text-stone-500',
  recurring: 'bg-blue-50 text-blue-600',
  grant: 'bg-purple-50 text-purple-600',
  'in-kind': 'bg-teal-50 text-teal-600',
}

interface GiftRow {
  donation: Donation
  donor: Donor
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<GiftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedDonor, setSelectedDonor] = useState<DonorWithStats | null>(null)

  useEffect(() => { loadGifts() }, [])

  async function loadGifts() {
    const [{ data: donationRows }, { data: donorRows }] = await Promise.all([
      supabase.from('donations').select('*').order('date', { ascending: false }),
      supabase.from('donors').select('*'),
    ])

    const donorMap = ((donorRows ?? []) as Donor[]).reduce<Record<string, Donor>>((acc, d) => {
      acc[d.id] = d
      return acc
    }, {})

    const rows: GiftRow[] = ((donationRows ?? []) as Donation[])
      .filter(d => donorMap[d.donor_id])
      .map(d => ({ donation: d, donor: donorMap[d.donor_id] }))

    setGifts(rows)
    setLoading(false)
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'date' ? 'desc' : 'asc') }
  }

  const years = useMemo(() => {
    const ys = [...new Set(gifts.map(g => new Date(g.donation.date).getFullYear()))].sort((a, b) => b - a)
    return ys
  }, [gifts])

  const filtered = useMemo(() => {
    return gifts.filter(g => {
      if (filterYear !== 'all' && new Date(g.donation.date).getFullYear() !== Number(filterYear)) return false
      if (filterType !== 'all' && g.donation.type !== filterType) return false
      return true
    })
  }, [gifts, filterYear, filterType])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'date': cmp = new Date(a.donation.date).getTime() - new Date(b.donation.date).getTime(); break
      case 'donor': cmp = a.donor.formal_name.localeCompare(b.donor.formal_name); break
      case 'amount': cmp = a.donation.amount - b.donation.amount; break
      case 'type': cmp = a.donation.type.localeCompare(b.donation.type); break
    }
    return sortDir === 'asc' ? cmp : -cmp
  }), [filtered, sortKey, sortDir])

  const total = filtered.reduce((s, g) => s + g.donation.amount, 0)

  async function openDonor(donor: Donor) {
    const { data: donations } = await supabase.from('donations').select('*').eq('donor_id', donor.id)
    const donationList = (donations ?? []) as Donation[]
    const sorted = [...donationList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastGift = sorted[0] ?? null
    const currentYear = new Date().getFullYear()
    const currentYearTotal = donationList.filter(d => new Date(d.date).getFullYear() === currentYear).reduce((s, d) => s + d.amount, 0)
    const lifetimeTotal = Math.max(donationList.reduce((s, d) => s + d.amount, 0), donor.historical_lifetime_giving)
    const ds: DonorWithStats = {
      ...donor,
      donations: donationList,
      current_year_total: currentYearTotal,
      lifetime_total: lifetimeTotal,
      last_gift_amount: lastGift?.amount ?? null,
      last_gift_date: lastGift?.date ?? null,
      total_donation_count: Math.max(donationList.length, donor.historical_donation_count),
      status: getStatus(lastGift?.date ?? null),
      tier: getTier(currentYearTotal),
      tags: [],
    }
    setSelectedDonor(ds)
  }

  function exportCsv() {
    const rows = [
      ['Date', 'Donor', 'Amount', 'Type', 'Notes'],
      ...sorted.map(g => [
        g.donation.date,
        g.donor.formal_name,
        g.donation.amount.toFixed(2),
        g.donation.type,
        g.donation.donation_notes ?? '',
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gift-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown size={12} className="text-stone-300" />
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-stone-500" /> : <ChevronDown size={12} className="text-stone-500" />
  }

  function Th({ label, k, right }: { label: string; k: SortKey; right?: boolean }) {
    return (
      <th
        className={`px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider cursor-pointer hover:text-stone-600 select-none ${right ? 'text-right' : 'text-left'}`}
        onClick={() => handleSort(k)}
      >
        <span className={`inline-flex items-center gap-1 ${right ? 'flex-row-reverse' : ''}`}>
          {label} <SortIcon k={k} />
        </span>
      </th>
    )
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="gifts" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <Heart size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Gift Log
              </h1>
            </div>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm"
              style={{ background: 'var(--gold)' }}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {!loading && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-sm">
                <p className="text-xs text-stone-400 font-medium mb-1">Showing</p>
                <p className="text-2xl font-semibold text-stone-800">{fmt(total)}</p>
                <p className="text-xs text-stone-400 mt-0.5">{filtered.length} gift{filtered.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-sm">
                <p className="text-xs text-stone-400 font-medium mb-1">Average Gift</p>
                <p className="text-2xl font-semibold text-stone-800">
                  {filtered.length ? fmt(total / filtered.length) : '—'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-sm">
                <p className="text-xs text-stone-400 font-medium mb-1">Largest Gift</p>
                <p className="text-2xl font-semibold text-stone-800">
                  {filtered.length ? fmt(Math.max(...filtered.map(g => g.donation.amount))) : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mx-8 mb-8 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex-1">
          {/* Filter bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100">
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
            >
              <option value="all">All years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
            >
              <option value="all">All types</option>
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
              <option value="grant">Grant</option>
              <option value="in-kind">In-Kind</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading gifts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    <Th label="Date" k="date" />
                    <Th label="Donor" k="donor" />
                    <Th label="Amount" k="amount" right />
                    <Th label="Type" k="type" />
                    <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(g => (
                    <tr key={g.donation.id} className="border-b border-stone-100 hover:bg-amber-50/40 group">
                      <td className="px-4 py-3 text-stone-500 text-xs tabular-nums whitespace-nowrap">
                        {fmtDate(g.donation.date)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDonor(g.donor)}
                          className="font-medium text-stone-800 hover:text-amber-700 text-left transition-colors"
                        >
                          {g.donor.formal_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-800 tabular-nums">
                        {fmt(g.donation.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_PILL[g.donation.type] ?? 'bg-stone-100 text-stone-500'}`}>
                          {g.donation.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs max-w-xs truncate">
                        {g.donation.donation_notes ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 text-xs text-stone-400 border-t border-stone-100">
                {sorted.length} gift{sorted.length !== 1 ? 's' : ''} · {fmt(total)} total
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedDonor && (
        <DonorPanel
          donor={selectedDonor}
          onClose={() => setSelectedDonor(null)}
          onUpdated={() => { setSelectedDonor(null); loadGifts() }}
        />
      )}
    </div>
  )
}
