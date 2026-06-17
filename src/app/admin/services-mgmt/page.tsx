'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/lib/supabase'
import { Save, Plus, X, Trash2 } from 'lucide-react'

// The 8 clinic services matching our public-facing pages
const PRESET_SERVICES = [
  {
    name: 'Physical Examinations',
    description: 'Thorough health check-ups to keep your pet in the best shape.',
    category: 'general',
    emoji: '🩺',
  },
  {
    name: 'Minor Soft Tissue Surgeries',
    description: 'Expert care for minor surgical procedures performed with precision and care.',
    category: 'surgery',
    emoji: '🩹',
  },
  {
    name: 'Vaccinations',
    description: 'Protect your pet with core and lifestyle-specific vaccines.',
    category: 'prevention',
    emoji: '💉',
  },
  {
    name: 'Grooming Services',
    description: 'Bathing, brushing, nail trimming & more to keep them looking and feeling great.',
    category: 'grooming',
    emoji: '✂️',
  },
  {
    name: 'Deworming & Tick Treatments',
    description: 'Safe & effective protection against parasites.',
    category: 'prevention',
    emoji: '🛡️',
  },
  {
    name: 'Diagnostics',
    description: 'Blood tests, X-rays and more for accurate diagnosis and treatment.',
    category: 'diagnostics',
    emoji: '🔬',
  },
  {
    name: 'Animal Birth Control Surgeries',
    description: 'Spay & neuter procedures for a healthier, happier life.',
    category: 'surgery',
    emoji: '🐾',
  },
  {
    name: 'Pet Prescription Diets & Nutrition',
    description: 'Specialized diets & nutrition plans for better health.',
    category: 'general',
    emoji: '🥣',
  },
]

const BLANK_NEW = { name: '', description: '', duration_mins: '', category: 'general', presetIndex: '' }

