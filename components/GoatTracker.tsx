'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Goat } from '@/types/goat'
import { HealthRecord } from '@/types/health'
import { User } from '@supabase/supabase-js'
import { LogOut, Plus, Search, Filter, X, BarChart3, Heart, Baby } from 'lucide-react'
import { useRouter } from 'next/navigation'
import GoatForm from './GoatForm'
import GoatCard from './GoatCard'
import Analytics from './Analytics'
import BreedingCard from './BreedingCard'

interface Props {
  user: User
}

export default function GoatTracker({ user }: Props) {
  const [goats, setGoats] = useState<Goat[]>([])
  const [filteredGoats, setFilteredGoats] = useState<Goat[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGoat, setEditingGoat] = useState<Goat | null>(null)
  const [activeTab, setActiveTab] = useState<'goats' | 'analytics' | 'breeding'>('goats')
  const [filters, setFilters] = useState({
    tag: '',
    owner: '',
    gender: ''
  })
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchGoats()
    fetchHealthRecords()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [goats, filters])

  const fetchGoats = async () => {
    try {
      const { data, error } = await supabase
        .from('goats')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setGoats(data || [])
    } catch (error) {
      console.error('Error fetching goats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHealthRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      setHealthRecords(data || [])
    } catch (error) {
      console.error('Error fetching health records:', error)
    }
  }

  const applyFilters = () => {
    let filtered = goats

    if (filters.tag) {
      filtered = filtered.filter(goat => 
        goat.tag_number.toLowerCase().includes(filters.tag.toLowerCase())
      )
    }

    if (filters.owner) {
      filtered = filtered.filter(goat => 
        goat.owner_name.toLowerCase().includes(filters.owner.toLowerCase())
      )
    }

    if (filters.gender) {
      filtered = filtered.filter(goat => goat.gender === filters.gender)
    }

    setFilteredGoats(filtered)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const resetFilters = () => {
    setFilters({ tag: '', owner: '', gender: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-green-700">🐐 Farm Tracker</h1>
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Plus size={20} />
                Add Goat
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setActiveTab('goats')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'goats' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart size={16} />
              Goats
            </button>
            <button
              onClick={() => setActiveTab('breeding')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'breeding' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Baby size={16} />
              Breeding
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'analytics' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag Number</label>
              <input
                type="text"
                value={filters.tag}
                onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                placeholder="Search by tag..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <input
                type="text"
                value={filters.owner}
                onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Search by owner..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
              >
                <X size={16} />
                Reset
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredGoats.length} of {goats.length} goats
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'goats' ? (
          <>
            {/* Goats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoats.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🐐</div>
                  <p className="text-gray-500 text-lg">
                    {goats.length === 0 ? 'No goats registered yet.' : 'No goats match your filters.'}
                  </p>
                </div>
              ) : (
                filteredGoats.map((goat) => (
                  <GoatCard 
                    key={goat.id} 
                    goat={goat} 
                    onUpdate={() => {
                      fetchGoats()
                      fetchHealthRecords()
                    }}
                    onEdit={(goat) => {
                      setEditingGoat(goat)
                      setShowForm(true)
                    }}
                    healthRecords={healthRecords.filter(r => r.goat_id === goat.id)}
                  />
                ))
              )}
            </div>
          </>
        ) : activeTab === 'breeding' ? (
          <BreedingCard goats={goats} onUpdate={fetchGoats} />
        ) : (
          <Analytics goats={goats} healthRecords={healthRecords} />
        )}

        {/* Add/Edit Goat Form Modal */}
        {showForm && (
          <GoatForm
            onClose={() => {
              setShowForm(false)
              setEditingGoat(null)
            }}
            onSuccess={() => {
              setShowForm(false)
              setEditingGoat(null)
              fetchGoats()
            }}
            userId={user.id}
            editGoat={editingGoat || undefined}
          />
        )}
      </div>
    </div>
  )
}