import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import GoatTracker from '@/components/GoatTracker'

export default async function Dashboard() {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/')
  }

  // Get or create user profile
  let { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // If no profile exists, create a default farm and profile
  if (!userProfile) {
    const { data: newFarm } = await supabase.rpc('create_farm_and_profile', {
      farm_name: `${session.user.email}'s Farm`,
      user_full_name: session.user.user_metadata?.full_name || session.user.email
    })

    // Fetch the created profile
    const { data: createdProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    userProfile = createdProfile
  }

  if (!userProfile) {
    throw new Error('Failed to create user profile')
  }

  return <GoatTracker user={session.user} userProfile={userProfile} />
}