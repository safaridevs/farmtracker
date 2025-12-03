'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Goat } from '@/types/goat'
import { Heart, Calendar, Baby, TrendingUp, Plus, Eye } from 'lucide-react'

interface Props {
  goats: Goat[]
  onUpdate: () => void
}

export default function IntegratedBreedingSystem({ goats, onUpdate }: Props) {
  const [breedingRecords, setBreedingRecords] = useState<any[]>([])
  const [heatCycles, setHeatCycles] = useState<any[]>([])
  const [pregnancyChecks, setPregnancyChecks] = useState<any[]>([])
  const [kiddingRecords, setKiddingRecords] = useState<any[]>([])
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [showModal, setShowModal] = useState<'heat' | 'pregnancy' | 'kidding' | null>(null)
  
  const supabase = createClient()
  const does = goats.filter(g => g.gender === 'Female')
  const bucks = goats.filter(g => g.gender === 'Male')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    await Promise.all([
      fetchBreedingRecords(),
      fetchHeatCycles(),
      fetchPregnancyChecks(),
      fetchKiddingRecords()
    ])
  }

  const fetchBreedingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('breeding_records')
        .select(`
          *,
          doe:doe_id(id, tag_number, owner_name),
          buck:buck_id(id, tag_number, owner_name)
        `)
        .order('breeding_date', { ascending: false })
      
      if (error) throw error
      setBreedingRecords(data || [])
    } catch (error) {
      console.error('Error fetching breeding records:', error)
    }
  }

  const fetchHeatCycles = async () => {
    try {
      const { data, error } = await supabase
        .from('heat_cycles')
        .select(`
          *,
          doe:doe_id(tag_number, owner_name)
        `)
        .order('heat_start_date', { ascending: false })
      
      if (error) throw error
      setHeatCycles(data || [])
    } catch (error) {
      console.error('Error fetching heat cycles:', error)
    }
  }

  const fetchPregnancyChecks = async () => {
    try {
      const { data, error } = await supabase
        .from('pregnancy_monitoring')
        .select(`
          *,
          breeding_record:breeding_record_id(
            doe:doe_id(tag_number),
            buck:buck_id(tag_number)
          )
        `)
        .order('check_date', { ascending: false })
      
      if (error) throw error
      setPregnancyChecks(data || [])
    } catch (error) {
      console.error('Error fetching pregnancy checks:', error)
    }
  }

  const fetchKiddingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('kidding_records')
        .select(`
          *,
          breeding_record:breeding_record_id(
            doe:doe_id(tag_number),
            buck:buck_id(tag_number)
          )
        `)
        .order('kidding_date', { ascending: false })
      
      if (error) throw error
      setKiddingRecords(data || [])
    } catch (error) {
      console.error('Error fetching kidding records:', error)
    }
  }

  const addHeatCycle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const { error } = await supabase
        .from('heat_cycles')
        .insert({
          doe_id: formData.get('doe_id'),
          heat_start_date: formData.get('heat_start_date'),
          intensity: formData.get('intensity'),
          notes: formData.get('notes')
        })

      if (error) throw error
      setShowModal(null)
      fetchHeatCycles()
    } catch (error: any) {
      alert('Error adding heat cycle: ' + error.message)
    }
  }

  const addPregnancyCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const { error } = await supabase
        .from('pregnancy_monitoring')
        .insert({
          breeding_record_id: formData.get('breeding_record_id'),
          check_date: formData.get('check_date'),
          check_type: formData.get('check_type'),
          pregnancy_confirmed: formData.get('pregnancy_confirmed') === 'true',
          estimated_kids: formData.get('estimated_kids') || null,
          notes: formData.get('notes')
        })

      if (error) throw error
      setShowModal(null)
      fetchPregnancyChecks()
    } catch (error: any) {
      alert('Error adding pregnancy check: ' + error.message)
    }
  }

  const addKiddingRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const { error } = await supabase
        .from('kidding_records')
        .insert({
          breeding_record_id: formData.get('breeding_record_id'),
          kidding_date: formData.get('kidding_date'),
          kidding_type: formData.get('kidding_type'),
          total_kids_born: formData.get('total_kids_born'),
          kids_alive: formData.get('kids_alive'),
          kids_stillborn: formData.get('kids_stillborn') || 0,
          dam_condition: formData.get('dam_condition'),
          notes: formData.get('notes')
        })

      if (error) throw error
      
      // Update breeding record status
      await supabase
        .from('breeding_records')
        .update({ 
          status: 'birthed',
          actual_birth_date: formData.get('kidding_date'),
          number_of_kids: formData.get('kids_alive')
        })
        .eq('id', formData.get('breeding_record_id'))

      setShowModal(null)
      fetchKiddingRecords()
      fetchBreedingRecords()
      onUpdate()
    } catch (error: any) {
      alert('Error adding kidding record: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breeding Records with Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Active Breeding Records</h3>
        <div className="space-y-3">
          {breedingRecords.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {record.doe?.tag_number} × {record.buck?.tag_number}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Bred: {new Date(record.breeding_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Due: {record.expected_due_date ? new Date(record.expected_due_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    record.status === 'bred' ? 'bg-yellow-100 text-yellow-800' :
                    record.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    record.status === 'birthed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedRecord(record)
                      setShowModal('pregnancy')
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Calendar size={14} />
                    Pregnancy Check
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRecord(record)
                      setShowModal('kidding')
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <Baby size={14} />
                    Record Birth
                  </button>
                </div>
              </div>
              
              {/* Show related checks */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium text-gray-700">Pregnancy Checks:</p>
                    {pregnancyChecks.filter(c => c.breeding_record_id === record.id).map(check => (
                      <p key={check.id} className="text-gray-600">
                        {new Date(check.check_date).toLocaleDateString()} - {check.check_type} - 
                        {check.pregnancy_confirmed ? ' ✓ Confirmed' : ' ✗ Not Confirmed'}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Kidding:</p>
                    {kiddingRecords.filter(k => k.breeding_record_id === record.id).map(kidding => (
                      <p key={kidding.id} className="text-gray-600">
                        {new Date(kidding.kidding_date).toLocaleDateString()} - 
                        {kidding.total_kids_born} kids ({kidding.kids_alive} alive)
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heat Cycle Tracking */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Heart className="text-pink-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Heat Cycles</h3>
          </div>
          <button
            onClick={() => setShowModal('heat')}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Record Heat
          </button>
        </div>
        
        <div className="space-y-2">
          {heatCycles.map((cycle) => (
            <div key={cycle.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{cycle.doe?.tag_number}</p>
                <p className="text-sm text-gray-600">
                  {new Date(cycle.heat_start_date).toLocaleDateString()} - {cycle.intensity}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${cycle.bred ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {cycle.bred ? 'Bred' : 'Not Bred'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showModal === 'heat' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Record Heat Cycle</h3>
            <form onSubmit={addHeatCycle} className="space-y-4">
              <select name="doe_id" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Doe</option>
                {does.map(doe => (
                  <option key={doe.id} value={doe.id}>{doe.tag_number} - {doe.owner_name}</option>
                ))}
              </select>
              <input name="heat_start_date" type="date" required className="w-full px-3 py-2 border rounded-lg" />
              <select name="intensity" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Intensity</option>
                <option value="weak">Weak</option>
                <option value="moderate">Moderate</option>
                <option value="strong">Strong</option>
              </select>
              <textarea name="notes" className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Notes..."></textarea>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-pink-600 text-white py-2 rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'pregnancy' && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Pregnancy Check - {selectedRecord.doe?.tag_number}</h3>
            <form onSubmit={addPregnancyCheck} className="space-y-4">
              <input type="hidden" name="breeding_record_id" value={selectedRecord.id} />
              <input name="check_date" type="date" required className="w-full px-3 py-2 border rounded-lg" />
              <select name="check_type" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Check Type</option>
                <option value="visual">Visual</option>
                <option value="palpation">Palpation</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="blood_test">Blood Test</option>
              </select>
              <select name="pregnancy_confirmed" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Pregnancy Status</option>
                <option value="true">Confirmed Pregnant</option>
                <option value="false">Not Pregnant</option>
              </select>
              <input name="estimated_kids" type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="Estimated Kids" />
              <textarea name="notes" className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Notes..."></textarea>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'kidding' && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 my-8">
            <h3 className="text-xl font-bold mb-4">Record Birth - {selectedRecord.doe?.tag_number}</h3>
            <form onSubmit={addKiddingRecord} className="space-y-4">
              <input type="hidden" name="breeding_record_id" value={selectedRecord.id} />
              <input name="kidding_date" type="datetime-local" required className="w-full px-3 py-2 border rounded-lg" />
              <select name="kidding_type" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Kidding Type</option>
                <option value="natural">Natural</option>
                <option value="assisted">Assisted</option>
                <option value="cesarean">Cesarean</option>
              </select>
              <input name="total_kids_born" type="number" required className="w-full px-3 py-2 border rounded-lg" placeholder="Total Kids Born" />
              <input name="kids_alive" type="number" required className="w-full px-3 py-2 border rounded-lg" placeholder="Kids Alive" />
              <input name="kids_stillborn" type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="Stillborn (optional)" />
              <select name="dam_condition" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Dam Condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              <textarea name="notes" className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Notes..."></textarea>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg">Save Birth</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}