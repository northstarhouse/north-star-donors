'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Donor, Donation, DonorWithStats } from '@/lib/types'
import { getTier, getStatus } from '@/lib/tiers'
import DonorList from '@/components/DonorList'
import DonorPanel from '@/components/DonorPanel'
import FilterBar, { Filters } from '@/components/FilterBar'

const CURRENT_YEAR = new Date().getFullYear()

function buildDonorWithStats(donor: Donor, donations: Donation[]): DonorWithStats {
  const currentYearTotal = donations
    .filter(d => new Date(d.date).getFullYear() === CURRENT_YEAR)
    .reduce((sum, d) => sum + d.amount, 0)

  const lifetimeFromDB = donations.reduce((sum, d) => sum + d.amount, 0)
  const lifetimeTotal = Math.max(lifetimeFromDB, donor.historical_lifetime_giving)

  const sortedDonations = [...donations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const lastGift = sortedDonations[0] ?? null

  const status = getStatus(lastGift?.date ?? null)
  const tier = getTier(currentYearTotal)
  const totalDonationCount = Math.max(donations.length, donor.historical_donation_count)

  return {
    ...donor,
    donations,
    current_year_total: currentYearTotal,
    lifetime_total: lifetimeTotal,
    last_gift_amount: lastGift?.amount ?? null,
    last_gift_date: lastGift?.date ?? null,
    total_donation_count: totalDonationCount,
    status,
    tier,
  }
}

export default function Home() {
  const [donors, setDonors] = useState<DonorWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DonorWithStats | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    tier: 'all',
    hasAddress: 'all',
  })

  async function loadDonors() {
    const { data: donorRows } = await supabase
      .from('donors')
      .select('*')
      .order('formal_name')

    const { data: donationRows } = await supabase
      .from('donations')
      .select('*')

    if (!donorRows) return

    const donationsByDonor = (donationRows ?? []).reduce<Record<string, Donation[]>>((acc, d) => {
      if (!acc[d.donor_id]) acc[d.donor_id] = []
      acc[d.donor_id].push(d)
      return acc
    }, {})

    const built = donorRows.map(d => buildDonorWithStats(d, donationsByDonor[d.id] ?? []))
    setDonors(built)
    setLoading(false)
  }

  useEffect(() => { loadDonors() }, [])

  async function handleUpdated() {
    await loadDonors()
  }

  const filtered = useMemo(() => {
    return donors.filter(d => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!d.formal_name.toLowerCase().includes(q) &&
            !(d.informal_first_name ?? '').toLowerCase().includes(q) &&
            !(d.email ?? '').toLowerCase().includes(q)) return false
      }
      if (filters.status !== 'all' && d.status !== filters.status) return false
      if (filters.tier !== 'all' && d.tier !== filters.tier) return false
      if (filters.hasAddress === 'yes' && !d.address) return false
      if (filters.hasAddress === 'no' && d.address) return false
      return true
    })
  }, [donors, filters])

  function handleExport() {
    const rows = [
      ['Formal Name', 'Informal First Name', 'Address', 'Status', 'Member Tier', 'This Year', 'Lifetime', 'Last Gift Date', 'Email', 'Phone'],
      ...filtered.map(d => [
        d.formal_name,
        d.informal_first_name ?? '',
        d.address ?? '',
        d.status.replace(/_/g, ' '),
        d.tier.replace(/_/g, ' '),
        d.current_year_total.toFixed(2),
        Math.max(d.lifetime_total, d.historical_lifetime_giving).toFixed(2),
        d.last_gift_date ?? '',
        d.email ?? '',
        d.phone ?? '',
      ])
    ]
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `north-star-donors-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedFresh = selected ? donors.find(d => d.id === selected.id) ?? selected : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">✦</span>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">North Star House</h1>
          <p className="text-xs text-gray-500">Donor Database</p>
        </div>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onExport={handleExport}
        count={filtered.length}
      />

      <main className="bg-white shadow-sm mx-4 my-4 rounded-xl overflow-hidden border">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            Loading donors...
          </div>
        ) : (
          <DonorList donors={filtered} onSelect={setSelected} />
        )}
      </main>

      {selectedFresh && (
        <DonorPanel
          donor={selectedFresh}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
