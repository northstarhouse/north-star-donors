'use client'
import { useState, useEffect } from 'react'
import { List, Trash2, X, Users, ChevronLeft, Download, Star, Tags, MapPinOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cacheRead, cacheWrite, TTL_SHORT } from '@/lib/cache'
import { DonorList, DonorWithStats, Donor, Donation, Tag } from '@/lib/types'
import { getTier, getStatus } from '@/lib/tiers'
import Sidebar from '@/components/Sidebar'
import DonorPanel from '@/components/DonorPanel'
import AddToListModal from '@/components/AddToListModal'
import TagPickerModal from '@/components/TagPickerModal'

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
    tags: [],
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
  const [allTags, setAllTags] = useState<(Tag & { donor_count: number })[]>([])
  const [noAddressCount, setNoAddressCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeList, setActiveList] = useState<DonorList | null>(null)
  const [activeTag, setActiveTag] = useState<Tag | null>(null)
  const [listDonors, setListDonors] = useState<DonorWithStats[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [selected, setSelected] = useState<DonorWithStats | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAddToList, setShowAddToList] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [donorTagsMap, setDonorTagsMap] = useState<Record<string, Tag[]>>({})

  useEffect(() => {
    const cached = cacheRead<(DonorList & { donor_count: number })[]>('lists')
    if (cached) { setLists(cached); setLoading(false) }
    loadLists()
  }, [])

  async function loadLists() {
    const [{ data }, { count }, { data: tagRows }] = await Promise.all([
      supabase.from('lists').select('id, name, created_at, list_donors(count)').order('created_at', { ascending: false }),
      supabase.from('donors').select('*', { count: 'exact', head: true }).or('address.is.null,address.eq.'),
      supabase.from('tags').select('*, donor_tags(count)').order('name'),
    ])

    const mapped = (data ?? []).map((l: { id: string; name: string; created_at: string; list_donors: { count: number }[] }) => ({
      id: l.id,
      name: l.name,
      created_at: l.created_at,
      donor_count: l.list_donors?.[0]?.count ?? 0,
    }))
    setLists(mapped)
    setNoAddressCount(count ?? 0)
    setAllTags((tagRows ?? []).map((t: { id: string; name: string; color: string; created_at: string; donor_tags: { count: number }[] }) => ({
      id: t.id, name: t.name, color: t.color, created_at: t.created_at,
      donor_count: t.donor_tags?.[0]?.count ?? 0,
    })))
    cacheWrite('lists', mapped, TTL_SHORT)
    setLoading(false)
  }

  async function openList(list: DonorList) {
    setActiveList(list)
    setListLoading(true)
    setSelectedIds(new Set())

    if (list.id === '__no_address__') {
      const { data: donorRows } = await supabase
        .from('donors')
        .select('*')
        .or('address.is.null,address.eq.')
        .order('formal_name')

      const donorIds = (donorRows ?? []).map((d: Donor) => d.id)
      const { data: donationRows } = donorIds.length
        ? await supabase.from('donations').select('*').in('donor_id', donorIds)
        : { data: [] }

      const donationsByDonor = (donationRows ?? []).reduce<Record<string, Donation[]>>((acc, d) => {
        if (!acc[d.donor_id]) acc[d.donor_id] = []
        acc[d.donor_id].push(d)
        return acc
      }, {})

      const built = (donorRows ?? []).map((d: Donor) => buildDonorWithStats(d, donationsByDonor[d.id] ?? []))
      setListDonors(built)
      await fetchTagsForDonors(built.map(d => d.id))
      setListLoading(false)
      return
    }

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

    const built = (donorRows ?? []).map((d: Donor) => buildDonorWithStats(d, donationsByDonor[d.id] ?? []))
    setListDonors(built)
    await fetchTagsForDonors(built.map(d => d.id))
    setListLoading(false)
  }

  async function openTag(tag: Tag) {
    setActiveTag(tag)
    setActiveList(null)
    setListLoading(true)
    setSelectedIds(new Set())

    const { data: linkRows } = await supabase.from('donor_tags').select('donor_id').eq('tag_id', tag.id)
    const donorIds = (linkRows ?? []).map((r: { donor_id: string }) => r.donor_id)

    if (donorIds.length === 0) { setListDonors([]); setListLoading(false); return }

    const { data: donorRows } = await supabase.from('donors').select('*').in('id', donorIds).order('formal_name')
    const { data: donationRows } = await supabase.from('donations').select('*').in('donor_id', donorIds)
    const donationsByDonor = (donationRows ?? []).reduce<Record<string, Donation[]>>((acc, d) => {
      if (!acc[d.donor_id]) acc[d.donor_id] = []
      acc[d.donor_id].push(d)
      return acc
    }, {})
    const built = (donorRows ?? []).map((d: Donor) => buildDonorWithStats(d, donationsByDonor[d.id] ?? []))
    setListDonors(built)
    await fetchTagsForDonors(built.map(d => d.id))
    setListLoading(false)
  }

  async function removeTagFromDonor(donorId: string) {
    if (!activeTag) return
    setRemovingId(donorId)
    await supabase.from('donor_tags').delete().eq('tag_id', activeTag.id).eq('donor_id', donorId)
    setListDonors(prev => prev.filter(d => d.id !== donorId))
    setAllTags(prev => prev.map(t => t.id === activeTag.id ? { ...t, donor_count: t.donor_count - 1 } : t))
    setRemovingId(null)
  }

  async function fetchTagsForDonors(donorIds: string[]) {
    if (!donorIds.length) return
    const { data } = await supabase.from('donor_tags').select('donor_id, tags(*)').in('donor_id', donorIds)
    const map: Record<string, Tag[]> = {}
    for (const row of data ?? []) {
      const r = row as { donor_id: string; tags: Tag | null }
      if (!r.tags) continue
      if (!map[r.donor_id]) map[r.donor_id] = []
      map[r.donor_id].push(r.tags)
    }
    setDonorTagsMap(map)
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
    else if (activeTag) await openTag(activeTag)
  }

  function exportList() {
    const rows = [
      ['Formal Name', 'Informal Name', 'Address', 'City State Zip'],
      ...listDonors.map(d => {
        const parts = (d.address ?? '').split('\n')
        const addressLine = parts[0] ?? ''
        const cityStateZip = parts.slice(1).join(' ').trim()
        return [d.formal_name, d.informal_first_name ?? '', addressLine, cityStateZip]
      })
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
              {(activeList || activeTag) && (
                <button onClick={() => { setActiveList(null); setActiveTag(null) }} className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-500 transition-colors">
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm flex-shrink-0">
                {activeTag
                  ? <span className="w-3.5 h-3.5 rounded-full" style={{ background: activeTag.color }} />
                  : <List size={16} className="text-stone-400" strokeWidth={1.5} />}
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                {activeList ? activeList.name : activeTag ? activeTag.name : 'Lists'}
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
          {!activeList && !activeTag ? (
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
                {/* Smart list: No Address */}
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50">
                  <button className="flex-1 flex items-center gap-4 text-left" onClick={() => openList({ id: '__no_address__', name: 'No Address', created_at: '' })}>
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <MapPinOff size={15} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">No Address</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {noAddressCount === null ? '...' : `${noAddressCount} donor${noAddressCount !== 1 ? 's' : ''}`}
                        <span className="ml-2 text-[10px] text-amber-500 font-medium uppercase tracking-wider">Auto</span>
                      </p>
                    </div>
                  </button>
                </div>
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

                {/* Tags section */}
                {allTags.length > 0 && (
                  <>
                    <div className="px-6 py-2 border-t border-stone-100 bg-stone-50">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Tags</p>
                    </div>
                    {allTags.map(tag => (
                      <div key={tag.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50">
                        <button className="flex-1 flex items-center gap-4 text-left" onClick={() => openTag(tag)}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tag.color + '20' }}>
                            <span className="w-3.5 h-3.5 rounded-full" style={{ background: tag.color }} />
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">{tag.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{tag.donor_count} donor{tag.donor_count !== 1 ? 's' : ''}</p>
                          </div>
                        </button>
                      </div>
                    ))}
                  </>
                )}
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
                      <Tags size={12} /> Add to list...
                    </button>
                    <button
                      onClick={() => setShowTagModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-xs rounded-lg font-medium hover:bg-stone-50"
                    >
                      <Tags size={12} /> Tag
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
                        className={`border-b border-stone-100 group ${donor.deceased ? 'opacity-50' : ''} ${donor.starred ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-stone-50/60'}`}
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
                              <div className="flex items-center gap-1.5">
                                <p className={`font-medium ${donor.starred ? 'text-stone-900' : 'text-stone-800'}`}>{donor.formal_name}</p>
                                {(donorTagsMap[donor.id] ?? []).map(tag => (
                                  <span key={tag.id} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tag.color }} title={tag.name} />
                                ))}
                              </div>
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
                        {(activeList && activeList.id !== '__no_address__') && (
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
                        )}
                        {activeTag && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeTagFromDonor(donor.id)}
                              disabled={removingId === donor.id}
                              className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
                              title="Remove tag"
                            >
                              <X size={13} />
                            </button>
                          </td>
                        )}
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

      {showTagModal && (
        <TagPickerModal
          donorIds={[...selectedIds]}
          onClose={() => setShowTagModal(false)}
          onDone={() => {
            setShowTagModal(false)
            fetchTagsForDonors(listDonors.map(d => d.id))
          }}
        />
      )}
    </div>
  )
}
