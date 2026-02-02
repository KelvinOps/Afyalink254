// app/components/dashboard/StatsCard.tsx
'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '../ui/card'

interface StatsCardProps {
  value: string
  label: string
  color: string
  icon?: ReactNode
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
}

export default function StatsCard({
  value,
  label,
  color,
  icon,
  trend,
  trendType = 'neutral'
}: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-600 mt-2">{label}</div>
            {trend && (
              <div className={`text-xs font-semibold mt-1 ${trendColors[trendType]}`}>
                {trend}
              </div>
            )}
          </div>
          {icon && (
            <div className="opacity-60">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}