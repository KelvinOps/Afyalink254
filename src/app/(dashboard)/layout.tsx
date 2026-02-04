// /app/(dashboard)/layout.tsx 
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationProvider } from '@/app/contexts/NotificationContext'
import { WebSocketProvider } from '@/app/contexts/WebSocketContext'

// Dashboard Layout Wrapper
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
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

  // Show loading during initial authentication check
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border border-red-200">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            System Error
          </h1>
          
          <p className="text-slate-600 mb-6">
            The emergency healthcare system encountered an unexpected issue
          </p>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h2 className="font-semibold text-red-800 mb-2">
                Emergency System Unavailable
              </h2>
              <p className="text-sm text-slate-600">
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
                className="w-full px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Return Home
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

  return (
    <NotificationProvider>
      <WebSocketProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="flex">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
              <Header onMenuClick={() => setSidebarOpen(true)} />
              
              <main className="flex-1 overflow-auto">
                <div className="p-6 max-w-7xl mx-auto w-full">
                  <Suspense fallback={
                    <div className="min-h-[60vh] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading content...</p>
                      </div>
                    </div>
                  }>
                    {children}
                  </Suspense>
                </div>
              </main>
            </div>
          </div>
        </div>
      </WebSocketProvider>
    </NotificationProvider>
  )
}

// Sidebar Component (keep as is)
function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
        fixed lg:fixed inset-y-0 left-0 z-50 w-64 
        bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="font-bold text-slate-900">AfyaLink254</h1>
                <p className="text-xs text-slate-500">Emergency System</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              <a 
                href="/dashboard" 
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <span>🏠</span>
                <span>Dashboard</span>
              </a>
              <a 
                href="/dashboard/triage" 
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <span>🚨</span>
                <span>Triage</span>
              </a>
              <a 
                href="/dashboard/patients" 
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <span>👤</span>
                <span>Patients</span>
              </a>
              <a 
                href="/dashboard/dispatch" 
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <span>🚑</span>
                <span>Dispatch</span>
              </a>
              <a 
                href="/dashboard/reports" 
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <span>📊</span>
                <span>Reports</span>
              </a>
            </div>
          </nav>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-sm text-slate-600">Emergency Hotline</p>
              <p className="text-lg font-bold text-red-600">999 / 112</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Header Component (keep as is)
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 mr-4 transition-colors"
              aria-label="Toggle menu"
            >
              <span className="text-xl">☰</span>
            </button>
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-slate-900">
                Emergency Dashboard
              </h1>
              <p className="text-sm text-slate-600">Real-time emergency coordination</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.role?.replace(/_/g, ' ') || 'User'}
                  </p>
                </div>
                <div className="relative group">
                  <button className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-3 border-b border-slate-100">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                    >
                      Logout
                    </button>
                  </div>
                </div>
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
  // REMOVE AuthProvider wrapper - it's already at the root level
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>
}