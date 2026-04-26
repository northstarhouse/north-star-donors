'use client'
import { useState, useEffect } from 'react'
import { List, Trash2, X, Users, ChevronLeft, Download, Star, Tags } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cacheRead, cacheWrite, TTL_SHORT } from '@/lib/cache'
import { DonorList, DonorWithStats, Donor, Donation } from '@/lib/types'
import { getTier, getStatus } from '@/lib/tiers'
import Sidebar from '@/components/Sidebar'
import DonorPanel from '@/components/DonorPanel'
import AddToListModal from '@/components/AddToListModal'

const CURRENT_YEAR = new Date().getFullYear()
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function buildDonorWithStats(donor: Donor, donations: Donation[]): DonorWithStats {
  const currentYearTotal = donations
    .filter(d => new Date(d.date).getFullYear() === CURRENT_YEAR)
    .reduce((sum, d) => sum + d.amount, 0)
  const lifetimeFromDB = donations.reduce((sum, d) => sum + d.amount, 0)
  const lifetimeTotal = Math.max(lifetimeFromDB, donor.historical_lifetime_giving)
  const sortedDonations = [...donations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const lastGift = sortedDonations[0] ?? null
  return {
    ...donor,
    donations,
    current_year_total: currentYearTotal,
    lifetime_total: lifetimeTotal,
    last_gift_amount: lastGift?.amount ?? null,
    last_gift_date: lastGift?.date ?? null,
    total_donation_count: Math.max(donations.length, donor.historical_donation_count),
    status: getStatus(lastGift?.date ?? null),
    tier: getTier(currentYearTotal),
  }
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

export default function ListsPage() {
  const [lists, setLists] = useState<(DonorList & { donor_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeList, setActiveList] = useState<DonorList | null>(null)
  const [listDonors, setListDonors] = useState<DonorWithStats[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [selected, setSelected] = useState<DonorWithStats | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAddToList, setShowAddToList] = useState(false)

  useEffect(() => {
    const cached = cacheRead<(DonorList & { donor_count: number })[]>('lists')
    if (cached) { setLists(cached); setLoading(false) }
    loadLists()
  }, [])

  async function loadLists() {
    const { data } = await supabase
      .from('lists')
      .select('id, name, created_at, list_donors(count)')
      .order('created_at', { ascending: false })

    const mapped = (data ?? []).map((l: { id: string; name: string; created_at: string; list_donors: { count: number }[] }) => ({
      id: l.id,
      name: l.name,
      created_at: l.created_at,
      donor_count: l.list_donors?.[0]?.count ?? 0,
    }))
    setLists(mapped)
    cacheWrite('lists', mapped, TTL_SHORT)
    setLoading(false)
  }

  async function openList(list: DonorList) {
    setActiveList(list)
    setListLoading(true)
    setSelectedIds(new Set())

    const { data: linkRows } = await supabase
      .from('list_donors')
      .select('donor_id')
      .eq('list_id', list.id)

    const donorIds = (linkRows ?? []).map((r: { donor_id: string }) => r.donor_id)

    if (donorIds.length === 0) {
      setListDonors([])
      setListLoading(false)
      return
    }

    const { data: donorRows } = await supabase
      .from('donors')
      .select('*')
      .in('id', donorIds)
      .order('formal_name')

    const { data: donationRows } = await supabase
      .from('donations')
      .select('*')
      .in('donor_id', donorIds)

    const donationsByDonor = (donationRows ?? []).reduce<Record<string, Donation[]>>((acc, d) => {
      if (!acc[d.donor_id]) acc[d.donor_id] = []
      acc[d.donor_id].push(d)
      return acc
    }, {})

    setListDonors((donorRows ?? []).map((d: Donor) => buildDonorWithStats(d, donationsByDonor[d.id] ?? [])))
    setListLoading(false)
  }

  async function removeFromList(donorId: string) {
    if (!activeList) return
    setRemovingId(donorId)
    await supabase.from('list_donors').delete().eq('list_id', activeList.id).eq('donor_id', donorId)
    setListDonors(prev => prev.filter(d => d.id !== donorId))
    setLists(prev => prev.map(l => l.id === activeList.id ? { ...l, donor_count: l.donor_count - 1 } : l))
    setRemovingId(null)
  }

  async function deleteList(listId: string) {
    if (!confirm('Delete this list? Donors will not be affected.')) return
    await supabase.from('lists').delete().eq('id', listId)
    setLists(prev => prev.filter(l => l.id !== listId))
    if (activeList?.id === listId) setActiveList(null)
  }

  async function handleUpdated() {
    if (activeList) await openList(activeList)
  }

  function exportList() {
    const rows = [
      ['Formal Name', 'Informal First Name', 'Address'],
      ...listDonors.map(d => [
        d.formal_name,
        d.informal_first_name ?? '',
        d.address ?? '',
      ])
    ]
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeList?.name ?? 'list'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedFresh = selected ? listDonors.find(d => d.id === selected.id) ?? selected : null

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="lists" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {activeList && (
                <button onClick={() => setActiveList(null)} className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-500 transition-colors">
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <List size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                {activeList ? activeList.name : 'Lists'}
              </h1>
            </div>
            {activeList && listDonors.length > 0 && (
              <button
                onClick={exportList}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm"
                style={{ background: 'var(--gold)' }}
              >
                <Download size={14} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        <div className="mx-8 mb-8 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex-1">
          {!activeList ? (
            /* All lists */
            loading ? (
              <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading lists...</div>
            ) : lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2 text-stone-400">
                <List size={32} strokeWidth={1} />
                <p className="text-sm">No lists yet.</p>
                <p className="text-xs">Check donors on the Donations page and click "Add to a new or existing list..."</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {lists.map(list => (
                  <div key={list.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 group">
                    <button className="flex-1 flex items-center gap-4 text-left" onClick={() => openList(list)}>
                      <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Users size={15} className="text-stone-400" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-800">{list.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{list.donor_count} donor{list.donor_count !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteList(list.id)}
                      className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Donors in list */
            listLoading ? (
              <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
            ) : listDonors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2 text-stone-400">
                <Users size={32} strokeWidth={1} />
                <p className="text-sm">No donors in this list.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Selection bar */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-3 px-6 py-3 border-b border-amber-200 bg-amber-50">
                    <span className="text-sm font-medium text-stone-700">{selectedIds.size} selected</span>
                    <button
                      onClick={() => setShowAddToList(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg font-medium"
                      style={{ background: 'var(--gold)' }}
                    >
                      <Tags size={12} /> Add to a new or existing list...
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-stone-400 hover:text-stone-600 ml-auto">
                      Clear
                    </button>
                  </div>
                )}

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="px-4 py-3 w-8">
                        <input type="checkbox"
                          className="rounded border-stone-300 text-amber-500 focus:ring-amber-300 cursor-pointer"
                          checked={selectedIds.size === listDonors.length && listDonors.length > 0}
                          onChange={e => setSelectedIds(e.target.checked ? new Set(listDonors.map(d => d.id)) : new Set())}
                        />
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Donor</th>
                      <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">This Year</th>
                      <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Lifetime</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {[...listDonors].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(donor => (
                      <tr key={donor.id}
                        className={`border-b border-stone-100 group ${donor.starred ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-stone-50/60'}`}
                        style={donor.starred ? { boxShadow: 'inset 3px 0 0 #b5a185' } : {}}>
                        <td className="px-4 py-3">
                          <input type="checkbox"
                            className="rounded border-stone-300 text-amber-500 focus:ring-amber-300 cursor-pointer"
                            checked={selectedIds.has(donor.id)}
                            onChange={e => setSelectedIds(prev => {
                              const next = new Set(prev)
                              e.target.checked ? next.add(donor.id) : next.delete(donor.id)
                              return next
                            })}
                          />
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(donor)}>
                          <div className="flex items-center gap-2">
                            {donor.starred && <Star size={13} fill="#b5a185" stroke="#b5a185" className="flex-shrink-0" />}
                            <div>
                              <p className={`font-medium ${donor.starred ? 'text-stone-900' : 'text-stone-800'}`}>{donor.formal_name}</p>
                              {donor.star_note && <p className="text-xs mt-0.5" style={{ color: 'var(--gold)' }}>{donor.star_note}</p>}
                              {!donor.star_note && donor.informal_first_name && <p className="text-xs text-stone-400">{donor.informal_first_name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={() => setSelected(donor)}>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[donor.status]}`}>
                            {STATUS_LABEL[donor.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-stone-700" onClick={() => setSelected(donor)}>
                          {donor.current_year_total > 0 ? fmt(donor.current_year_total) : <span className="text-stone-300">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-stone-600" onClick={() => setSelected(donor)}>
                          {fmt(Math.max(donor.lifetime_total, donor.historical_lifetime_giving))}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeFromList(donor.id)}
                            disabled={removingId === donor.id}
                            className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
                            title="Remove from list"
                          >
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-2.5 text-xs text-stone-400 border-t border-stone-100">
                  {listDonors.length} donor{listDonors.length !== 1 ? 's' : ''}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {selectedFresh && (
        <DonorPanel
          donor={selectedFresh}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {showAddToList && (
        <AddToListModal
          donorIds={[...selectedIds]}
          onClose={() => setShowAddToList(false)}
          onDone={() => { setSelectedIds(new Set()); setShowAddToList(false) }}
        />
      )}
    </div>
  )
}
