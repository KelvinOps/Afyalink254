// src/app/(dashboard)/layout.tsx
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { Sidebar } from '@/app/components/layout/Sidebar'
import { Header } from '@/app/components/layout/Header'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isInitialized } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're initialized, not loading, and no user
    if (isInitialized && !isLoading && !user) {
      console.log('🚫 No user found after initialization, redirecting to login')
      router.push('/login')
    }
  }, [user, isLoading, isInitialized, router])

  // Show loading during initial authentication check
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // If no user but we're initialized, don't render anything (redirect will happen)
  if (!user) {
    return null
  }

  // User is authenticated, render the dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/10">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 overflow-auto">
            <div className="p-6 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}