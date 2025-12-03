'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Goat } from '@/types/goat'
import { AlertTriangle, CheckCircle, XCircle, Baby, Users, TreePine, Heart } from 'lucide-react'

interface BreedingCompatibility {
  compatible: boolean
  inbreeding_coefficient: number
  risk_level: 'low' | 'medium' | 'high' | 'prohibited'
  recommendation: string
}

interface Props {
  goats: Goat[]
  onUpdate: () => void
}

export default function AdvancedBreeding({ goats, onUpdate }: Props) {
  const [selectedDoe, setSelectedDoe] = useState<string>('')
  const [selectedBuck, setSelectedBuck] = useState<string>('')
  const [compatibility, setCompatibility] = useState<BreedingCompatibility | null>(null)
  const [loading, setLoading] = useState(false)
  const [breedingDate, setBreedingDate] = useState(new Date().toISOString().split('T')[0])
  const [conceptionMethod, setConceptionMethod] = useState<'natural' | 'artificial_insemination'>('natural')
  const [showOffspring, setShowOffspring] = useState(false)
  const [offspring, setOffspring] = useState<any[]>([])

  const supabase = createClient()
  const does = goats.filter(g => g.gender === 'Female')
  const bucks = goats.filter(g => g.gender === 'Male')

  useEffect(() => {
    if (selectedDoe && selectedBuck) {
      checkCompatibility()
    } else {
      setCompatibility(null)
    }
  }, [selectedDoe, selectedBuck])

  const checkCompatibility = async () => {
    if (!selectedDoe || !selectedBuck) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('check_breeding_compatibility', {
        doe_id: selectedDoe,
        buck_id: selectedBuck
      })

      if (error) throw error
      setCompatibility(data[0])
    } catch (error) {
      console.error('Error checking compatibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBreeding = async () => {
    if (!selectedDoe || !selectedBuck || !compatibility?.compatible) return

    setLoading(true)
    try {
      const expectedDueDate = new Date(breedingDate)
      expectedDueDate.setDate(expectedDueDate.getDate() + 150)

      const { error } = await supabase
        .from('breeding_records')
        .insert({
          doe_id: selectedDoe,
          buck_id: selectedBuck,
          breeding_date: breedingDate,
          expected_due_date: expectedDueDate.toISOString().split('T')[0],
          conception_method: conceptionMethod,
          predicted_inbreeding_coefficient: compatibility.inbreeding_coefficient,
          breeding_approved: compatibility.compatible,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error

      // Update goat breeding status
      await supabase
        .from('goats')
        .update({ breeding_status: 'Pregnant' })
        .eq('id', selectedDoe)

      setSelectedDoe('')
      setSelectedBuck('')
      setCompatibility(null)
      onUpdate()
    } catch (error: any) {
      alert('Error recording breeding: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchOffspring = async () => {
    try {
      const { data, error } = await supabase
        .from('offspring')
        .select(`
          *,
          goat:goat_id(tag_number, gender, birth_date),
          breeding_record:breeding_record_id(
            doe:doe_id(tag_number),
            buck:buck_id(tag_number)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOffspring(data || [])
    } catch (error) {
      console.error('Error fetching offspring:', error)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'prohibited': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle size={16} />
      case 'medium': return <AlertTriangle size={16} />
      case 'high': return <AlertTriangle size={16} />
      case 'prohibited': return <XCircle size={16} />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="text-pink-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Advanced Breeding Management</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doe Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Doe (Female)
            </label>
            <select
              value={selectedDoe}
              onChange={(e) => setSelectedDoe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Choose a doe...</option>
              {does.map((doe) => (
                <option key={doe.id} value={doe.id}>
                  {doe.tag_number} - {doe.owner_name}
                </option>
              ))}
            </select>
          </div>

          {/* Buck Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Buck (Male)
            </label>
            <select
              value={selectedBuck}
              onChange={(e) => setSelectedBuck(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Choose a buck...</option>
              {bucks.map((buck) => (
                <option key={buck.id} value={buck.id}>
                  {buck.tag_number} - {buck.owner_name}
                </option>
              ))}
            </select>
          </div>

          {/* Breeding Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Breeding Date
            </label>
            <input
              type="date"
              value={breedingDate}
              onChange={(e) => setBreedingDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Conception Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conception Method
            </label>
            <select
              value={conceptionMethod}
              onChange={(e) => setConceptionMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="natural">Natural Breeding</option>
              <option value="artificial_insemination">Artificial Insemination</option>
            </select>
          </div>
        </div>

        {/* Compatibility Results */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Analyzing genetic compatibility...</p>
          </div>
        )}

        {compatibility && (
          <div className="mt-6 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getRiskColor(compatibility.risk_level)}`}>
                {getRiskIcon(compatibility.risk_level)}
                {compatibility.risk_level.toUpperCase()} RISK
              </span>
              <span className="text-sm text-gray-600">
                Inbreeding Coefficient: {(compatibility.inbreeding_coefficient * 100).toFixed(2)}%
              </span>
            </div>
            <p className="text-gray-700 mb-4">{compatibility.recommendation}</p>
            
            {compatibility.compatible ? (
              <button
                onClick={handleBreeding}
                disabled={loading}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50 transition"
              >
                {loading ? 'Recording...' : 'Record Breeding'}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 font-medium">⚠️ Breeding Not Recommended</p>
                <p className="text-red-600 text-sm">This pairing has been flagged due to high inbreeding risk.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offspring Tracking */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Baby className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Offspring Tracking</h3>
          </div>
          <button
            onClick={() => {
              setShowOffspring(!showOffspring)
              if (!showOffspring) fetchOffspring()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showOffspring ? 'Hide' : 'Show'} Offspring
          </button>
        </div>

        {showOffspring && (
          <div className="space-y-4">
            {offspring.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No offspring records found</p>
            ) : (
              offspring.map((kid) => (
                <div key={kid.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {kid.goat?.tag_number || 'Unnamed Kid'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Parents: {kid.breeding_record?.doe?.tag_number} × {kid.breeding_record?.buck?.tag_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        Birth Order: #{kid.birth_order} | Status: {kid.survival_status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        Birth Weight: {kid.birth_weight || 'N/A'} kg
                      </p>
                      <p className="text-xs text-gray-500">
                        Born: {kid.goat?.birth_date || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}