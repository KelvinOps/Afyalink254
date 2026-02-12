'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  Calendar,
  Clock,
  User,
  Video,
  Phone,
  AlertCircle,
  ChevronRight,
  Search,
} from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { format, isToday, isTomorrow, isWithinInterval, subDays, addDays } from 'date-fns'
import Link from 'next/link'

interface Appointment {
  id: string
  sessionNumber: string
  patientName: string
  patientEmail: string
  startTime: Date
  duration: number
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  sessionType: 'consultation' | 'follow-up' | 'emergency'
  chiefComplaint: string
}

export function UpcomingAppointments() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTimeRange, setSelectedTimeRange] = useState('next7days')

  // Mock appointments data
  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      sessionNumber: 'TM-2024-001',
      patientName: 'John Doe',
      patientEmail: 'john@example.com',
      startTime: new Date(),
      duration: 30,
      status: 'scheduled',
      sessionType: 'consultation',
      chiefComplaint: 'Fever and sore throat'
    },
    {
      id: '2',
      sessionNumber: 'TM-2024-002',
      patientName: 'Jane Smith',
      patientEmail: 'jane@example.com',
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      duration: 45,
      status: 'confirmed',
      sessionType: 'follow-up',
      chiefComplaint: 'Diabetes management review'
    },
    {
      id: '3',
      sessionNumber: 'TM-2024-003',
      patientName: 'Michael Johnson',
      patientEmail: 'michael@example.com',
      startTime: new Date(Date.now() + 172800000), // Day after tomorrow
      duration: 60,
      status: 'confirmed',
      sessionType: 'emergency',
      chiefComplaint: 'Severe headache and dizziness'
    },
    {
      id: '4',
      sessionNumber: 'TM-2024-004',
      patientName: 'Sarah Williams',
      patientEmail: 'sarah@example.com',
      startTime: new Date(Date.now() + 259200000),
      duration: 30,
      status: 'scheduled',
      sessionType: 'consultation',
      chiefComplaint: 'Skin rash evaluation'
    },
    {
      id: '5',
      sessionNumber: 'TM-2024-005',
      patientName: 'Robert Brown',
      patientEmail: 'robert@example.com',
      startTime: new Date(Date.now() + 345600000),
      duration: 45,
      status: 'cancelled',
      sessionType: 'follow-up',
      chiefComplaint: 'Post-operative follow-up'
    }
  ])

  const getTimeRange = () => {
    const now = new Date()
    switch (selectedTimeRange) {
      case 'today':
        return { start: now, end: now }
      case 'tomorrow':
        const tomorrow = addDays(now, 1)
        return { start: tomorrow, end: tomorrow }
      case 'next7days':
        return { start: now, end: addDays(now, 7) }
      case 'next30days':
        return { start: now, end: addDays(now, 30) }
      default:
        return { start: subDays(now, 30), end: addDays(now, 30) }
    }
  }

  const filteredAppointments = appointments.filter(app => {
    const timeRange = getTimeRange()
    const isWithinTimeRange = isWithinInterval(app.startTime, {
      start: timeRange.start,
      end: timeRange.end
    })

    const matchesFilter = filter === 'all' || app.status === filter
    const matchesSearch = app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.sessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())

    return isWithinTimeRange && matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
    }
  }

  const getTimeIndicator = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEEE')
  }

  const getSessionTypeIcon = (type: Appointment['sessionType']) => {
    switch (type) {
      case 'consultation': return <Video className="h-4 w-4" />
      case 'follow-up': return <User className="h-4 w-4" />
      case 'emergency': return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="next7days">Next 7 days</SelectItem>
              <SelectItem value="next30days">Next 30 days</SelectItem>
              <SelectItem value="all">All upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="font-medium mb-2">No appointments found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or schedule a new appointment
            </p>
            <Button asChild>
              <Link href="/telemedicine/sessions/new">
                Schedule New Appointment
              </Link>
            </Button>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getSessionTypeIcon(appointment.sessionType)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{appointment.sessionNumber}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {appointment.patientName}
                        <span className="text-xs">•</span>
                        {appointment.patientEmail}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">{getTimeIndicator(appointment.startTime)}</span>
                        <span>{format(appointment.startTime, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{format(appointment.startTime, 'h:mm a')}</span>
                        <span className="text-muted-foreground">({appointment.duration} min)</span>
                      </div>
                    </div>
                    
                    <p className="text-sm">
                      <span className="font-medium">Chief Complaint:</span>{' '}
                      {appointment.chiefComplaint}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {appointment.status === 'scheduled' && (
                    <Button size="sm" asChild>
                      <Link href={`/telemedicine/sessions/${appointment.id}/call`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Start Call
                      </Link>
                    </Button>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/telemedicine/sessions/${appointment.id}`}>
                        <Video className="h-4 w-4 mr-2" />
                        Prepare
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    asChild
                  >
                    <Link href={`/telemedicine/sessions/${appointment.id}`}>
                      Details
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {appointments.filter(a => a.status === 'scheduled').length}
          </div>
          <div className="text-sm text-muted-foreground">Scheduled</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {appointments.filter(a => a.status === 'confirmed').length}
          </div>
          <div className="text-sm text-muted-foreground">Confirmed</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {appointments.filter(a => a.status === 'completed').length}
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {appointments.filter(a => a.status === 'cancelled').length}
          </div>
          <div className="text-sm text-muted-foreground">Cancelled</div>
        </div>
      </div>
    </div>
  )
}