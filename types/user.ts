export interface Farm {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
}

export interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  phone?: string
  role: 'owner' | 'admin' | 'worker' | 'viewer'
  farm_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FarmInvitation {
  id: string
  farm_id: string
  email: string
  role: 'admin' | 'worker' | 'viewer'
  invited_by: string
  accepted_at?: string
  expires_at: string
  created_at: string
}

export interface ActivityLog {
  id: string
  farm_id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: any
  created_at: string
  user_profile?: {
    full_name?: string
  }
}

export type UserRole = 'owner' | 'admin' | 'worker' | 'viewer'

export interface RolePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManageUsers: boolean
  canViewLogs: boolean
}