export default function AdminServicesMgmtPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits]     = useState<Record<string, Partial<Service>>>({})
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [newSvc, setNewSvc]   = useState(BLANK_NEW)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('services').select('*').order('display_order')
    setServices(data || [])
    setLoading(false)
  }

  const updateEdit = (id: string, key: string, val: string) => {
    setEdits(p => ({ ...p, [id]: { ...p[id], [key]: val } }))
  }

  const saveOne = async (id: string) => {
    const patch = edits[id]
    if (!patch || Object.keys(patch).length === 0) return
    const { error } = await supabase.from('services').update(patch).eq('id', id)
    if (!error) {
      setSavedIds(p => new Set([...p, id]))
      setTimeout(() => setSavedIds(p => { const n = new Set(p); n.delete(id); return n }), 2000)
      setEdits(p => { const n = {...p}; delete n[id]; return n })
      load()
    } else alert('Error: ' + error.message)
  }

  const deleteService = async (id: string, name: string) => {
    if (!confirm(`Delete service "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (!error) { load() } else alert('Error deleting service: ' + error.message)
  }

  // When a preset is selected, auto-fill name, description and category
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = e.target.value
    setNewSvc(p => ({ ...p, presetIndex: idx }))
    if (idx === '') return
    const preset = PRESET_SERVICES[parseInt(idx)]
    setNewSvc(p => ({
      ...p,
      presetIndex: idx,
      name: preset.name,
      description: preset.description,
      category: preset.category,
    }))
  }

  const addService = async () => {
    if (!newSvc.name.trim()) { alert('Please select or enter a service name'); return }
    const { error } = await supabase.from('services').insert([{
      name: newSvc.name,
      description: newSvc.description,
      duration_mins: newSvc.duration_mins ? parseInt(newSvc.duration_mins) : null,
      price_display: null,
      category: newSvc.category,
      display_order: services.length + 1,
      is_active: true,
    }])
    if (!error) {
      setShowAdd(false)
      setNewSvc(BLANK_NEW)
      load()
    } else alert('Error: ' + error.message)
  }

  const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors bg-white'

  return (
    <div>
      <div className="flex justify-end mb-5">
        <button onClick={() => { setShowAdd(!showAdd); setNewSvc(BLANK_NEW) }}
          className="flex items-center gap-2 text-white font-extrabold text-sm px-5 py-2.5 rounded-full"
          style={{ background: '#F59E0B' }}>
          {showAdd ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Service</>}
        </button>
      </div>

      {/* Add service form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border-2 p-6 mb-5" style={{ borderColor: '#F59E0B' }}>
          <h3 className="font-extrabold text-base mb-1">Add Service</h3>
          <p className="text-xs text-gray-400 mb-4">Select one of the clinic&apos;s services below — name and description will be filled automatically.</p>

          {/* Preset selector */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Choose Service *</label>
            <select
              value={newSvc.presetIndex}
              onChange={handlePresetChange}
              className={`${inp} w-full`}
            >
              <option value="">— Select a service —</option>
              {PRESET_SERVICES.map((p, i) => (
                <option key={i} value={i}>{p.emoji} {p.name}</option>
              ))}
              <option value="custom">✏️ Custom (enter manually)</option>
            </select>
          </div>

          {/* Name (editable) */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Service Name *</label>
            <input
              value={newSvc.name}
              onChange={e => setNewSvc(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Physical Examinations"
              className={`${inp} w-full`}
            />
          </div>

          {/* Description (editable) */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label>
            <textarea
              value={newSvc.description}
              onChange={e => setNewSvc(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of the service…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Duration (mins)</label>
              <input
                type="number"
                value={newSvc.duration_mins}
                onChange={e => setNewSvc(p => ({ ...p, duration_mins: e.target.value }))}
                placeholder="e.g. 30"
                className={`${inp} w-full`}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Category</label>
              <select
                value={newSvc.category}
                onChange={e => setNewSvc(p => ({ ...p, category: e.target.value }))}
                className={`${inp} w-full`}
              >
                <option value="general">General</option>
                <option value="surgery">Surgery</option>
                <option value="diagnostics">Diagnostics</option>
                <option value="prevention">Prevention / Vaccines</option>
                <option value="grooming">Grooming</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={addService} className="text-white font-extrabold text-sm px-6 py-2.5 rounded-full" style={{ background: '#F59E0B' }}>
              Save Service
            </button>
            <button onClick={() => setShowAdd(false)} className="font-bold text-sm px-6 py-2.5 rounded-full border border-gray-200 text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Services table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-extrabold text-base">All Services</span>
          <span className="text-xs text-gray-400">Edit and click Save · Changes reflect live on website</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-amber-500 font-bold">Loading…</div>
        ) : services.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">🩺</div>
            <div className="font-semibold text-gray-500">No services added yet</div>
            <div className="text-sm mt-1">Click &ldquo;Add Service&rdquo; above to add your first service</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Service Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {services.map((s, i) => {
                  const e = edits[s.id!] || {}
                  return (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3.5">
                        <input
                          value={e.name !== undefined ? e.name : (s.name || '')}
                          onChange={ev => updateEdit(s.id!, 'name', ev.target.value)}
                          className={`${inp} w-full min-w-[200px]`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          value={e.description !== undefined ? e.description as string : (s.description || '')}
                          onChange={ev => updateEdit(s.id!, 'description', ev.target.value)}
                          className={`${inp} w-full min-w-[240px]`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {s.category || 'general'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          type="number"
                          value={e.duration_mins !== undefined ? e.duration_mins : (s.duration_mins || '')}
                          onChange={ev => updateEdit(s.id!, 'duration_mins', ev.target.value)}
                          placeholder="mins"
                          className={`${inp} w-20`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <input type="checkbox" checked={s.is_active !== false}
                          onChange={async ev => {
                            await supabase.from('services').update({ is_active: ev.target.checked }).eq('id', s.id!)
                            load()
                          }}
                          style={{ width: 16, height: 16, accentColor: '#F59E0B', cursor: 'pointer' }}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {savedIds.has(s.id!) ? (
                            <span className="text-green-600 text-xs font-bold">✅ Saved!</span>
                          ) : (
                            <button onClick={() => saveOne(s.id!)}
                              disabled={!edits[s.id!]}
                              className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-full text-white transition-all
                                ${edits[s.id!] ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
                              style={{ background: edits[s.id!] ? '#F59E0B' : '#9CA3AF' }}>
                              <Save size={12}/> Save
                            </button>
                          )}
                          <button onClick={() => deleteService(s.id!, s.name)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                            title="Delete service">
                            <Trash2 size={13} className="text-red-500"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
