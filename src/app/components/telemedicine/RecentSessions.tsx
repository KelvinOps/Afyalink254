'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  MoreVertical,
  Video,
  Clock,
  User,
  Calendar,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Session {
  id: string
  sessionNumber: string
  patientName: string
  patientEmail: string
  scheduledAt: string
  duration: number
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  chiefComplaint: string
}

export function RecentSessions() {
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      sessionNumber: 'TM-2024-001',
      patientName: 'John Doe',
      patientEmail: 'john@example.com',
      scheduledAt: '2024-01-15T10:30:00Z',
      duration: 30,
      status: 'COMPLETED',
      chiefComplaint: 'Fever and sore throat'
    },
    {
      id: '2',
      sessionNumber: 'TM-2024-002',
      patientName: 'Jane Smith',
      patientEmail: 'jane@example.com',
      scheduledAt: '2024-01-15T11:00:00Z',
      duration: 45,
      status: 'ONGOING',
      chiefComplaint: 'Back pain consultation'
    },
    {
      id: '3',
      sessionNumber: 'TM-2024-003',
      patientName: 'Michael Johnson',
      patientEmail: 'michael@example.com',
      scheduledAt: '2024-01-15T14:00:00Z',
      duration: 30,
      status: 'SCHEDULED',
      chiefComplaint: 'Follow-up appointment'
    },
    {
      id: '4',
      sessionNumber: 'TM-2024-004',
      patientName: 'Sarah Williams',
      patientEmail: 'sarah@example.com',
      scheduledAt: '2024-01-14T09:00:00Z',
      duration: 60,
      status: 'CANCELLED',
      chiefComplaint: 'Mental health consultation'
    },
    {
      id: '5',
      sessionNumber: 'TM-2024-005',
      patientName: 'Robert Brown',
      patientEmail: 'robert@example.com',
      scheduledAt: '2024-01-14T16:00:00Z',
      duration: 30,
      status: 'COMPLETED',
      chiefComplaint: 'Skin rash evaluation'
    }
  ])

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
      case 'ONGOING':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Ongoing</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
    }
  }

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'ONGOING':
        return <Video className="h-4 w-4 text-green-600" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Sessions</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {getStatusIcon(session.status)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{session.sessionNumber}</h4>
                    {getStatusBadge(session.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {session.patientName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(session.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(session.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.duration} mins
                    </div>
                  </div>
                  <p className="text-sm mt-2 line-clamp-1">
                    {session.chiefComplaint}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session.status === 'SCHEDULED' && (
                  <Button size="sm" asChild>
                    <Link href={`/telemedicine/sessions/${session.id}/call`}>
                      <Phone className="h-4 w-4 mr-1" />
                      Start Call
                    </Link>
                  </Button>
                )}
                {session.status === 'ONGOING' && (
                  <Button size="sm" variant="default" asChild>
                    <Link href={`/telemedicine/sessions/${session.id}/call`}>
                      <Video className="h-4 w-4 mr-1" />
                      Join Call
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href={`/telemedicine/sessions/${session.id}`} className="w-full">
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Session</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Cancel Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}