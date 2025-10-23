import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import GoatTracker from '@/components/GoatTracker'

export default async function Dashboard() {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/')
  }

  return <GoatTracker user={session.user} />
}