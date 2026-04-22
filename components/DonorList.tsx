'use client'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { DonorWithStats } from '@/lib/types'
import { getTierInfo } from '@/lib/tiers'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDate = (d: string | null) => d
  ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

type SortKey = 'formal_name' | 'tier' | 'current_year_total' | 'lifetime_total' | 'last_gift_date' | 'status'
type SortDir = 'asc' | 'desc'

const TIER_ORDER = { blue_giant: 6, red_giant: 5, evening_star: 4, morning_star: 3, rising_star: 2, shooting_star: 1, none: 0 }
const STATUS_ORDER = { current: 3, recently_lapsed: 2, long_lapsed: 1, non_donor: 0 }

const TIER_DOTS: Record<string, string> = {
  blue_giant: '#2563eb', red_giant: '#dc2626', evening_star: '#7c3aed',
  morning_star: '#d97706', rising_star: '#059669', shooting_star: '#0284c7', none: '#9ca3af',
}

const STATUS_PILL: Record<string, string> = {
  current: 'bg-emerald-50 text-emerald-700',
  recently_lapsed: 'bg-amber-50 text-amber-700',
  long_lapsed: 'bg-orange-50 text-orange-700',
  non_donor: 'bg-stone-100 text-stone-500',
}
const STATUS_LABEL: Record<string, string> = {
  current: 'Current', recently_lapsed: 'Lapsed', long_lapsed: 'Long Lapsed', non_donor: 'Non-donor',
}

interface Props { donors: DonorWithStats[]; onSelect: (d: DonorWithStats) => void }

export default function DonorList({ donors, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('lifetime_total')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => [...donors].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'formal_name': cmp = a.formal_name.localeCompare(b.formal_name); break
      case 'tier': cmp = TIER_ORDER[a.tier] - TIER_ORDER[b.tier]; break
      case 'current_year_total': cmp = a.current_year_total - b.current_year_total; break
      case 'lifetime_total': cmp = a.lifetime_total - b.lifetime_total; break
      case 'last_gift_date':
        cmp = new Date(a.last_gift_date ?? '1900').getTime() - new Date(b.last_gift_date ?? '1900').getTime(); break
      case 'status': cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break
    }
    return sortDir === 'asc' ? cmp : -cmp
  }), [donors, sortKey, sortDir])

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

  if (donors.length === 0) {
    return <div className="text-center py-16 text-stone-400 text-sm">No donors match your filters.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            <Th label="Donor" k="formal_name" />
            <Th label="Status" k="status" />
            <Th label="Tier" k="tier" />
            <Th label="This Year" k="current_year_total" right />
            <Th label="Lifetime" k="lifetime_total" right />
            <Th label="Last Gift" k="last_gift_date" right />
          </tr>
        </thead>
        <tbody>
          {sorted.map(donor => {
            const tierInfo = getTierInfo(donor.tier)
            return (
              <tr
                key={donor.id}
                className="border-b border-stone-100 hover:bg-amber-50/50 cursor-pointer transition-colors group"
                onClick={() => onSelect(donor)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: TIER_DOTS[donor.tier] }}
                    />
                    <div>
                      <p className="font-medium text-stone-800 group-hover:text-amber-800">{donor.formal_name}</p>
                      {donor.informal_first_name && (
                        <p className="text-xs text-stone-400">{donor.informal_first_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[donor.status]}`}>
                    {STATUS_LABEL[donor.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {donor.tier === 'none'
                    ? <span className="text-stone-300 text-xs">—</span>
                    : <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${tierInfo.color}`}>
                        {tierInfo.label}
                      </span>
                  }
                </td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">
                  {donor.current_year_total > 0 ? fmt(donor.current_year_total) : <span className="text-stone-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-stone-600">
                  {fmt(Math.max(donor.lifetime_total, donor.historical_lifetime_giving))}
                </td>
                <td className="px-4 py-3 text-right text-stone-500 text-xs">
                  {fmtDate(donor.last_gift_date)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="px-4 py-2.5 text-xs text-stone-400 border-t border-stone-100">
        {sorted.length} donor{sorted.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
