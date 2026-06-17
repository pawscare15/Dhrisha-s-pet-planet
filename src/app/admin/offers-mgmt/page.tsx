'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'

/* ── Types ── */
interface Offer {
  id?: string
  title: string
  tag: string
  description: string
  price: string
  original_price: string
  features: string          // stored as newline-separated string in DB
  card_color: string
  valid_until: string       // ISO date string or empty
  is_active: boolean
  display_order?: number
  created_at?: string
}

const COLOR_OPTIONS = [
  { label: 'Amber / Gold',  value: '#F59E0B' },
  { label: 'Teal',          value: '#5BC8D4' },
  { label: 'Dark Navy',     value: '#111827' },
  { label: 'Purple',        value: '#9333EA' },
  { label: 'Pink',          value: '#EC4899' },
  { label: 'Blue',          value: '#0891B2' },
  { label: 'Green',         value: '#16A34A' },
]

const TAG_SUGGESTIONS = [
  '🌧️ Monsoon Special', '⭐ Most Popular', '👴 Senior Care',
  '🐣 New Pet', '✨ Grooming Deal', '💊 Annual Plan',
  '🔥 Flash Sale', '🎁 Festival Offer', '🐾 Loyalty Reward',
]

const BLANK: Omit<Offer, 'id' | 'created_at' | 'display_order'> = {
  title: '', tag: '', description: '',
  price: '', original_price: '',
  features: '',
  card_color: '#F59E0B',
  valid_until: '',
  is_active: true,
}

const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors bg-white w-full'

