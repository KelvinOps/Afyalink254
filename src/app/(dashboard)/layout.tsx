// /app/(dashboard)/layout.tsx 
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { NotificationProvider } from '@/app/contexts/NotificationContext'
import { WebSocketProvider } from '@/app/contexts/WebSocketContext'
import Sidebar from '@/app/components/layout/Sidebar' 
import { Menu, Bell, LogOut } from 'lucide-react'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitialized, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Redirect logic with loop prevention
  useEffect(() => {
    // Only redirect if initialized, not loading, no user, and not already on login
    if (isInitialized && !isLoading && !user && pathname !== '/login') {
      console.log('🚫 Unauthorized access, redirecting to login')
      const redirectUrl = pathname ? `?redirect=${encodeURIComponent(pathname)}` : ''
      router.replace(`/login${redirectUrl}`)
    }
  }, [user, isLoading, isInitialized, pathname, router])

  // Show loading during initial authentication check
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if no user (redirect will happen)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 mr-4 transition-colors"
                    aria-label="Toggle menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="hidden lg:block">
                    <h1 className="text-xl font-semibold text-slate-900">
                      Emergency Dashboard
                    </h1>
                    <p className="text-sm text-slate-600">Real-time emergency coordination</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  
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
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg flex items-center space-x-2"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content Area */}
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
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <WebSocketProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </WebSocketProvider>
    </NotificationProvider>
  )
}