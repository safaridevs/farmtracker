'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Check, X, Clock, Users } from 'lucide-react'

interface PendingUser {
  id: string
  email: string
  full_name?: string
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function UserApproval() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, approval_status, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get user emails from auth.users
      const userIds = data?.map(u => u.id) || []
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .in('id', userIds)

      if (authError) {
        console.error('Auth error:', authError)
      }

      // Combine data
      const usersWithEmails = data?.map(user => ({
        ...user,
        email: authUsers?.find(au => au.id === user.id)?.email || 'Unknown'
      })) || []

      setPendingUsers(usersWithEmails)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', { user_id: userId })
      if (error) throw error
      fetchPendingUsers()
    } catch (error) {
      console.error('Error approving user:', error)
    }
  }

  const handleReject = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('reject_user', { user_id: userId })
      if (error) throw error
      fetchPendingUsers()
    } catch (error) {
      console.error('Error rejecting user:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-blue-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No users to manage</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {user.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Registered: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.approval_status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : user.approval_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.approval_status === 'pending' && <Clock size={14} className="inline mr-1" />}
                    {user.approval_status === 'approved' && <Check size={14} className="inline mr-1" />}
                    {user.approval_status === 'rejected' && <X size={14} className="inline mr-1" />}
                    {user.approval_status}
                  </span>
                  
                  {user.approval_status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}