export default function AdminOffersMgmtPage() {
  const [offers, setOffers]     = useState<Offer[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [newOffer, setNewOffer] = useState({ ...BLANK })
  const [saving, setSaving]     = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) {
        console.error('Load offers error:', error.message)
        alert('Could not load offers: ' + error.message + '\n\nMake sure you have run the supabase-offers-migration.sql in your Supabase SQL Editor.')
      }
      setOffers(data || [])
    } catch (e) {
      console.error('Load offers exception:', e)
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof BLANK, val: string | boolean) =>
    setNewOffer(p => ({ ...p, [key]: val }))

  const addOffer = async () => {
    if (!newOffer.title.trim()) { alert('Offer title is required'); return }
    if (!newOffer.price.trim()) { alert('Offer price is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('special_offers').insert([{
        ...newOffer,
        display_order: offers.length + 1,
      }])
      if (!error) {
        setShowAdd(false)
        setNewOffer({ ...BLANK })
        load()
      } else alert('Error saving offer: ' + error.message)
    } catch (e) {
      alert('Unexpected error saving offer')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await supabase.from('special_offers').update({ is_active: !current }).eq('id', id)
      load()
    } catch (e) {
      console.error('Toggle error:', e)
    }
  }

  const deleteOffer = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      const { error } = await supabase.from('special_offers').delete().eq('id', id)
      if (!error) load()
      else alert('Error deleting: ' + error.message)
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  return (
    <div>
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 mt-0.5">Manage offers shown on the Special Offers page</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setNewOffer({ ...BLANK }) }}
          className="flex items-center gap-2 text-white font-extrabold text-sm px-5 py-2.5 rounded-full transition-all hover:opacity-90"
          style={{ background: '#F59E0B' }}
        >
          {showAdd ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Special Offer</>}
        </button>
      </div>

      {/* ── ADD OFFER FORM ── */}
      {showAdd && (
        <div className="bg-white rounded-2xl border-2 p-6 mb-6" style={{ borderColor: '#F59E0B' }}>
          <h3 className="font-extrabold text-base mb-1">New Special Offer</h3>
          <p className="text-xs text-gray-400 mb-5">Fill in the details below. The offer card will appear live on the website once saved and marked active.</p>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Offer Title *</label>
              <input value={newOffer.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Monsoon Vaccination Package" className={inp} />
            </div>

            {/* Tag / Badge */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Badge / Tag</label>
              <input list="tag-suggestions" value={newOffer.tag}
                onChange={e => set('tag', e.target.value)}
                placeholder="e.g. 🌧️ Monsoon Special" className={inp} />
              <datalist id="tag-suggestions">
                {TAG_SUGGESTIONS.map(t => <option key={t} value={t} />)}
              </datalist>
              <p className="text-[10px] text-gray-400 mt-1">Shown as a pill on the offer card</p>
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Valid Until (optional)</label>
              <input type="date" value={newOffer.valid_until}
                onChange={e => set('valid_until', e.target.value)} className={inp} />
              <p className="text-[10px] text-gray-400 mt-1">Leave blank if offer has no expiry</p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Offer Price *</label>
              <input value={newOffer.price} onChange={e => set('price', e.target.value)}
                placeholder="e.g. ₹999" className={inp} />
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Original Price (for strikethrough)</label>
              <input value={newOffer.original_price} onChange={e => set('original_price', e.target.value)}
                placeholder="e.g. ₹1,500" className={inp} />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Short Description</label>
            <textarea value={newOffer.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of what this offer includes…"
              rows={2} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-none w-full" />
          </div>

          {/* Features */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">What&apos;s Included (one per line)</label>
            <textarea value={newOffer.features} onChange={e => set('features', e.target.value)}
              placeholder={"Full vaccination dose\nDeworming tablet\nComplete physical exam\nHealth certificate"}
              rows={5} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-none w-full font-mono" />
            <p className="text-[10px] text-gray-400 mt-1">Each line becomes a ✓ bullet on the offer card</p>
          </div>

          {/* Card Color */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 mb-2">Card Background Colour</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} onClick={() => set('card_color', c.value)}
                  title={c.label}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    background: c.value,
                    borderColor: newOffer.card_color === c.value ? '#000' : 'transparent',
                    transform: newOffer.card_color === c.value ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Selected: <span className="font-bold">{COLOR_OPTIONS.find(c => c.value === newOffer.card_color)?.label}</span>
            </p>
          </div>

          {/* Preview mini-card */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 mb-2">Card Preview</label>
            <div className="rounded-2xl p-5 max-w-xs" style={{ background: newOffer.card_color }}>
              {newOffer.tag && (
                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 text-white" style={{ background: 'rgba(255,255,255,.25)' }}>
                  {newOffer.tag}
                </span>
              )}
              <div className="text-white font-black text-lg leading-tight mb-1">{newOffer.title || 'Offer Title'}</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-white font-black text-2xl">{newOffer.price || '₹0'}</span>
                {newOffer.original_price && <span className="text-white/70 text-sm line-through">{newOffer.original_price}</span>}
              </div>
              {newOffer.features && (
                <ul className="space-y-1">
                  {newOffer.features.split('\n').filter(Boolean).slice(0, 3).map((f, i) => (
                    <li key={i} className="text-white/90 text-xs flex gap-1.5"><span className="font-bold text-white">✓</span>{f}</li>
                  ))}
                  {newOffer.features.split('\n').filter(Boolean).length > 3 && (
                    <li className="text-white/60 text-xs">+{newOffer.features.split('\n').filter(Boolean).length - 3} more…</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={addOffer} disabled={saving}
              className="text-white font-extrabold text-sm px-6 py-2.5 rounded-full disabled:opacity-60 flex items-center gap-2"
              style={{ background: '#F59E0B' }}>
              <Save size={14}/>{saving ? 'Saving…' : 'Save Offer'}
            </button>
            <button onClick={() => setShowAdd(false)}
              className="font-bold text-sm px-6 py-2.5 rounded-full border border-gray-200 text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── OFFERS LIST ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-extrabold text-base">All Special Offers</span>
          <span className="text-xs text-gray-400">{offers.length} offer{offers.length !== 1 ? 's' : ''} total</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-amber-500 font-bold">Loading…</div>
        ) : offers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🎉</div>
            <div className="font-semibold text-gray-500 text-base mb-1">No offers yet</div>
            <div className="text-sm">Click &ldquo;Add Special Offer&rdquo; above to create your first offer.<br/>The website will show a &ldquo;Coming Soon&rdquo; message until you add one.</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {offers.map(o => (
              <div key={o.id} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  {/* Colour dot */}
                  <div className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-white shadow-sm" style={{ background: o.card_color }} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-gray-900 truncate">{o.title}</span>
                      {o.tag && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{o.tag}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="font-black text-base" style={{ color: o.card_color }}>{o.price}</span>
                      {o.original_price && <span className="text-xs text-gray-400 line-through">{o.original_price}</span>}
                      {o.valid_until && (
                        <span className="text-xs text-gray-400">
                          Valid till {new Date(o.valid_until).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-500">{o.is_active ? 'Live' : 'Hidden'}</span>
                    <button
                      onClick={() => toggleActive(o.id!, o.is_active)}
                      className="relative w-10 h-5 rounded-full transition-all"
                      style={{ background: o.is_active ? '#F59E0B' : '#D1D5DB' }}
                    >
                      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                        style={{ left: o.is_active ? '1.25rem' : '0.125rem' }} />
                    </button>
                  </div>

                  {/* Expand toggle */}
                  <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id!)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 text-gray-400">
                    {expandedId === o.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </button>

                  {/* Delete */}
                  <button onClick={() => deleteOffer(o.id!, o.title)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                    title="Delete offer">
                    <Trash2 size={13} className="text-red-500"/>
                  </button>
                </div>

                {/* Expanded details */}
                {expandedId === o.id && (
                  <div className="mt-4 ml-9 grid sm:grid-cols-2 gap-4">
                    {o.description && (
                      <div className="sm:col-span-2">
                        <div className="text-xs font-bold text-gray-400 mb-1">Description</div>
                        <div className="text-sm text-gray-600">{o.description}</div>
                      </div>
                    )}
                    {o.features && (
                      <div className="sm:col-span-2">
                        <div className="text-xs font-bold text-gray-400 mb-1">Included Features</div>
                        <ul className="space-y-0.5">
                          {o.features.split('\n').filter(Boolean).map((f, i) => (
                            <li key={i} className="text-sm text-gray-600 flex gap-1.5">
                              <span className="text-amber-500 font-bold">✓</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
