'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Check, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DonorList } from '@/lib/types'

interface Props {
  donorIds: string[]
  onClose: () => void
  onDone: () => void
}

const goldBtn = { background: 'var(--gold)' }
const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"

export default function AddToListModal({ donorIds, onClose, onDone }: Props) {
  const [lists, setLists] = useState<DonorList[]>([])
  const [loading, setLoading] = useState(true)
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLists()
  }, [])

  async function loadLists() {
    setLoading(true)
    const { data } = await supabase
      .from('lists')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
    setLists(data ?? [])
    setLoading(false)
  }

  async function createAndSelect() {
    if (!newListName.trim()) return
    setCreating(true)
    const { data, error: err } = await supabase
      .from('lists')
      .insert({ name: newListName.trim() })
      .select('id, name, created_at')
      .single()
    if (err) { setError(err.message); setCreating(false); return }
    setLists(prev => [data, ...prev])
    setSelectedListId(data.id)
    setNewListName('')
    setCreating(false)
  }

  async function addToList() {
    if (!selectedListId) return
    setSaving(true)
    setError('')
    const rows = donorIds.map(donor_id => ({ list_id: selectedListId, donor_id }))
    const { error: err } = await supabase.from('list_donors').upsert(rows, { onConflict: 'list_id,donor_id' })
    if (err) { setError(err.message); setSaving(false); return }
    setDone(true)
    setTimeout(() => { onDone(); onClose() }, 800)
  }

  const selectedList = lists.find(l => l.id === selectedListId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="border-b border-stone-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-800">Add to List</h2>
            <p className="text-xs text-stone-400 mt-0.5">{donorIds.length} donor{donorIds.length !== 1 ? 's' : ''} selected</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Create new list */}
          <div>
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 block">New List</label>
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="List name..."
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createAndSelect() }}
              />
              <button
                onClick={createAndSelect}
                disabled={!newListName.trim() || creating}
                className="flex items-center gap-1 px-3 py-2 text-white text-sm rounded-lg disabled:opacity-40 whitespace-nowrap"
                style={goldBtn}
              >
                <Plus size={13} /> Create
              </button>
            </div>
          </div>

          {/* Existing lists */}
          <div>
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 block">Existing Lists</label>
            {loading ? (
              <p className="text-sm text-stone-400 py-2">Loading...</p>
            ) : lists.length === 0 ? (
              <p className="text-sm text-stone-400 italic py-2">No lists yet — create one above.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id === selectedListId ? null : list.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors border ${
                      selectedListId === list.id
                        ? 'border-amber-300 bg-amber-50 text-stone-800'
                        : 'border-transparent hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <List size={13} className="text-stone-400 flex-shrink-0" />
                    <span className="flex-1 font-medium">{list.name}</span>
                    {selectedListId === list.id && <Check size={13} className="text-amber-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="border-t border-stone-100 px-5 py-3 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700">Cancel</button>
          <button
            onClick={addToList}
            disabled={!selectedListId || saving || done}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium"
            style={goldBtn}
          >
            {done ? <><Check size={13} /> Added!</> : saving ? 'Adding...' : `Add to "${selectedList?.name ?? ''}"`}
          </button>
        </div>
      </div>
    </div>
  )
}
