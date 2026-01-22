'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { Badge } from '@/app/components/ui/badge'
import {
  Clock,
  Calendar,
  Save,
  Plus,
  Trash2,
  Bell,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface WorkingHours {
  day: string
  enabled: boolean
  startTime: string
  endTime: string
  maxSessions: number
}

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  duration: number
  sessionType: 'consultation' | 'follow-up' | 'emergency'
}

interface BreakTime {
  id: string
  startTime: string
  endTime: string
  description: string
}

export function AvailabilitySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([
    { day: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00', maxSessions: 8 },
    { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00', maxSessions: 8 },
    { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00', maxSessions: 8 },
    { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00', maxSessions: 8 },
    { day: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00', maxSessions: 8 },
    { day: 'Saturday', enabled: false, startTime: '10:00', endTime: '14:00', maxSessions: 4 },
    { day: 'Sunday', enabled: false, startTime: '10:00', endTime: '14:00', maxSessions: 4 },
  ])

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', startTime: '09:00', endTime: '09:30', duration: 30, sessionType: 'consultation' },
    { id: '2', startTime: '09:30', endTime: '10:00', duration: 30, sessionType: 'consultation' },
    { id: '3', startTime: '10:00', endTime: '10:45', duration: 45, sessionType: 'follow-up' },
    { id: '4', startTime: '11:00', endTime: '11:30', duration: 30, sessionType: 'consultation' },
  ])

  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([
    { id: '1', startTime: '13:00', endTime: '14:00', description: 'Lunch break' },
    { id: '2', startTime: '15:30', endTime: '15:45', description: 'Short break' },
  ])

  const [bufferTime, setBufferTime] = useState('15')
  const [maxDailySessions, setMaxDailySessions] = useState('12')
  const [advanceBookingDays, setAdvanceBookingDays] = useState('30')
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [sendReminders, setSendReminders] = useState(true)

  const handleWorkingHoursChange = (index: number, field: keyof WorkingHours, value: any) => {
    const updatedHours = [...workingHours]
    if (field === 'enabled') {
      updatedHours[index][field] = value as boolean
    } else {
      updatedHours[index][field] = value as string & number
    }
    setWorkingHours(updatedHours)
  }

  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: '09:00',
      endTime: '09:30',
      duration: 30,
      sessionType: 'consultation'
    }
    setTimeSlots([...timeSlots, newSlot])
  }

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id))
  }

  const handleAddBreakTime = () => {
    const newBreak: BreakTime = {
      id: Date.now().toString(),
      startTime: '13:00',
      endTime: '14:00',
      description: 'New break'
    }
    setBreakTimes([...breakTimes, newBreak])
  }

  const handleRemoveBreakTime = (id: string) => {
    setBreakTimes(breakTimes.filter(breakTime => breakTime.id !== id))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setSaveMessage(null)

    try {
      // In a real app, you would save to your API
      const settings = {
        workingHours,
        timeSlots,
        breakTimes,
        bufferTime,
        maxDailySessions,
        advanceBookingDays,
        autoConfirm,
        sendReminders,
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaveMessage({
        type: 'success',
        message: 'Availability settings saved successfully!'
      })
      
    } catch (error) {
      setSaveMessage({
        type: 'error',
        message: 'Failed to save settings. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalAvailableHours = () => {
    return workingHours
      .filter(day => day.enabled)
      .reduce((total, day) => {
        const start = parseInt(day.startTime.split(':')[0])
        const end = parseInt(day.endTime.split(':')[0])
        return total + (end - start)
      }, 0)
  }

  return (
    <div className="space-y-6">
      {saveMessage && (
        <Alert variant={saveMessage.type === 'success' ? 'default' : 'destructive'}>
          <Bell className="h-4 w-4" />
          <AlertDescription>{saveMessage.message}</AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            General Availability Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
              <Select value={bufferTime} onValueChange={setBufferTime}>
                <SelectTrigger id="buffer-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Time between appointments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-daily-sessions">Max Daily Sessions</Label>
              <Input
                id="max-daily-sessions"
                type="number"
                value={maxDailySessions}
                onChange={(e) => setMaxDailySessions(e.target.value)}
                min="1"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance-booking">Advance Booking (days)</Label>
              <Input
                id="advance-booking"
                type="number"
                value={advanceBookingDays}
                onChange={(e) => setAdvanceBookingDays(e.target.value)}
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-confirm" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Auto-confirm Appointments
              </Label>
              <Switch
                id="auto-confirm"
                checked={autoConfirm}
                onCheckedChange={setAutoConfirm}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="send-reminders" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Send Reminder Notifications
              </Label>
              <Switch
                id="send-reminders"
                checked={sendReminders}
                onCheckedChange={setSendReminders}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workingHours.map((day, index) => (
              <div key={day.day} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={(checked) => 
                      handleWorkingHoursChange(index, 'enabled', checked)
                    }
                  />
                  <span className="font-medium min-w-[100px]">{day.day}</span>
                  
                  {day.enabled ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">From</Label>
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => 
                            handleWorkingHoursChange(index, 'startTime', e.target.value)
                          }
                          className="w-28"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">To</Label>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => 
                            handleWorkingHoursChange(index, 'endTime', e.target.value)
                          }
                          className="w-28"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Max Sessions</Label>
                        <Input
                          type="number"
                          value={day.maxSessions}
                          onChange={(e) => 
                            handleWorkingHoursChange(index, 'maxSessions', parseInt(e.target.value) || 0)
                          }
                          className="w-20"
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not available
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Total Available Hours per Week</p>
                <p className="text-2xl font-bold">{calculateTotalAvailableHours()} hours</p>
              </div>
              <Badge variant="outline">
                {workingHours.filter(day => day.enabled).length} days available
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Session Time Slots
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleAddTimeSlot}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Start</Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      className="w-28"
                      onChange={(e) => {
                        const updatedSlots = timeSlots.map(s =>
                          s.id === slot.id ? { ...s, startTime: e.target.value } : s
                        )
                        setTimeSlots(updatedSlots)
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">End</Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      className="w-28"
                      onChange={(e) => {
                        const updatedSlots = timeSlots.map(s =>
                          s.id === slot.id ? { ...s, endTime: e.target.value } : s
                        )
                        setTimeSlots(updatedSlots)
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Duration</Label>
                    <Select
                      value={slot.duration.toString()}
                      onValueChange={(value) => {
                        const updatedSlots = timeSlots.map(s =>
                          s.id === slot.id ? { ...s, duration: parseInt(value) } : s
                        )
                        setTimeSlots(updatedSlots)
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Type</Label>
                    <Select
                      value={slot.sessionType}
                      onValueChange={(value: TimeSlot['sessionType']) => {
                        const updatedSlots = timeSlots.map(s =>
                          s.id === slot.id ? { ...s, sessionType: value } : s
                        )
                        setTimeSlots(updatedSlots)
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTimeSlot(slot.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Break Times */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Break Times
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleAddBreakTime}>
            <Plus className="h-4 w-4 mr-2" />
            Add Break
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {breakTimes.map((breakTime) => (
              <div key={breakTime.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Start</Label>
                    <Input
                      type="time"
                      value={breakTime.startTime}
                      className="w-28"
                      onChange={(e) => {
                        const updatedBreaks = breakTimes.map(b =>
                          b.id === breakTime.id ? { ...b, startTime: e.target.value } : b
                        )
                        setBreakTimes(updatedBreaks)
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">End</Label>
                    <Input
                      type="time"
                      value={breakTime.endTime}
                      className="w-28"
                      onChange={(e) => {
                        const updatedBreaks = breakTimes.map(b =>
                          b.id === breakTime.id ? { ...b, endTime: e.target.value } : b
                        )
                        setBreakTimes(updatedBreaks)
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-sm">Description</Label>
                    <Input
                      value={breakTime.description}
                      className="flex-1"
                      onChange={(e) => {
                        const updatedBreaks = breakTimes.map(b =>
                          b.id === breakTime.id ? { ...b, description: e.target.value } : b
                        )
                        setBreakTimes(updatedBreaks)
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveBreakTime(breakTime.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Availability Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}