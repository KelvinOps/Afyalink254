'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { TrendingUp, Users, Video, Clock, Calendar } from 'lucide-react'

interface StatCard {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: string
  trendDirection?: 'up' | 'down'
}

export function TelemedicineStats() {
  const stats: StatCard[] = [
    {
      title: 'Total Sessions',
      value: '1,248',
      description: 'All time telemedicine sessions',
      icon: <Video className="h-5 w-5" />,
      trend: '+12.5%',
      trendDirection: 'up'
    },
    {
      title: 'Active Patients',
      value: '342',
      description: 'Patients using telemedicine',
      icon: <Users className="h-5 w-5" />,
      trend: '+8.2%',
      trendDirection: 'up'
    },
    {
      title: 'Avg. Session Time',
      value: '24 min',
      description: 'Average consultation duration',
      icon: <Clock className="h-5 w-5" />,
      trend: '-2.1%',
      trendDirection: 'down'
    },
    {
      title: 'Today\'s Sessions',
      value: '18',
      description: 'Scheduled for today',
      icon: <Calendar className="h-5 w-5" />,
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              {stat.trend && (
                <Badge 
                  variant={stat.trendDirection === 'up' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    stat.trendDirection === 'down' ? 'rotate-180' : ''
                  }`} />
                  {stat.trend}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}