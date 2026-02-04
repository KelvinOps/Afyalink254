// /app/(dashboard)/page.tsx - COMPLETE FIXED VERSION
'use client'

import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { 
  Users, 
  Ambulance, 
  AlertTriangle, 
  Clock, 
  Bell,
  Activity
} from 'lucide-react'
import { hasPermission } from '@/app/lib/permissions'
import DashboardLoading from './loading'

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color, trend, description }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center text-sm">
          <span className={`font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
          <span className="text-slate-500 ml-2">{description}</span>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, isLoading, isInitialized } = useAuth()
  const [recentAlerts] = useState([
    { id: 1, title: 'High Triage Queue', message: 'Over 15 patients waiting in triage', severity: 'high', time: '10 min ago' },
    { id: 2, title: 'Ambulance En Route', message: 'AMB-004 dispatched to accident scene', severity: 'medium', time: '25 min ago' },
    { id: 3, title: 'System Backup Complete', message: 'Nightly backup completed successfully', severity: 'low', time: '2 hours ago' },
  ])

  // Show loading during initial authentication check
  if (isLoading || !isInitialized) {
    return <DashboardLoading />
  }

  // Don't render anything if no user - layout will handle redirect
  if (!user) {
    return null
  }

  // Check permissions
  const canViewPatients = hasPermission(user, 'patients.read')
  const canViewTriage = hasPermission(user, 'triage.read')
  const canViewDispatch = hasPermission(user, 'dispatch.read')
  const canViewReports = hasPermission(user, 'reports.read')

  const stats = [
    { title: 'Active Patients', value: '42', icon: Users, color: 'text-blue-600', trend: '+5', description: 'Since yesterday' },
    { title: 'Avg Response Time', value: '4.2 min', icon: Clock, color: 'text-green-600', trend: '-0.8 min', description: 'Improvement' },
    { title: 'Emergencies Today', value: '8', icon: AlertTriangle, color: 'text-red-600', trend: '-2', description: 'From yesterday' },
    { title: 'System Uptime', value: '99.8%', icon: Activity, color: 'text-purple-600', trend: '+0.2%', description: 'This month' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-blue-100">
              National Emergency Healthcare System • {user.role?.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Bell className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Real-time updates active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {canViewTriage && (
            <a href="/dashboard/triage" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🚨</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Triage</h3>
                  <p className="text-sm text-slate-600">Patient assessment</p>
                </div>
              </div>
            </a>
          )}
          
          {canViewPatients && (
            <a href="/dashboard/patients" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-xl">👤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Patients</h3>
                  <p className="text-sm text-slate-600">Medical records</p>
                </div>
              </div>
            </a>
          )}
          
          {canViewDispatch && (
            <a href="/dashboard/dispatch" className="p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-xl">🚑</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Dispatch</h3>
                  <p className="text-sm text-slate-600">Ambulance coordination</p>
                </div>
              </div>
            </a>
          )}
          
          {canViewReports && (
            <a href="/dashboard/reports" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Reports</h3>
                  <p className="text-sm text-slate-600">Analytics & insights</p>
                </div>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">System Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-700">WebSocket Connection</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-700">Database Sync</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Synced</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-700">API Response Time</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">124ms</span>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">Last updated: Just now</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{alert.title}</h3>
                  <p className="text-sm text-slate-600">{alert.message}</p>
                </div>
              </div>
              <span className="text-sm text-slate-500">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}