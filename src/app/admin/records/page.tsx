'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pet, Visit } from '@/lib/supabase'
import { Search, Plus, X, Edit2, Trash2 } from 'lucide-react'

type PetWithVisits = Pet & { visits: Visit[] }

const REMINDER_OPTIONS = [
  { value: '15',     label: '15 days' },
  { value: '30',     label: '1 month' },
  { value: '60',     label: '2 months' },
  { value: '90',     label: '3 months' },
  { value: '180',    label: '6 months' },
  { value: '365',    label: '1 year' },
  { value: 'custom', label: 'Custom days' },
]

const DEFAULT_REMINDER_MSG = `Dear [Pet Parent], your [pet name] visit to clinic is due for vaccinations/deworming/tick treatments/treatment follow up Visit Dhrisha's Pet Planet - Bhagya nagar 2nd cross (9.30am to 6.30pm) & Paws Care and heal pet clinic - Hanuman nagar (6.45pm to 8.30pm - Sunday Holiday)`

const EMPTY_VISIT_FORM = {
  visit_date: new Date().toISOString().split('T')[0],
  complaint: '',
  clinical_signs: '',
  diagnosis: '',
  treatment: '',
  medicines: '',
  reminder_option: '30', custom_days: '', reminder_message: DEFAULT_REMINDER_MSG,
}

