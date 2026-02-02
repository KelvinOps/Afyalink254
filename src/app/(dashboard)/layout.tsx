// app/dashboard/layout.tsx
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationProvider } from '@/app/contexts/NotificationContext'
import { WebSocketProvider } from '@/app/contexts/WebSocketContext'
import type { Viewport } from 'next'

// Add this viewport export for dashboard
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

// Simple sidebar component as fallback
function SimpleSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64 
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white">AfyaLink254</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Emergency System</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              <a href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <span>🏠</span>
                <span>Dashboard</span>
              </a>
              <a href="/dashboard/triage" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>🚨</span>
                <span>Triage</span>
              </a>
              <a href="/dashboard/patients" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>👤</span>
                <span>Patients</span>
              </a>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}

// Simple header component as fallback
function SimpleHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mr-4"
            >
              <span>☰</span>
            </button>
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Emergency Dashboard
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.role.replace(/_/g, ' ')}
                  </p>
                  {/* Show permissions for debugging */}
                  <p className="text-xs text-blue-500 dark:text-blue-400">
                    Permissions: {user.permissions?.length || 0}
                  </p>
                </div>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isInitialized } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're initialized, not loading, and no user
    if (isInitialized && !isLoading && !user) {
      console.log('🚫 No user found after initialization, redirecting to login')
      router.push('/login')
    }
  }, [user, isLoading, isInitialized, router])

  // Add error boundary effect
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Dashboard layout error:', error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

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

  // Show error page if there was an error
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/10 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 text-center border border-red-200 dark:border-red-800">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            System Error
          </h1>
          
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            The emergency healthcare system encountered an unexpected issue
          </p>
          
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h2 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                Emergency System Unavailable
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We apologize for the inconvenience. Our technical team has been notified and is working to restore service.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
              >
                Return Home
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-2">
                For immediate emergencies, call:
              </p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                999 / 112
              </p>
              
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-500">
                <p>If this error persists, contact technical support at</p>
                <p className="font-medium">support@healthcare.go.ke</p>
                <p className="mt-2">National Emergency Healthcare System • Kenya Ministry of Health</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated, render the dashboard
  return (
    <NotificationProvider>
      <WebSocketProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/10">
            <div className="flex">
              {/* Sidebar */}
              <SimpleSidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
              />
              
              {/* Main Content */}
              <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
                <SimpleHeader onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 overflow-auto">
                  <div className="p-6 max-w-7xl mx-auto w-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </div>
        </Suspense>
      </WebSocketProvider>
    </NotificationProvider>
  )
}