export interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  phone?: string
  is_active: boolean
  approval_status?: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
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