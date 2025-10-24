import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import GoatTracker from '@/components/GoatTracker'
import FarmSetup from '@/components/FarmSetup'
import DashboardWrapper from '@/components/DashboardWrapper'

export default async function Dashboard() {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/')
  }

  // Get or create user profile
  let { data: userProfile } = await supabase
    .from('user_profiles')
    .select(`
      *,
      farm:farm_id(
        id,
        name,
        description,
        owner_id
      )
    `)
    .eq('id', session.user.id)
    .single()

  // If no profile exists, create one automatically
  if (!userProfile) {
    // Get or create farm for user
    const { data: farmId } = await supabase.rpc('get_or_create_farm_for_user')
    
    if (farmId) {
      // Fetch the profile again
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .select(`
          *,
          farm:farm_id(
            id,
            name,
            description,
            owner_id
          )
        `)
        .eq('id', session.user.id)
        .single()
      
      userProfile = newProfile
    }
  }

  // Fallback: create minimal profile if still missing
  if (!userProfile) {
    userProfile = {
      id: session.user.id,
      full_name: session.user.email,
      role: 'owner' as const,
      farm_id: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      farm: null
    }
  }

  return <DashboardWrapper user={session.user} initialProfile={userProfile} />
}