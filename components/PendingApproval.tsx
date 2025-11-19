'use client'

import { Clock, AlertCircle } from 'lucide-react'

interface Props {
  userEmail: string
}

export default function PendingApproval({ userEmail }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <Clock className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Account Pending Approval
          </h1>
          <p className="text-gray-600">
            Your account ({userEmail}) has been created but requires administrator approval before you can access the Farm Tracker.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-left">
              <h3 className="font-medium text-yellow-800 mb-1">What happens next?</h3>
              <p className="text-sm text-yellow-700">
                An administrator will review your registration request. You'll receive an email notification once your account is approved.
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>If you have questions, please contact your administrator.</p>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Check Status
        </button>
      </div>
    </div>
  )
}