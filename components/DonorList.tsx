'use client'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { DonorWithStats } from '@/lib/types'
import TierBadge from './TierBadge'
import StatusBadge from './StatusBadge'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDate = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

type SortKey = 'formal_name' | 'tier' | 'current_year_total' | 'lifetime_total' | 'last_gift_date' | 'status'
type SortDir = 'asc' | 'desc'

const TIER_ORDER = { blue_giant: 6, red_giant: 5, evening_star: 4, morning_star: 3, rising_star: 2, shooting_star: 1, none: 0 }
const STATUS_ORDER = { current: 3, recently_lapsed: 2, long_lapsed: 1, non_donor: 0 }

interface Props {
  donors: DonorWithStats[]
  onSelect: (d: DonorWithStats) => void
}

export default function DonorList({ donors, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('lifetime_total')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    return [...donors].sort((a, b) => {
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
    })
  }, [donors, sortKey, sortDir])

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown size={14} className="text-gray-400" />
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  function Th({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none whitespace-nowrap"
        onClick={() => handleSort(k)}
      >
        <span className="flex items-center gap-1">{label} <SortIcon k={k} /></span>
      </th>
    )
  }

  if (donors.length === 0) {
    return <div className="text-center py-16 text-gray-400">No donors match your filters.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b sticky top-0">
          <tr>
            <Th label="Name" k="formal_name" />
            <Th label="Status" k="status" />
            <Th label="Member Tier" k="tier" />
            <Th label="This Year" k="current_year_total" />
            <Th label="Lifetime" k="lifetime_total" />
            <Th label="Last Gift" k="last_gift_date" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(donor => (
            <tr
              key={donor.id}
              className="hover:bg-amber-50 cursor-pointer transition-colors"
              onClick={() => onSelect(donor)}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{donor.formal_name}</p>
                {donor.informal_first_name && donor.informal_first_name !== donor.formal_name.split(' ')[0] && (
                  <p className="text-xs text-gray-400">{donor.informal_first_name}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={donor.status} />
              </td>
              <td className="px-4 py-3">
                <TierBadge tier={donor.tier} />
              </td>
              <td className="px-4 py-3 font-medium text-gray-800">
                {donor.current_year_total > 0 ? fmt(donor.current_year_total) : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {fmt(Math.max(donor.lifetime_total, donor.historical_lifetime_giving))}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {fmtDate(donor.last_gift_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 text-xs text-gray-400 border-t">
        {sorted.length} donor{sorted.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
