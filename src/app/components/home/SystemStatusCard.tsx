// app/components/home/SystemStatusCard.tsx
'use client'

import { Heart, Clock, LucideIcon } from 'lucide-react'

interface SystemStat {
  label: string
  value: string
  icon: LucideIcon
  change: string
  changeType: 'positive' | 'negative'
  color: string
}

interface SystemStatusCardProps {
  currentTime: Date | null
  formatTime: (date: Date | null) => string
  systemStats: SystemStat[]
  isOperational: boolean
}

export default function SystemStatusCard({ 
  currentTime, 
  formatTime, 
  systemStats,
  isOperational 
}: SystemStatusCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 p-8">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center shadow-2xl mx-auto mb-4">
            <Heart className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">System Status</h3>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${isOperational ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`font-semibold ${isOperational ? 'text-green-600' : 'text-red-600'}`}>
              {isOperational ? 'All Systems Operational' : 'System Issues Detected'}
            </span>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-2 gap-4">
          {systemStats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <IconComponent className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className={`text-xs font-semibold ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'} mt-1`}>
                  {stat.change} from yesterday
                </div>
              </div>
            )
          })}
        </div>

        {/* Current Time */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <div className="text-lg font-mono font-bold text-gray-900">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-600">EAT - Kenya Time</div>
        </div>
      </div>
    </div>
  )
}