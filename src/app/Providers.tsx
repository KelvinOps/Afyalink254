// /app/Providers.tsx 
'use client'

import { AuthProvider } from '@/app/contexts/AuthContext'
import { NotificationProvider } from '@/app/contexts/NotificationContext'
import { Suspense } from 'react'

// Simple loading component for suspense
function ProvidersLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ProvidersLoading />}>
      <AuthProvider>
        <NotificationProvider>
         
          {children}
        </NotificationProvider>
      </AuthProvider>
    </Suspense>
  )
}