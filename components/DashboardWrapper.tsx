'use client'

import { useState } from 'react'
import { UserProfile } from '@/types/user'
import GoatTracker from './GoatTracker'
import FarmSetup from './FarmSetup'

interface Props {
  user: any
  initialProfile: UserProfile | null
}

export default function DashboardWrapper({ user, initialProfile }: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile)

  // If no profile or farm, show setup
  if (!userProfile || !userProfile.farm_id) {
    return (
      <FarmSetup 
        user={user} 
        onComplete={(profile) => setUserProfile(profile)} 
      />
    )
  }

  return <GoatTracker user={user} userProfile={userProfile} />
}