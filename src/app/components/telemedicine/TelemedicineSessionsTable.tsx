// src/app/components/telemedicine/TelemedicineSessionsTable.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Video,
  Phone,
  Calendar,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Session {
  id: string
  sessionNumber: string
  patientName: string
  patientEmail: string
  scheduledAt: Date
  duration: number
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  sessionType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY'
  chiefComplaint: string
}

export function TelemedicineSessionsTable() {
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      sessionNumber: 'TM-2024-001',
      patientName: 'John Doe',
      patientEmail: 'john@example.com',
      scheduledAt: new Date('2024-01-15T10:30:00'),
      duration: 30,
      status: 'COMPLETED',
      sessionType: 'CONSULTATION',
      chiefComplaint: 'Fever and sore throat'
    },
    {
      id: '2',
      sessionNumber: 'TM-2024-002',
      patientName: 'Jane Smith',
      patientEmail: 'jane@example.com',
      scheduledAt: new Date('2024-01-15T11:00:00'),
      duration: 45,
      status: 'ONGOING',
      sessionType: 'FOLLOW_UP',
      chiefComplaint: 'Back pain consultation'
    },
    {
      id: '3',
      sessionNumber: 'TM-2024-003',
      patientName: 'Michael Johnson',
      patientEmail: 'michael@example.com',
      scheduledAt: new Date('2024-01-15T14:00:00'),
      duration: 30,
      status: 'SCHEDULED',
      sessionType: 'FOLLOW_UP',
      chiefComplaint: 'Follow-up appointment'
    },
    {
      id: '4',
      sessionNumber: 'TM-2024-004',
      patientName: 'Sarah Williams',
      patientEmail: 'sarah@example.com',
      scheduledAt: new Date('2024-01-14T09:00:00'),
      duration: 60,
      status: 'CANCELLED',
      sessionType: 'EMERGENCY',
      chiefComplaint: 'Mental health consultation'
    },
  ])

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
      case 'ONGOING':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Ongoing</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy')
  }

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a')
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session ID</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">
                {session.sessionNumber}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{session.patientName}</span>
                  <span className="text-sm text-muted-foreground">
                    {session.patientEmail}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(session.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(session.scheduledAt)}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{session.duration} min</span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(session.status)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {session.sessionType.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {session.status === 'SCHEDULED' && (
                    <Button size="sm" asChild>
                      <Link href={`/telemedicine/sessions/${session.id}/call`}>
                        <Video className="h-4 w-4 mr-1" />
                        Start
                      </Link>
                    </Button>
                  )}
                  {session.status === 'ONGOING' && (
                    <Button size="sm" variant="default" asChild>
                      <Link href={`/telemedicine/sessions/${session.id}/call`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Join
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
                      <DropdownMenuItem asChild>
                        <Link href={`/telemedicine/sessions/${session.id}`} className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Session
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        View Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}