export default function AdminRecordsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Pet[]>([])
  const [selected, setSelected] = useState<PetWithVisits | null>(null)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [showAddPet, setShowAddPet] = useState(false)
  const [showEditPet, setShowEditPet] = useState(false)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null)
  const [visitSaved, setVisitSaved] = useState(false)
  const [petSaved, setPetSaved] = useState(false)

  const [petForm, setPetForm] = useState({ owner_name:'', mobile:'', pet_name:'', pet_type:'Dog', pet_age:'', gender:'Male', breed:'' })
  const [editForm, setEditForm] = useState({ owner_name:'', mobile:'', pet_name:'', pet_type:'Dog', pet_age:'', gender:'Male', breed:'' })
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT_FORM)
  const [editVisitForm, setEditVisitForm] = useState(EMPTY_VISIT_FORM)

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors bg-white'

  useEffect(() => {
    loadAllPets()
  }, [])

  const loadAllPets = async () => {
    setLoadingSearch(true)
    const { data } = await supabase.from('pets').select('*').limit(100).order('created_at', { ascending: false })
    setResults(data || [])
    setLoadingSearch(false)
  }

  const calcReminderDate = (form: typeof visitForm) => {
    const base = new Date(form.visit_date || new Date())
    const days = form.reminder_option === 'custom'
      ? (parseInt(form.custom_days) || 30)
      : form.reminder_option === '60' ? 60
      : form.reminder_option === '90' ? 90
      : form.reminder_option === '180' ? 180
      : form.reminder_option === '365' ? 365
      : parseInt(form.reminder_option)
    base.setDate(base.getDate() + days)
    return base.toISOString().split('T')[0]
  }

  const searchPets = async () => {
    if (!query.trim()) { loadAllPets(); return }
    setLoadingSearch(true)
    setSelected(null)
    const { data } = await supabase.from('pets').select('*')
      .or(`pet_name.ilike.%${query}%,mobile.ilike.%${query}%,owner_name.ilike.%${query}%`)
      .limit(20)
    setResults(data || [])
    setLoadingSearch(false)
  }

  const loadPetDetail = async (pet: Pet) => {
    const { data: visits } = await supabase.from('visits')
      .select('*').eq('pet_id', pet.id!).order('visit_date', { ascending: false })
    setSelected({ ...pet, visits: visits || [] })
    setShowAddVisit(false)
    setEditingVisit(null)
  }

  const savePet = async () => {
    const { owner_name, mobile, pet_name } = petForm
    if (!owner_name.trim() || !mobile.trim() || !pet_name.trim()) { alert('Owner name, mobile and pet name are required'); return }
    const { data, error } = await supabase.from('pets').insert([petForm]).select()
    if (!error && data) {
      setPetSaved(true); setTimeout(() => setPetSaved(false), 3000)
      setShowAddPet(false)
      setPetForm({ owner_name:'', mobile:'', pet_name:'', pet_type:'Dog', pet_age:'', gender:'Male', breed:'' })
      setSelected({ ...data[0], visits: [] })
      setResults([])
      loadAllPets()
    } else alert('Error: ' + error?.message)
  }

  const openEditPet = () => {
    if (!selected) return
    setEditForm({
      owner_name: selected.owner_name,
      mobile: selected.mobile,
      pet_name: selected.pet_name,
      pet_type: selected.pet_type,
      pet_age: selected.pet_age || '',
      gender: selected.gender || 'Male',
      breed: selected.breed || '',
    })
    setShowEditPet(true)
  }

  const updatePet = async () => {
    if (!selected) return
    const { owner_name, mobile, pet_name } = editForm
    if (!owner_name.trim() || !mobile.trim() || !pet_name.trim()) { alert('Owner name, mobile and pet name are required'); return }
    const { error } = await supabase.from('pets').update(editForm).eq('id', selected.id!)
    if (!error) {
      setShowEditPet(false)
      const updated = { ...selected, ...editForm }
      setSelected(updated)
      setResults(prev => prev.map(p => p.id === selected.id ? { ...p, ...editForm } : p))
      setPetSaved(true); setTimeout(() => setPetSaved(false), 3000)
    } else alert('Error updating pet: ' + error.message)
  }

  const deletePet = async () => {
    if (!selected) return
    if (!confirm(`Delete pet record for "${selected.pet_name}"? This will also delete all visit records. This cannot be undone.`)) return
    await supabase.from('visits').delete().eq('pet_id', selected.id!)
    const { error } = await supabase.from('pets').delete().eq('id', selected.id!)
    if (!error) {
      setSelected(null)
      setResults(prev => prev.filter(p => p.id !== selected.id))
      setQuery('')
    } else alert('Error deleting pet: ' + error.message)
  }

  const saveVisit = async () => {
    if (!selected) return
    if (!visitForm.diagnosis.trim() || !visitForm.treatment.trim()) {
      alert('Diagnosis and Treatments are required'); return
    }
    const reminderDate = calcReminderDate(visitForm)
    const { error } = await supabase.from('visits').insert([{
      pet_id: selected.id!,
      visit_date: visitForm.visit_date,
      complaint: visitForm.complaint,
      clinical_signs: visitForm.clinical_signs,
      diagnosis: visitForm.diagnosis,
      treatment: visitForm.treatment,
      medicines: visitForm.medicines,
      next_reminder_date: reminderDate,
      reminder_message: visitForm.reminder_message,
      reminder_sent: false,
    }])
    if (!error) {
      setVisitSaved(true); setTimeout(() => setVisitSaved(false), 3000)
      setShowAddVisit(false)
      setVisitForm(EMPTY_VISIT_FORM)
      loadPetDetail(selected)
    } else alert('Error saving visit: ' + error.message)
  }

  const openEditVisit = (v: Visit) => {
    setEditingVisit(v)
    setShowAddVisit(false)
    setEditVisitForm({
      visit_date: v.visit_date,
      complaint: v.complaint || '',
      clinical_signs: v.clinical_signs || '',
      diagnosis: v.diagnosis,
      treatment: v.treatment,
      medicines: v.medicines || '',
      reminder_option: 'custom',
      custom_days: '',
      reminder_message: v.reminder_message || '',
    })
  }

  const updateVisit = async () => {
    if (!selected || !editingVisit) return
    if (!editVisitForm.diagnosis.trim() || !editVisitForm.treatment.trim()) {
      alert('Diagnosis and Treatments are required'); return
    }
    const reminderDate = calcReminderDate(editVisitForm)
    const { error } = await supabase.from('visits').update({
      visit_date: editVisitForm.visit_date,
      complaint: editVisitForm.complaint,
      clinical_signs: editVisitForm.clinical_signs,
      diagnosis: editVisitForm.diagnosis,
      treatment: editVisitForm.treatment,
      medicines: editVisitForm.medicines,
      next_reminder_date: reminderDate,
      reminder_message: editVisitForm.reminder_message,
    }).eq('id', editingVisit.id!)
    if (!error) {
      setVisitSaved(true); setTimeout(() => setVisitSaved(false), 3000)
      setEditingVisit(null)
      loadPetDetail(selected)
    } else alert('Error updating visit: ' + error.message)
  }

  const deleteVisit = async (v: Visit) => {
    if (!selected) return
    if (!confirm(`Delete this visit record from ${v.visit_date}? This cannot be undone.`)) return
    const { error } = await supabase.from('visits').delete().eq('id', v.id!)
    if (!error) {
      setSelected(prev => prev ? { ...prev, visits: prev.visits.filter(x => x.id !== v.id) } : null)
    } else alert('Error deleting visit: ' + error.message)
  }

  const backToGrid = () => {
    setSelected(null)
    loadAllPets()
  }

  const getDefaultReminderMsg = () => {
    if (!selected) return DEFAULT_REMINDER_MSG
    return DEFAULT_REMINDER_MSG
      .replace('[Pet Parent]', selected.owner_name)
      .replace('[pet name]', selected.pet_name)
  }

  const openAddVisitForm = () => {
    setEditingVisit(null)
    setShowAddVisit(!showAddVisit)
    if (!showAddVisit) {
      setVisitForm({
        ...EMPTY_VISIT_FORM,
        reminder_message: getDefaultReminderMsg(),
      })
    }
  }

  return (
    <div className="overflow-hidden">
      {visitSaved && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-green-700 font-semibold text-sm">✅ Visit record saved successfully!</div>}
      {petSaved  && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-green-700 font-semibold text-sm">✅ Pet record saved successfully!</div>}

      {/* Search bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchPets()}
            placeholder="Search by pet name, owner or mobile…"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors"/>
        </div>
        <button onClick={searchPets}
          className="flex items-center gap-2 text-white font-extrabold text-sm px-4 py-3 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: '#F59E0B' }}>
          🔍 Search
        </button>
        <button onClick={() => { setShowAddPet(!showAddPet); setSelected(null) }}
          className="flex items-center gap-2 text-white font-extrabold text-sm px-4 py-3 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: '#111827' }}>
          <Plus size={16}/> New Pet
        </button>
      </div>

      {/* Add Pet Form */}
      {showAddPet && (
        <div className="bg-white rounded-2xl border-2 p-6 mb-5" style={{ borderColor: '#F59E0B' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base">🐾 Add New Pet Record</h3>
            <button onClick={() => setShowAddPet(false)}><X size={18} className="text-gray-400 hover:text-gray-700"/></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Owner Name *</label>
              <input value={petForm.owner_name} onChange={e=>setPetForm(p=>({...p,owner_name:e.target.value}))} placeholder="Full name" className={inp}/></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Mobile *</label>
              <input value={petForm.mobile} onChange={e=>setPetForm(p=>({...p,mobile:e.target.value}))} placeholder="10-digit" maxLength={10} className={inp}/></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Pet Name *</label>
              <input value={petForm.pet_name} onChange={e=>setPetForm(p=>({...p,pet_name:e.target.value}))} placeholder="e.g. Tommy" className={inp}/></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Pet Type</label>
              <select value={petForm.pet_type} onChange={e=>setPetForm(p=>({...p,pet_type:e.target.value}))} className={inp}>
                <option>Dog</option><option>Cat</option><option>Rabbit</option><option>Bird</option><option>Other</option>
              </select></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Breed</label>
              <input value={petForm.breed} onChange={e=>setPetForm(p=>({...p,breed:e.target.value}))} placeholder="e.g. Labrador, Persian" className={inp}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Gender</label>
              <select value={petForm.gender} onChange={e=>setPetForm(p=>({...p,gender:e.target.value}))} className={inp}>
                <option value="Male">Male</option><option value="Female">Female</option>
              </select></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Age</label>
              <input value={petForm.pet_age} onChange={e=>setPetForm(p=>({...p,pet_age:e.target.value}))} placeholder="e.g. 3 years" className={inp}/></div>
          </div>
          <div className="flex gap-3">
            <button onClick={savePet} className="text-white font-extrabold text-sm px-6 py-2.5 rounded-full" style={{ background:'#5BC8D4' }}>Save Pet Record</button>
            <button onClick={() => setShowAddPet(false)} className="font-bold text-sm px-6 py-2.5 rounded-full border border-gray-200 text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Edit Pet Form */}
      {showEditPet && selected && (
        <div className="bg-white rounded-2xl border-2 p-6 mb-5" style={{ borderColor: '#5BC8D4' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base" style={{ color:'#0891B2' }}>✏️ Edit Pet Record — {selected.pet_name}</h3>
            <button onClick={() => setShowEditPet(false)}><X size={18} className="text-gray-400 hover:text-gray-700"/></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Owner Name *</label>
              <input value={editForm.owner_name} onChange={e=>setEditForm(p=>({...p,owner_name:e.target.value}))} className={inp}/></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Mobile *</label>
              <input value={editForm.mobile} onChange={e=>setEditForm(p=>({...p,mobile:e.target.value}))} maxLength={10} className={inp}/></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Pet Name *</label>
              <input value={editForm.pet_name} onChange={e=>setEditForm(p=>({...p,pet_name:e.target.value}))} className={inp}/></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Pet Type</label>
              <select value={editForm.pet_type} onChange={e=>setEditForm(p=>({...p,pet_type:e.target.value}))} className={inp}>
                <option>Dog</option><option>Cat</option><option>Rabbit</option><option>Bird</option><option>Other</option>
              </select></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Breed</label>
              <input value={editForm.breed} onChange={e=>setEditForm(p=>({...p,breed:e.target.value}))} className={inp}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Gender</label>
              <select value={editForm.gender} onChange={e=>setEditForm(p=>({...p,gender:e.target.value}))} className={inp}>
                <option value="Male">Male</option><option value="Female">Female</option>
              </select></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Age</label>
              <input value={editForm.pet_age} onChange={e=>setEditForm(p=>({...p,pet_age:e.target.value}))} className={inp}/></div>
          </div>
          <div className="flex gap-3">
            <button onClick={updatePet} className="text-white font-extrabold text-sm px-6 py-2.5 rounded-full" style={{ background:'#5BC8D4' }}>Update Record</button>
            <button onClick={() => setShowEditPet(false)} className="font-bold text-sm px-6 py-2.5 rounded-full border border-gray-200 text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Pet grid + detail panel */}
      {!showAddPet && !showEditPet && (
        <div className={`grid gap-5 ${selected ? 'lg:grid-cols-[280px_1fr]' : ''}`}>
          {/* Pet cards sidebar — always visible on desktop, hidden on mobile when detail open */}
          <div className={`${selected ? 'hidden lg:block' : 'block'}`}>
            {loadingSearch ? (
              <div className="text-center py-10 text-amber-500 font-bold">Loading pets…</div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🐾</div>
                <div className="font-bold text-gray-500 text-lg mb-2">No pet records found</div>
                <div className="text-sm">Add a new pet record or try a different search</div>
              </div>
            ) : (
              <div className={`grid gap-2 ${selected ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'} ${selected ? '' : ''}`}>
                {results.map(pet => (
                  <div key={pet.id} onClick={() => loadPetDetail(pet)}
                    className={`rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 border border-gray-100 bg-white
                      ${selected?.id === pet.id ? 'ring-2 ring-amber-500' : ''}`}
                    style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                    <div className={`flex items-center justify-center ${selected ? 'h-16 text-3xl' : 'h-24 text-5xl'}`}
                      style={{ background: pet.gender === 'Female' ? '#FCE7F3' : '#DBEAFE' }}>
                      {pet.pet_type === 'Cat' ? '🐈' : pet.pet_type === 'Dog' ? '🐕' : '🐾'}
                    </div>
                    <div className="p-2.5">
                      <div className="font-extrabold text-sm truncate">{pet.pet_name}</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {pet.breed || pet.pet_type}{pet.gender ? ` · ${pet.gender}` : ''}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">{pet.owner_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="min-w-0">
              {/* Back button on mobile */}
              <button onClick={backToGrid}
                className="mb-3 flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors lg:hidden">
                ← Back to all records
              </button>

              {/* Pet header */}
              <div className="bg-white rounded-2xl border-2 p-5 mb-4" style={{ borderColor: '#F59E0B' }}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: selected.gender === 'Female' ? '#FCE7F3' : '#DBEAFE' }}>
                      {selected.pet_type === 'Cat' ? '🐈' : '🐕'}
                    </div>
                    <div>
                      <div className="font-black text-xl">{selected.pet_name}</div>
                      <div className="text-sm text-gray-500">
                        {selected.breed || selected.pet_type}
                        {selected.gender ? ` · ${selected.gender}` : ''}
                        {selected.pet_age ? ` · ${selected.pet_age}` : ''}
                      </div>
                      <div className="text-sm text-gray-500">👤 {selected.owner_name} · 📞 {selected.mobile}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={openEditPet}
                      className="flex items-center gap-1.5 font-extrabold text-sm px-4 py-2.5 rounded-full border-2 border-gray-200 text-gray-700 hover:border-amber-400 transition-colors">
                      <Edit2 size={14}/> Edit
                    </button>
                    <button onClick={deletePet}
                      className="flex items-center gap-1.5 font-extrabold text-sm px-4 py-2.5 rounded-full border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={14}/> Delete
                    </button>
                    <button onClick={openAddVisitForm}
                      className="flex items-center gap-2 text-white font-extrabold text-sm px-5 py-2.5 rounded-full"
                      style={{ background: showAddVisit ? '#6B7280' : '#F59E0B' }}>
                      {showAddVisit ? '✕ Cancel' : '+ Add Visit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Visit Form */}
              {showAddVisit && (
                <div className="bg-white rounded-2xl border-2 p-6 mb-4" style={{ borderColor: '#5BC8D4' }}>
                  <h3 className="font-extrabold text-base mb-4" style={{ color: '#0891B2' }}>
                    + New Visit — {selected.pet_name}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Visit Date</label>
                      <input type="date" value={visitForm.visit_date}
                        onChange={e => setVisitForm(p => ({ ...p, visit_date: e.target.value }))} className={inp}/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Next Reminder</label>
                      <select value={visitForm.reminder_option}
                        onChange={e => setVisitForm(p => ({ ...p, reminder_option: e.target.value }))} className={inp}>
                        {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {visitForm.reminder_option === 'custom' && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Custom days (number)</label>
                      <input type="number" value={visitForm.custom_days}
                        onChange={e => setVisitForm(p => ({ ...p, custom_days: e.target.value }))}
                        placeholder="e.g. 45" className={inp}/>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Complaint</label>
                    <textarea value={visitForm.complaint}
                      onChange={e => setVisitForm(p => ({ ...p, complaint: e.target.value }))}
                      placeholder="What is the owner's complaint?" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Clinical Signs</label>
                    <textarea value={visitForm.clinical_signs}
                      onChange={e => setVisitForm(p => ({ ...p, clinical_signs: e.target.value }))}
                      placeholder="Clinical signs observed during examination…" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Diagnosis *</label>
                    <textarea value={visitForm.diagnosis}
                      onChange={e => setVisitForm(p => ({ ...p, diagnosis: e.target.value }))}
                      placeholder="Diagnosis / Problem identified…" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Treatments *</label>
                    <textarea value={visitForm.treatment}
                      onChange={e => setVisitForm(p => ({ ...p, treatment: e.target.value }))}
                      placeholder="Treatments administered…" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Medications Prescribed</label>
                    <textarea value={visitForm.medicines}
                      onChange={e => setVisitForm(p => ({ ...p, medicines: e.target.value }))}
                      placeholder="Medications + dosage + duration…" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                      WhatsApp Reminder Message{' '}
                      <span className="font-normal text-gray-400">(edit as needed)</span>
                    </label>
                    <textarea value={visitForm.reminder_message}
                      onChange={e => setVisitForm(p => ({ ...p, reminder_message: e.target.value }))}
                      placeholder="Type reminder message…" rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                    <div className="mt-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background:'#E0F7FA', color:'#0891B2' }}>
                      📅 Reminder will be set for: <strong>{calcReminderDate(visitForm)}</strong>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={saveVisit}
                      className="flex items-center gap-2 text-white font-extrabold text-sm px-6 py-2.5 rounded-full"
                      style={{ background: '#5BC8D4' }}>✅ Save Visit</button>
                    <button onClick={() => setShowAddVisit(false)}
                      className="font-bold text-sm px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:border-amber-400 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Visit Form */}
              {editingVisit && (
                <div className="bg-white rounded-2xl border-2 p-6 mb-4" style={{ borderColor: '#F59E0B' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-base" style={{ color: '#D97706' }}>
                      ✏️ Edit Visit — {editingVisit.visit_date}
                    </h3>
                    <button onClick={() => setEditingVisit(null)}><X size={18} className="text-gray-400 hover:text-gray-700"/></button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Visit Date</label>
                      <input type="date" value={editVisitForm.visit_date}
                        onChange={e => setEditVisitForm(p => ({ ...p, visit_date: e.target.value }))} className={inp}/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Next Reminder</label>
                      <select value={editVisitForm.reminder_option}
                        onChange={e => setEditVisitForm(p => ({ ...p, reminder_option: e.target.value }))} className={inp}>
                        {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {editVisitForm.reminder_option === 'custom' && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Custom days (number)</label>
                      <input type="number" value={editVisitForm.custom_days}
                        onChange={e => setEditVisitForm(p => ({ ...p, custom_days: e.target.value }))}
                        placeholder="e.g. 45" className={inp}/>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Complaint</label>
                    <textarea value={editVisitForm.complaint}
                      onChange={e => setEditVisitForm(p => ({ ...p, complaint: e.target.value }))}
                      rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Clinical Signs</label>
                    <textarea value={editVisitForm.clinical_signs}
                      onChange={e => setEditVisitForm(p => ({ ...p, clinical_signs: e.target.value }))}
                      rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Diagnosis *</label>
                    <textarea value={editVisitForm.diagnosis}
                      onChange={e => setEditVisitForm(p => ({ ...p, diagnosis: e.target.value }))}
                      rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Treatments *</label>
                    <textarea value={editVisitForm.treatment}
                      onChange={e => setEditVisitForm(p => ({ ...p, treatment: e.target.value }))}
                      rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Medications Prescribed</label>
                    <textarea value={editVisitForm.medicines}
                      onChange={e => setEditVisitForm(p => ({ ...p, medicines: e.target.value }))}
                      rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                  </div>
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                      WhatsApp Reminder Message{' '}
                      <span className="font-normal text-gray-400">(edit as needed)</span>
                    </label>
                    <textarea value={editVisitForm.reminder_message}
                      onChange={e => setEditVisitForm(p => ({ ...p, reminder_message: e.target.value }))}
                      rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors resize-vertical"/>
                    <div className="mt-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background:'#FEF3C7', color:'#D97706' }}>
                      📅 Reminder will be set for: <strong>{calcReminderDate(editVisitForm)}</strong>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={updateVisit}
                      className="flex items-center gap-2 text-white font-extrabold text-sm px-6 py-2.5 rounded-full"
                      style={{ background: '#F59E0B' }}>✅ Update Visit</button>
                    <button onClick={() => setEditingVisit(null)}
                      className="font-bold text-sm px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:border-amber-400 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Visit History Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-extrabold text-base">📋 Visit History ({selected.visits.length})</span>
                </div>
                {selected.visits.length === 0 ? (
                  <div className="p-10 text-center text-gray-400">
                    <div className="text-4xl mb-3">🐾</div>
                    <div className="font-semibold">No visits recorded yet</div>
                    <div className="text-sm mt-1">Click &ldquo;Add Visit&rdquo; above to record the first visit</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Complaint</th>
                        <th className="px-4 py-3 text-left">Clinical Signs</th>
                        <th className="px-4 py-3 text-left">Diagnosis</th>
                        <th className="px-4 py-3 text-left">Treatments</th>
                        <th className="px-4 py-3 text-left">Medications</th>
                        <th className="px-4 py-3 text-left">Reminder</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr></thead>
                      <tbody>
                        {selected.visits.map((v, i) => {
                          const isReminded = v.reminder_sent
                          const waMsg = v.reminder_message ||
                            `Dear ${selected.owner_name}, your ${selected.pet_name} visit to clinic is due for vaccinations/deworming/tick treatments/treatment follow up Visit Dhrisha's Pet Planet - Bhagya nagar 2nd cross (9.30am to 6.30pm) & Paws Care and heal pet clinic - Hanuman nagar (6.45pm to 8.30pm - Sunday Holiday)`
                          return (
                            <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap">{v.visit_date}</td>
                              <td className="px-4 py-3.5 text-sm max-w-[140px]">
                                <div className="line-clamp-2 leading-snug text-gray-600">{v.complaint || '—'}</div>
                              </td>
                              <td className="px-4 py-3.5 text-sm max-w-[140px]">
                                <div className="line-clamp-2 leading-snug text-gray-600">{v.clinical_signs || '—'}</div>
                              </td>
                              <td className="px-4 py-3.5 text-sm max-w-[140px]">
                                <div className="line-clamp-2 leading-snug">{v.diagnosis}</div>
                              </td>
                              <td className="px-4 py-3.5 text-sm max-w-[140px]">
                                <div className="line-clamp-2 leading-snug text-gray-600">{v.treatment}</div>
                              </td>
                              <td className="px-4 py-3.5 text-sm max-w-[120px]">
                                <div className="line-clamp-2 leading-snug text-gray-500">{v.medicines || '—'}</div>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {v.next_reminder_date ? (
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                                    ${isReminded ? 'bg-green-100 text-green-700'
                                      : new Date(v.next_reminder_date) < new Date() ? 'bg-red-100 text-red-600'
                                      : 'bg-amber-100 text-amber-700'}`}>
                                    {isReminded ? '✓ Sent' : v.next_reminder_date}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {v.next_reminder_date && !isReminded && (
                                    <a href={`https://wa.me/91${selected.mobile}?text=${encodeURIComponent(waMsg)}`}
                                      target="_blank" rel="noreferrer"
                                      className="text-xs font-bold px-3 py-1.5 rounded-full text-white whitespace-nowrap"
                                      style={{ background: '#25D366' }}>
                                      📱 Send
                                    </a>
                                  )}
                                  <button
                                    onClick={() => openEditVisit(v)}
                                    title="Edit visit"
                                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors whitespace-nowrap">
                                    <Edit2 size={11}/> Edit
                                  </button>
                                  <button
                                    onClick={() => deleteVisit(v)}
                                    title="Delete visit"
                                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap">
                                    <Trash2 size={11}/> Del
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
          ) : null}
        </div>
      )}
    </div>
  )
}
