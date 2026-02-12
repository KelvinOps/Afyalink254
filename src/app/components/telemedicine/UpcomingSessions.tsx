'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { 
  Calendar,
  Clock,
  Video,
  Bell,
  BellOff,
} from 'lucide-react'
import Link from 'next/link'

interface UpcomingSession {
  id: string
  sessionNumber: string
  patientName: string
  patientImage?: string
  scheduledAt: string
  duration: number
  chiefComplaint: string
  isReminderSet: boolean
}

export function UpcomingSessions() {
  const upcomingSessions: UpcomingSession[] = [
    {
      id: '1',
      sessionNumber: 'TM-2024-006',
      patientName: 'Emma Wilson',
      patientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      scheduledAt: '2024-01-15T15:30:00Z',
      duration: 45,
      chiefComplaint: 'Annual checkup and blood pressure review',
      isReminderSet: true
    },
    {
      id: '2',
      sessionNumber: 'TM-2024-007',
      patientName: 'David Miller',
      patientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      scheduledAt: '2024-01-15T16:15:00Z',
      duration: 30,
      chiefComplaint: 'Diabetes management follow-up',
      isReminderSet: false
    },
    {
      id: '3',
      sessionNumber: 'TM-2024-008',
      patientName: 'Lisa Taylor',
      patientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
      scheduledAt: '2024-01-16T09:00:00Z',
      duration: 60,
      chiefComplaint: 'Post-operative follow-up consultation',
      isReminderSet: true
    },
    {
      id: '4',
      sessionNumber: 'TM-2024-009',
      patientName: 'James Anderson',
      patientImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      scheduledAt: '2024-01-16T11:00:00Z',
      duration: 30,
      chiefComplaint: 'Migraine and headache evaluation',
      isReminderSet: true
    }
  ]

  const getTimeUntil = (dateString: string) => {
    const now = new Date()
    const sessionDate = new Date(dateString)
    const diffMs = sessionDate.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 0) return 'Started'
    if (diffHours === 0) return 'Starting soon'
    if (diffHours < 24) return `In ${diffHours} hours`
    if (diffHours < 48) return 'Tomorrow'
    return `In ${Math.floor(diffHours / 24)} days`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeColor = (dateString: string) => {
    const now = new Date()
    const sessionDate = new Date(dateString)
    const diffHours = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 0) return 'text-green-600 bg-green-50 border-green-200'
    if (diffHours < 1) return 'text-red-600 bg-red-50 border-red-200'
    if (diffHours < 4) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Sessions</CardTitle>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.patientImage} />
                  <AvatarFallback>
                    {session.patientName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{session.patientName}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTimeColor(session.scheduledAt)}`}
                    >
                      {getTimeUntil(session.scheduledAt)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatTime(session.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.duration} mins
                    </div>
                    {session.isReminderSet ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Bell className="h-3 w-3" />
                        Reminder on
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BellOff className="h-3 w-3" />
                        No reminder
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm mt-2 line-clamp-1">
                    {session.chiefComplaint}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/telemedicine/sessions/${session.id}`}>
                    <Video className="h-4 w-4 mr-1" />
                    Prepare
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                >
                  {session.isReminderSet ? 'Unset Reminder' : 'Set Reminder'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {upcomingSessions.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="font-medium mb-1">No upcoming sessions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Schedule new sessions to see them here
            </p>
            <Button asChild>
              <Link href="/telemedicine/sessions/new">
                Schedule Session
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}