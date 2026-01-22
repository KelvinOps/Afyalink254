'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Video, Plus } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'

interface Appointment {
  id: string
  patientName: string
  patientImage?: string
  startTime: Date
  endTime: Date
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  sessionType: 'consultation' | 'follow-up' | 'emergency'
  chiefComplaint: string
}

export function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  // Mock appointments data
  const appointments: Appointment[] = useMemo(() => [
    {
      id: '1',
      patientName: 'John Doe',
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 30, 0, 0)),
      status: 'scheduled',
      sessionType: 'consultation',
      chiefComplaint: 'Fever and cough'
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(14, 45, 0, 0)),
      status: 'confirmed',
      sessionType: 'follow-up',
      chiefComplaint: 'Diabetes management'
    },
    {
      id: '3',
      patientName: 'Michael Johnson',
      startTime: new Date(new Date().setDate(new Date().getDate() + 1)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 1)),
      status: 'scheduled',
      sessionType: 'consultation',
      chiefComplaint: 'Back pain'
    },
    {
      id: '4',
      patientName: 'Sarah Williams',
      startTime: new Date(new Date().setDate(new Date().getDate() + 2)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 2)),
      status: 'confirmed',
      sessionType: 'emergency',
      chiefComplaint: 'Severe headache'
    }
  ], [])

  // Get days for current month view
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get appointments for selected date
  const appointmentsForSelectedDate = appointments.filter(app =>
    isSameDay(app.startTime, selectedDate)
  )

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getSessionTypeIcon = (type: Appointment['sessionType']) => {
    switch (type) {
      case 'consultation': return <Video className="h-3 w-3" />
      case 'follow-up': return <User className="h-3 w-3" />
      case 'emergency': return <Clock className="h-3 w-3" />
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Badge variant="outline" className="ml-2">
            {view.charAt(0).toUpperCase() + view.slice(1)} View
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex border rounded-md">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none rounded-l-md"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none rounded-r-md"
              onClick={() => setView('day')}
            >
              Day
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, index) => {
            const dayAppointments = appointments.filter(app =>
              isSameDay(app.startTime, day)
            )
            
            return (
              <div
                key={index}
                className={`
                  min-h-[120px] border p-2 cursor-pointer transition-colors
                  ${!isSameMonth(day, currentDate) ? 'bg-muted/30 text-muted-foreground' : ''}
                  ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}
                  ${isSameDay(day, selectedDate) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isToday(day) ? 'text-blue-600' : ''}
                    ${isSameDay(day, selectedDate) ? 'text-primary' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayAppointments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayAppointments.length}
                    </Badge>
                  )}
                </div>

                {/* Appointments for the day */}
                <div className="space-y-1 max-h-[80px] overflow-y-auto">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-1 text-xs rounded border truncate"
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="h-2 w-2" />
                        <span>{format(appointment.startTime, 'HH:mm')}</span>
                      </div>
                      <div className="truncate font-medium">
                        {appointment.patientName}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <Badge variant="outline">
            {appointmentsForSelectedDate.length} session(s)
          </Badge>
        </div>

        {appointmentsForSelectedDate.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No appointments scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointmentsForSelectedDate.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getSessionTypeIcon(appointment.sessionType)}
                      </div>
                      <div>
                        <h4 className="font-medium">{appointment.patientName}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(appointment.startTime, 'HH:mm')} - {format(appointment.endTime, 'HH:mm')}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm">
                      {appointment.chiefComplaint}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button variant="outline" className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
          <Button className="flex-1">
            <Video className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </div>
      </div>
    </div>
  )
}