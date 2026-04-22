'use client'
import { Search, Download } from 'lucide-react'
import { DonorStatus, MemberTier } from '@/lib/types'
import { TIERS, STATUS_LABELS } from '@/lib/tiers'

export interface Filters {
  search: string
  status: DonorStatus | 'all'
  tier: MemberTier | 'all'
  hasAddress: 'all' | 'yes' | 'no'
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  onExport: () => void
  count: number
}

const STATUSES: (DonorStatus | 'all')[] = ['all', 'current', 'recently_lapsed', 'long_lapsed']
const STATUS_DISPLAY: Record<string, string> = {
  all: 'All Statuses',
  ...STATUS_LABELS,
}

export default function FilterBar({ filters, onChange, onExport, count }: Props) {
  function set(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="bg-white border-b px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search donors..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
        />
      </div>

      {/* Status filter */}
      <select
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={filters.status}
        onChange={e => set({ status: e.target.value as Filters['status'] })}
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>{STATUS_DISPLAY[s]}</option>
        ))}
      </select>

      {/* Tier filter */}
      <select
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={filters.tier}
        onChange={e => set({ tier: e.target.value as Filters['tier'] })}
      >
        <option value="all">All Tiers</option>
        {TIERS.map(t => (
          <option key={t.tier} value={t.tier}>{t.label}</option>
        ))}
      </select>

      {/* Address filter */}
      <select
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={filters.hasAddress}
        onChange={e => set({ hasAddress: e.target.value as Filters['hasAddress'] })}
      >
        <option value="all">All (address)</option>
        <option value="yes">Has Address</option>
        <option value="no">No Address</option>
      </select>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-gray-500">{count} result{count !== 1 ? 's' : ''}</span>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>
    </div>
  )
}
