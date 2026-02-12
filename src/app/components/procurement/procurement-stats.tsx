'use client'

import { Card, CardContent } from '@/app/components/ui/card'
import { Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export function ProcurementStats() {
  const stats = [
    {
      title: 'Total Requests',
      value: '156',
      description: 'This month',
      icon: Package,
      color: 'blue',
    },
    {
      title: 'Pending Approval',
      value: '23',
      description: 'Awaiting review',
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Approved Orders',
      value: '89',
      description: 'Ready for processing',
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Urgent Requests',
      value: '12',
      description: 'Critical priority',
      icon: AlertTriangle,
      color: 'red',
    },
  ]

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}