// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { usePermissions } from '@/app/hooks/usePermissions'
import { useWebSocket } from '@/app/contexts/WebSocketContext'
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Ambulance,
  Shield,
  Heart,
  Calendar,
  FileText,
  Bell,
  BarChart
} from 'lucide-react'
import { useState } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { hasPermission, canAccessModule } = usePermissions()
  const { state } = useWebSocket()
  const [isLoading, setIsLoading] = useState(false)

  // Mock dashboard data
  const stats = [
    { label: 'Active Patients', value: '147', icon: Users, color: 'bg-blue-500', change: '+12' },
    { label: 'Emergencies Today', value: '8', icon: AlertTriangle, color: 'bg-red-500', change: '-2' },
    { label: 'Avg Response Time', value: '4.2min', icon: Clock, color: 'bg-green-500', change: '-0.8min' },
    { label: 'System Uptime', value: '99.8%', icon: Activity, color: 'bg-purple-500', change: '+0.2%' },
  ]

  const quickActions = [
    { label: 'New Triage', icon: Heart, path: '/dashboard/triage', permission: 'triage.write' },
    { label: 'Ambulance Dispatch', icon: Ambulance, path: '/dashboard/dispatch', permission: 'dispatch.write' },
    { label: 'Patient Records', icon: FileText, path: '/dashboard/patients', permission: 'patients.read' },
    { label: 'SHA Claims', icon: Shield, path: '/dashboard/sha-claims', permission: 'claims.write' },
    { label: 'Schedule', icon: Calendar, path: '/dashboard/schedule', permission: 'staff.read' },
    { label: 'Analytics', icon: BarChart, path: '/dashboard/analytics', permission: 'analytics.read' },
  ]

  const recentAlerts = [
    { id: 1, type: 'emergency', message: 'Multiple casualty incident reported in Nairobi CBD', time: '5 min ago', priority: 'high' },
    { id: 2, type: 'warning', message: 'Ambulance #KED-004 delayed by traffic', time: '15 min ago', priority: 'medium' },
    { id: 3, type: 'info', message: 'Kenyatta Hospital bed capacity at 85%', time: '30 min ago', priority: 'low' },
  ]

  // Filter quick actions based on permissions
  const filteredActions = quickActions.filter(action => 
    hasPermission(action.permission) || canAccessModule(action.path.split('/')[2])
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || user?.name.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {new Date().toLocaleDateString('en-KE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              state.connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              state.connectionStatus === 'connecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {state.connectionStatus === 'connected' ? 'Live' : 
               state.connectionStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </span>
          </div>
          
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Role and Facility Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {user?.role?.replace(/_/g, ' ')} • {user?.facilityName || 'No facility assigned'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Permissions: {user?.permissions?.length || 0} granted
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">{user?.id || 'N/A'}</p>
            </div>
            {user?.facilityId && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Facility ID</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white">{user.facilityId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                <p className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} mt-1`}>
                  {stat.change} from yesterday
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredActions.map((action, index) => (
                <a
                  key={index}
                  href={action.path}
                  className="group flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200"
                >
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 mb-3">
                    <action.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-center">{action.label}</span>
                </a>
              ))}
              
              {filteredActions.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No actions available with your current permissions</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Contact your administrator for access</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Alerts</h2>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.priority === 'high' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' :
                    alert.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                    'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  }`}
                >
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{alert.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{alert.time}</p>
                </div>
              ))}
            </div>
            
            <a 
              href="/dashboard/alerts" 
              className="block mt-6 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View all alerts →
            </a>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Status</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium text-gray-900 dark:text-white">Core Services</span>
            </div>
            <span className="text-green-600 dark:text-green-400 font-medium">Operational</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium text-gray-900 dark:text-white">Database</span>
            </div>
            <span className="text-green-600 dark:text-green-400 font-medium">Operational</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                state.connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                state.connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <span className="font-medium text-gray-900 dark:text-white">WebSocket Connection</span>
            </div>
            <span className={
              state.connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' :
              state.connectionStatus === 'connecting' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }>
              {state.connectionStatus === 'connected' ? 'Connected' : 
               state.connectionStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium text-gray-900 dark:text-white">SHA/SHIF Integration</span>
            </div>
            <span className="text-green-600 dark:text-green-400 font-medium">Operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}