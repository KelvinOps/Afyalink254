'use client'

import { useState, useEffect, useCallback } from 'react'
import { Staff, StaffSchedule as StaffScheduleType } from '@/app/types/staff.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Calendar } from '@/app/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Plus, Clock } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { useRouter } from 'next/navigation'

interface StaffScheduleProps {
  hospitalId?: string
}

type ViewType = 'day' | 'week'

export function StaffSchedule({ hospitalId }: StaffScheduleProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<ViewType>('week')
  const [staff, setStaff] = useState<Staff[]>([])
  const [schedules, setSchedules] = useState<StaffScheduleType[]>([])
  const [loading, setLoading] = useState(true)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const fetchStaffAndSchedules = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch active staff
      const staffResponse = await fetch(
        `/api/staff?isActive=true&hospitalId=${hospitalId || ''}`
      )
      if (staffResponse.ok) {
        const staffData = await staffResponse.json()
        setStaff(staffData.staff || [])
      }

      // Fetch schedules for the week
      const schedulesResponse = await fetch(
        `/api/staff/schedule?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
      )
      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        setSchedules(schedulesData || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      setStaff([])
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, [hospitalId, weekStart, weekEnd])

  useEffect(() => {
    fetchStaffAndSchedules()
  }, [fetchStaffAndSchedules])

  const getStaffSchedulesForDay = (staffId: string, date: Date) => {
    return schedules.filter(schedule => 
      schedule.staffId === staffId &&
      new Date(schedule.startTime).toDateString() === date.toDateString()
    )
  }

  const getShiftBadgeVariant = (shiftType: string) => {
    switch (shiftType) {
      case 'MORNING': return 'default'
      case 'EVENING': return 'secondary'
      case 'NIGHT': return 'destructive'
      default: return 'outline'
    }
  }

  // Handle view change with proper typing
  const handleViewChange = (value: string) => {
    if (value === 'day' || value === 'week') {
      setView(value)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Schedule</h1>
          <p className="text-muted-foreground">
            Manage and view staff schedules and shifts
          </p>
        </div>
        <Button onClick={() => router.push('/staff/schedule/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      {/* Calendar and View Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Schedule View</CardTitle>
            <div className="flex space-x-2">
              <Select value={view} onValueChange={handleViewChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day View</SelectItem>
                  <SelectItem value="week">Week View</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
          <CardDescription>
            {view === 'week' 
              ? `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
              : format(selectedDate, 'PPPP')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-6">
            <div className="w-80">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>
            
            <div className="flex-1">
              {/* Week View Header */}
              {view === 'week' && (
                <div className="grid grid-cols-8 gap-1 mb-4">
                  <div className="p-2 font-medium">Staff</div>
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className="p-2 text-center">
                      <div className="text-sm font-medium">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-lg">
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Staff Rows */}
              <div className="space-y-2">
                {staff.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No staff members found.</p>
                  </div>
                ) : (
                  staff.map(staffMember => (
                    <div key={staffMember.id} className="grid grid-cols-8 gap-1 items-center">
                      <div className="p-2 border rounded-lg">
                        <div className="font-medium">
                          {staffMember.firstName} {staffMember.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {staffMember.role.replace(/_/g, ' ')}
                        </div>
                      </div>
                      
                      {view === 'week' && weekDays.map(day => {
                        const daySchedules = getStaffSchedulesForDay(staffMember.id, day)
                        return (
                          <div key={day.toISOString()} className="p-2 border rounded-lg min-h-16">
                            {daySchedules.map(schedule => (
                              <Badge
                                key={schedule.id}
                                variant={getShiftBadgeVariant(schedule.shiftType)}
                                className="w-full mb-1 text-xs"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {format(new Date(schedule.startTime), 'HH:mm')} - 
                                {format(new Date(schedule.endTime), 'HH:mm')}
                              </Badge>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}