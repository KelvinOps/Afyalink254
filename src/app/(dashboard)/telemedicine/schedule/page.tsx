import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Calendar, Plus, Clock, Users } from 'lucide-react'
import { ScheduleCalendar } from '@/app/components/telemedicine/ScheduleCalendar'
import { UpcomingAppointments } from '@/app/components/telemedicine/UpcomingAppointments'
import { AvailabilitySettings } from '@/app/components/telemedicine/AvailabilitySettings'
import { getCurrentUser } from '@/app/lib/auth'
import { canAccessModule } from '@/app/lib/auth'
import { redirect } from 'next/navigation'

export default async function TelemedicineSchedulePage() {
  const user = await getCurrentUser()
  
  if (!user || !canAccessModule(user, 'telemedicine')) {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Manage your telemedicine appointments and availability
          </p>
        </div>
        <Link href="/telemedicine/sessions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Appointments
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Telemedicine Schedule</CardTitle>
              <CardDescription>
                View and manage all your scheduled telemedicine sessions in calendar format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleCalendar />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>
                    Your scheduled telemedicine sessions for the next 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UpcomingAppointments />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Today</span>
                    <Badge variant="outline">3 sessions</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Week</span>
                    <Badge variant="outline">12 sessions</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <Badge variant="outline">45 sessions</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/telemedicine/sessions/new" className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule New Session
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Availability
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    View Time Slots
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>
                Configure your working hours and availability for telemedicine sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilitySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}