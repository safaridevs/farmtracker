import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardWrapper from '@/components/DashboardWrapper'

export default async function Dashboard() {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/')
  }

  // Get user profile (simplified)
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return <DashboardWrapper user={session.user} initialProfile={userProfile} />
}