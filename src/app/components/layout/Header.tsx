// src/components/layout/Header.tsx
'use client'

import { useAuth } from '../../contexts/AuthContext'
import { Bell, Menu, Search, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    const routes: Record<string, string> = {
      '/dashboard': 'Emergency Dashboard',
      '/triage': 'Triage Management',
      '/patients': 'Patient Management',
      '/transfers': 'Patient Transfers',
      '/dispatch': 'Dispatch Center',
      '/referrals': 'Referral Management',
      '/resources': 'Resource Management',
      '/procurement': 'Procurement',
      '/sha-claims': 'SHA Claims',
      '/telemedicine': 'Telemedicine',
      '/emergencies': 'Emergency Management',
      '/analytics': 'Analytics & Reports',
      '/staff': 'Staff Management',
      '/hospitals': 'Hospital Directory',
      '/settings': 'Settings'
    }

    // Handle dynamic routes
    if (pathname.startsWith('/triage/')) return 'Triage Management'
    if (pathname.startsWith('/patients/')) return 'Patient Management'
    if (pathname.startsWith('/transfers/')) return 'Patient Transfers'
    if (pathname.startsWith('/dispatch/')) return 'Dispatch Center'
    if (pathname.startsWith('/referrals/')) return 'Referral Management'
    if (pathname.startsWith('/resources/')) return 'Resource Management'
    if (pathname.startsWith('/sha-claims/')) return 'SHA Claims'
    if (pathname.startsWith('/telemedicine/')) return 'Telemedicine'
    if (pathname.startsWith('/emergencies/')) return 'Emergency Management'
    if (pathname.startsWith('/analytics/')) return 'Analytics & Reports'
    if (pathname.startsWith('/staff/')) return 'Staff Management'
    if (pathname.startsWith('/hospitals/')) return 'Hospital Directory'
    if (pathname.startsWith('/settings/')) return 'Settings'

    return routes[path] || 'National Emergency Healthcare System'
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="flex items-center justify-between p-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {getPageTitle(pathname)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Welcome back, {user?.name}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients, records..."
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all duration-200"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}