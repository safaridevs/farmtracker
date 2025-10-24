'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BreedingRecord, Offspring } from '@/types/breeding'
import { Goat } from '@/types/goat'
import { Plus, Calendar, Baby, Heart } from 'lucide-react'

interface Props {
  goats: Goat[]
  onUpdate: () => void
}

export default function BreedingCard({ goats, onUpdate }: Props) {
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    doeId: '',
    buckId: '',
    breedingDate: new Date().toISOString().split('T')[0],
    expectedDueDate: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const does = goats.filter(g => g.gender === 'Female')
  const bucks = goats.filter(g => g.gender === 'Male')

  useEffect(() => {
    fetchBreedingRecords()
  }, [])

  const fetchBreedingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('breeding_records')
        .select(`
          *,
          doe:doe_id(tag_number, owner_name),
          buck:buck_id(tag_number, owner_name)
        `)
        .order('breeding_date', { ascending: false })
      
      if (error) throw error
      setBreedingRecords(data || [])
    } catch (error) {
      console.error('Error fetching breeding records:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate expected due date (150 days from breeding)
      const breedingDate = new Date(formData.breedingDate)
      const expectedDue = new Date(breedingDate)
      expectedDue.setDate(expectedDue.getDate() + 150)

      const { error } = await supabase
        .from('breeding_records')
        .insert({
          doe_id: formData.doeId,
          buck_id: formData.buckId,
          breeding_date: formData.breedingDate,
          expected_due_date: expectedDue.toISOString().split('T')[0],
          notes: formData.notes || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error
      
      // Update doe status to pregnant
      await supabase
        .from('goats')
        .update({ breeding_status: 'Pregnant' })
        .eq('id', formData.doeId)

      setShowForm(false)
      setFormData({
        doeId: '',
        buckId: '',
        breedingDate: new Date().toISOString().split('T')[0],
        expectedDueDate: '',
        notes: ''
      })
      fetchBreedingRecords()
      onUpdate()
    } catch (error: any) {
      alert('Error adding breeding record: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updatePregnancyStatus = async (recordId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('breeding_records')
        .update({ pregnancy_status: status })
        .eq('id', recordId)

      if (error) throw error
      fetchBreedingRecords()
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bred': return 'bg-blue-100 text-blue-800'
      case 'Confirmed': return 'bg-green-100 text-green-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      case 'Birthed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-600" />
          Breeding Management
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Record Breeding
        </button>
      </div>

      {/* Breeding Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {breedingRecords.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No breeding records yet</p>
          </div>
        ) : (
          breedingRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.pregnancy_status)}`}>
                  {record.pregnancy_status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(record.breeding_date).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium text-pink-600">Doe:</span> {record.doe?.tag_number}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-blue-600">Buck:</span> {record.buck?.tag_number}
                </p>
                
                {record.expected_due_date && (
                  <p className="text-sm">
                    <span className="font-medium">Due:</span> {new Date(record.expected_due_date).toLocaleDateString()}
                    {record.pregnancy_status === 'Confirmed' && (
                      <span className="ml-2 text-xs text-orange-600 font-medium">
                        ({getDaysUntilDue(record.expected_due_date)} days)
                      </span>
                    )}
                  </p>
                )}

                {record.number_of_kids && (
                  <p className="text-sm">
                    <span className="font-medium">Kids:</span> {record.number_of_kids}
                  </p>
                )}
              </div>

              {record.pregnancy_status === 'Bred' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePregnancyStatus(record.id, 'Confirmed')}
                    className="flex-1 bg-green-500 text-white text-xs py-1 px-2 rounded hover:bg-green-600"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => updatePregnancyStatus(record.id, 'Failed')}
                    className="flex-1 bg-red-500 text-white text-xs py-1 px-2 rounded hover:bg-red-600"
                  >
                    Failed
                  </button>
                </div>
              )}

              {record.pregnancy_status === 'Confirmed' && (
                <button
                  onClick={() => updatePregnancyStatus(record.id, 'Birthed')}
                  className="w-full bg-purple-500 text-white text-xs py-1 px-2 rounded hover:bg-purple-600"
                >
                  Record Birth
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Breeding Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Record Breeding</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Doe (Female)</label>
                  <select
                    value={formData.doeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, doeId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="">Select Doe</option>
                    {does.map(doe => (
                      <option key={doe.id} value={doe.id}>
                        {doe.tag_number} - {doe.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Buck (Male)</label>
                  <select
                    value={formData.buckId}
                    onChange={(e) => setFormData(prev => ({ ...prev, buckId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="">Select Buck</option>
                    {bucks.map(buck => (
                      <option key={buck.id} value={buck.id}>
                        {buck.tag_number} - {buck.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Breeding Date</label>
                  <input
                    type="date"
                    value={formData.breedingDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, breedingDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  >
                    {loading ? 'Recording...' : 'Record Breeding'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}