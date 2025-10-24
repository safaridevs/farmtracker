'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Farm, UserProfile } from '@/types/user'
import { Home, Users, Settings } from 'lucide-react'

interface Props {
  user: any
  onComplete: (profile: UserProfile) => void
}

export default function FarmSetup({ user, onComplete }: Props) {
  const [farmName, setFarmName] = useState(`${user.email?.split('@')[0]}'s Farm`)
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create farm
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .insert({
          name: farmName,
          owner_id: user.id
        })
        .select()
        .single()

      if (farmError) throw farmError

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          role: 'owner',
          farm_id: farm.id
        })
        .select(`
          *,
          farm:farm_id(*)
        `)
        .single()

      if (profileError) throw profileError

      onComplete(profile)
    } catch (error: any) {
      alert('Error setting up farm: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Farm Tracker!</h1>
          <p className="text-gray-600">Let's set up your farm to get started</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farm Name
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your farm name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">What you'll get:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Complete goat management system
              </li>
              <li className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Health tracking & breeding records
              </li>
              <li className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Smart notifications & analytics
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
          >
            {loading ? 'Setting up your farm...' : 'Create My Farm'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          You'll be set up as the farm owner with full access to all features.
        </p>
      </div>
    </div>
  )
}