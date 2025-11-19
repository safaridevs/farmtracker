'use client'

import { useState } from 'react'
import { UserProfile } from '@/types/user'
import GoatTracker from './GoatTracker'
import PendingApproval from './PendingApproval'

interface Props {
  user: any
  initialProfile: UserProfile | null
}

export default function DashboardWrapper({ user, initialProfile }: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile)

  // Create default profile if none exists
  const profile = userProfile || {
    id: user.id,
    full_name: user.email,
    is_active: true,
    approval_status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Check if user needs approval
  if (profile.approval_status === 'pending' || !profile.is_active) {
    return <PendingApproval userEmail={user.email || ''} />
  }

  return <GoatTracker user={user} userProfile={profile} />
}