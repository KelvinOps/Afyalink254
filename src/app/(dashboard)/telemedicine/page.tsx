import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Calendar, Video, Clock, Users, Activity } from 'lucide-react'
import { TelemedicineStats } from '@/app/components/telemedicine/TelemedicineStats'
import { RecentSessions } from '@/app/components/telemedicine/RecentSessions'
import { UpcomingSessions } from '@/app/components/telemedicine/UpcomingSessions'
import { getCurrentUser } from '@/app/lib/get-current-user'
import { canAccessModule } from '@/app/lib/auth'
import { redirect } from 'next/navigation'

export default async function TelemedicinePage() {
  const user = await getCurrentUser()
  
  if (!user || !canAccessModule(user, 'telemedicine')) {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemedicine</h1>
          <p className="text-muted-foreground">
            Virtual consultations and remote healthcare services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/telemedicine/schedule">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </Link>
          <Link href="/telemedicine/sessions/new">
            <Button>
              <Video className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </Link>
        </div>
      </div>

      <TelemedicineStats userId={user.id} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">All Sessions</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>
                  Your most recent telemedicine consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading recent sessions...</div>}>
                  <RecentSessions limit={5} userId={user.id} />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>
                  Scheduled consultations for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading upcoming sessions...</div>}>
                  <UpcomingSessions limit={5} userId={user.id} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* ... rest of the component remains the same ... */}
        </TabsContent>
      </Tabs>
    </div>
  )
}