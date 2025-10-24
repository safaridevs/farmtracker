'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Goat } from '@/types/goat'
import { X } from 'lucide-react'

interface Props {
  selectedGoat: Goat
  goats: Goat[]
  onClose: () => void
  onSuccess: () => void
}

export default function BreedingModal({ selectedGoat, goats, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    doeId: selectedGoat.gender === 'Female' ? selectedGoat.id : '',
    buckId: selectedGoat.gender === 'Male' ? selectedGoat.id : '',
    breedingDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const does = goats.filter(g => g.gender === 'Female')
  const bucks = goats.filter(g => g.gender === 'Male')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
      
      await supabase
        .from('goats')
        .update({ breeding_status: 'Pregnant' })
        .eq('id', formData.doeId)

      onSuccess()
      onClose()
    } catch (error: any) {
      alert('Error adding breeding record: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Record Breeding</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          
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
                onClick={onClose}
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
  )
}