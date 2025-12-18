import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Search, Video, Plus, Filter } from 'lucide-react'
import { TelemedicineSessionsTable } from '@/app/components/telemedicine/TelemedicineSessionsTable'
import { getCurrentUser } from '@/app/lib/get-current-user'
import { canAccessModule } from '@/app/lib/auth'
import { redirect } from 'next/navigation'

interface SearchParams {
  status?: string
  search?: string
  page?: string
}

interface TelemedicineSessionsPageProps {
  searchParams: SearchParams
}

export default async function TelemedicineSessionsPage({ searchParams }: TelemedicineSessionsPageProps) {
  const user = await getCurrentUser()
  
  if (!user || !canAccessModule(user, 'telemedicine')) {
    redirect('/unauthorized')
  }

  const status = searchParams.status || 'all'
  const search = searchParams.search || ''
  const page = parseInt(searchParams.page || '1')

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

        {/* ... other tabs remain the same ... */}
      </Tabs>
    </div>
  )
}