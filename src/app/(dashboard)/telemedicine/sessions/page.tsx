// src/app/(dashboard)/telemedicine/sessions/page.tsx

import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Search, Plus, Filter } from 'lucide-react'
import { TelemedicineSessionsTable } from '@/app/components/telemedicine/TelemedicineSessionsTable'
import { getCurrentUser } from '@/app/lib/get-current-user'
import { canAccessModule } from '@/app/lib/auth'
import { redirect } from 'next/navigation'

// CORRECT TYPE FOR NEXT.JS 15
interface TelemedicineSessionsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TelemedicineSessionsPage(props: TelemedicineSessionsPageProps) {
  // Await the searchParams promise
  const searchParams = await props.searchParams
  const user = await getCurrentUser()
  
  if (!user || !canAccessModule(user, 'telemedicine')) {
    redirect('/unauthorized')
  }

  // Extract parameters with proper type handling
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] || 'all' : searchParams.status || 'all'
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] || '' : searchParams.search || ''
  const pageParam = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page
  const page = pageParam ? parseInt(pageParam) : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemedicine Sessions</h1>
          <p className="text-muted-foreground">
            Manage and view all telemedicine consultations
          </p>
        </div>
        <Link href="/telemedicine/sessions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={status} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Sessions</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                className="pl-8"
                defaultValue={search}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Telemedicine Sessions</CardTitle>
              <CardDescription>
                Complete history of all telemedicine consultations across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TelemedicineSessionsTable 
                status="all"
                search={search}
                page={page}
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Sessions</CardTitle>
              <CardDescription>
                Upcoming telemedicine consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TelemedicineSessionsTable 
                status="SCHEDULED"
                search={search}
                page={page}
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Telemedicine consultations currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TelemedicineSessionsTable 
                status="IN_PROGRESS"
                search={search}
                page={page}
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Sessions</CardTitle>
              <CardDescription>
                Successfully completed telemedicine consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TelemedicineSessionsTable 
                status="COMPLETED"
                search={search}
                page={page}
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cancelled Sessions</CardTitle>
              <CardDescription>
                Telemedicine consultations that were cancelled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TelemedicineSessionsTable 
                status="CANCELLED"
                search={search}
                page={page}
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Optional: Add metadata generation
export async function generateMetadata() {
  return {
    title: 'Telemedicine Sessions',
    description: 'Manage telemedicine consultations',
  }
}