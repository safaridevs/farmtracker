'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { UserProfile, FarmInvitation, ActivityLog } from '@/types/user'
import { getRoleDisplayName, getRoleColor, canPerformAction } from '@/lib/permissions'
import { Users, UserPlus, Mail, Activity, Shield, Trash2, Edit } from 'lucide-react'

interface Props {
  currentUser: UserProfile
  onUpdate: () => void
}

export default function UserManagement({ currentUser, onUpdate }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [invitations, setInvitations] = useState<FarmInvitation[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'invitations' | 'activity'>('users')
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'worker' as 'admin' | 'worker' | 'viewer'
  })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (canPerformAction(currentUser.role, 'canManageUsers')) {
      fetchUsers()
      fetchInvitations()
    }
    if (canPerformAction(currentUser.role, 'canViewLogs')) {
      fetchActivityLogs()
    }
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('farm_id', currentUser.farm_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_invitations')
        .select('*')
        .eq('farm_id', currentUser.farm_id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user_profile:user_id(full_name)
        `)
        .eq('farm_id', currentUser.farm_id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setActivityLogs(data || [])
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('farm_invitations')
        .insert({
          farm_id: currentUser.farm_id,
          email: inviteData.email,
          role: inviteData.role,
          invited_by: currentUser.id
        })

      if (error) throw error
      
      setShowInviteForm(false)
      setInviteData({ email: '', role: 'worker' })
      fetchInvitations()
      
      // Log activity
      await supabase.from('activity_logs').insert({
        farm_id: currentUser.farm_id,
        user_id: currentUser.id,
        action: 'invited_user',
        resource_type: 'invitation',
        details: { email: inviteData.email, role: inviteData.role }
      })
    } catch (error: any) {
      alert('Error sending invitation: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'worker' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .eq('farm_id', currentUser.farm_id)

      if (error) throw error
      fetchUsers()
      
      // Log activity
      await supabase.from('activity_logs').insert({
        farm_id: currentUser.farm_id,
        user_id: currentUser.id,
        action: 'updated_user_role',
        resource_type: 'user',
        resource_id: userId,
        details: { new_role: newRole }
      })
    } catch (error: any) {
      alert('Error updating user role: ' + error.message)
    }
  }

  const deactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .eq('farm_id', currentUser.farm_id)

      if (error) throw error
      fetchUsers()
      
      // Log activity
      await supabase.from('activity_logs').insert({
        farm_id: currentUser.farm_id,
        user_id: currentUser.id,
        action: 'deactivated_user',
        resource_type: 'user',
        resource_id: userId
      })
    } catch (error: any) {
      alert('Error deactivating user: ' + error.message)
    }
  }

  if (!canPerformAction(currentUser.role, 'canManageUsers')) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-500">You don't have permission to manage users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          User Management
        </h2>
        <button
          onClick={() => setShowInviteForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <UserPlus size={20} />
          Invite User
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users size={16} />
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'invitations' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Mail size={16} />
          Invitations ({invitations.length})
        </button>
        {canPerformAction(currentUser.role, 'canViewLogs') && (
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === 'activity' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Activity size={16} />
            Activity
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Farm Team</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-gray-500">{user.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                    {user.role !== 'owner' && currentUser.role === 'owner' && (
                      <div className="flex space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="admin">Admin</option>
                          <option value="worker">Worker</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() => deactivateUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Administrator - Full access</option>
                    <option value="worker">Worker - Can add/edit data</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
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