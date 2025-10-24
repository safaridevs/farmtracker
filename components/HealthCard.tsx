'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { HealthRecord } from '@/types/health'
import { Plus, Calendar, DollarSign, User, FileText } from 'lucide-react'

interface Props {
  goatId: string
  records: HealthRecord[]
  onUpdate: () => void
}

export default function HealthCard({ goatId, records, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Vaccination' as HealthRecord['record_type'],
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    cost: '',
    veterinarian: ''
  })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('health_records')
        .insert({
          goat_id: goatId,
          record_type: formData.type,
          title: formData.title,
          description: formData.description || null,
          date: formData.date,
          next_due_date: formData.nextDueDate || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          veterinarian: formData.veterinarian || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error
      
      setShowForm(false)
      setFormData({
        type: 'Vaccination',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        cost: '',
        veterinarian: ''
      })
      onUpdate()
    } catch (error: any) {
      alert('Error adding health record: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Vaccination': return 'bg-green-100 text-green-800'
      case 'Treatment': return 'bg-red-100 text-red-800'
      case 'Checkup': return 'bg-blue-100 text-blue-800'
      case 'Weight': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Health Records</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition flex items-center gap-1 text-sm"
        >
          <Plus size={16} />
          Add Record
        </button>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {records.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No health records yet</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(record.record_type)}`}>
                  {record.record_type}
                </span>
                <span className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</span>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">{record.title}</h4>
              {record.description && (
                <p className="text-sm text-gray-600 mb-2">{record.description}</p>
              )}
              <div className="flex gap-4 text-xs text-gray-500">
                {record.cost && (
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} />
                    ${record.cost}
                  </span>
                )}
                {record.veterinarian && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {record.veterinarian}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Health Record</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as HealthRecord['record_type'] }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Vaccination">Vaccination</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Checkup">Checkup</option>
                    <option value="Weight">Weight</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Record'}
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