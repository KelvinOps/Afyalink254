// app/unauthorized/page.tsx
'use client'

import Link from 'next/link'
import { Shield, AlertTriangle, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border border-red-200">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Access Denied
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="font-semibold text-yellow-800">
              Insufficient Permissions
            </h2>
          </div>
          <p className="text-sm text-slate-600">
            Your account does not have permission to access this section of the system.
            Please contact your system administrator if you believe this is an error.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Return to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-2">
            For immediate emergencies, call:
          </p>
          <p className="text-xl font-bold text-red-600">
            999 / 112
          </p>
          
          <div className="mt-4 text-xs text-slate-500">
            <p>If you need access to this module, contact technical support at</p>
            <p className="font-medium">support@healthcare.go.ke</p>
            <p className="mt-2">National Emergency Healthcare System • Kenya Ministry of Health</p>
          </div>
        </div>
      </div>
    </div>
  )
}