// /app/(dashboard)/dashboard/page.tsx
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { 
  Users, 
  Ambulance, 
  AlertTriangle, 
  Clock, 
  Activity,
  TrendingUp,
  Heart
} from 'lucide-react'

function StatsCard({ title, value, icon: Icon, color, trend, description }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-slate-100">
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
  const { user, hasPermission } = useAuth()

  if (!user) return null

  const stats = [
    { title: 'Active Patients', value: '42', icon: Users, color: 'text-blue-600', trend: '+5', description: 'Since yesterday' },
    { title: 'Avg Response Time', value: '4.2 min', icon: Clock, color: 'text-green-600', trend: '-0.8 min', description: 'Improvement' },
    { title: 'Emergencies Today', value: '8', icon: AlertTriangle, color: 'text-red-600', trend: '-2', description: 'From yesterday' },
    { title: 'System Uptime', value: '99.8%', icon: Activity, color: 'text-purple-600', trend: '+0.2%', description: 'This month' },
  ]

  // Permission-based quick access items
  const quickAccessItems = [
    { 
      title: 'Triage', 
      description: 'Patient assessment',
      icon: '🚨',
      href: '/dashboard/triage',
      color: 'blue',
      permission: 'triage.read'
    },
    { 
      title: 'Patients', 
      description: 'Medical records',
      icon: '👤',
      href: '/dashboard/patients',
      color: 'green',
      permission: 'patients.read'
    },
    { 
      title: 'Dispatch', 
      description: 'Ambulance coordination',
      icon: '🚑',
      href: '/dashboard/dispatch',
      color: 'red',
      permission: 'dispatch.read'
    },
    { 
      title: 'Reports', 
      description: 'Analytics & insights',
      icon: '📊',
      href: '/dashboard/analytics',
      color: 'purple',
      permission: 'analytics.read'
    },
  ].filter(item => hasPermission(item.permission))

  const recentAlerts = [
    { id: 1, title: 'High Triage Queue', message: 'Over 15 patients waiting', severity: 'high', time: '10 min ago' },
    { id: 2, title: 'Ambulance En Route', message: 'AMB-004 dispatched', severity: 'medium', time: '25 min ago' },
    { id: 3, title: 'System Backup Complete', message: 'Nightly backup successful', severity: 'low', time: '2 hours ago' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
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
              <Activity className="h-4 w-4 mr-2" />
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
      {quickAccessItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickAccessItems.map((item, index) => (
              <a 
                key={index}
                href={item.href} 
                className={`p-4 bg-${item.color}-50 hover:bg-${item.color}-100 rounded-lg border border-${item.color}-200 transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-${item.color}-100 flex items-center justify-center`}>
                    <span className={`text-${item.color}-600 text-xl`}>{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

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