import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/AuthForm'

export default async function Home() {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">🐐 Farm Tracker</h1>
          <p className="text-gray-600">Modern goat management system</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}