'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ArrowLeft, Video, Calendar, User, Stethoscope } from 'lucide-react'
import { NewSessionForm } from '@/app/components/telemedicine/NewSessionForm'
import { QuickSessionForm } from '@/app/components/telemedicine/QuickSessionForm'
import Link from 'next/link'

export default function NewTelemedicineSessionPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('quick')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/telemedicine/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Telemedicine Session</h1>
          <p className="text-muted-foreground">
            Start a new virtual consultation with a patient
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Quick Session
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Session
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Start Quick Session
              </CardTitle>
              <CardDescription>
                Begin an immediate telemedicine consultation. Perfect for urgent cases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickSessionForm 
                onSuccess={(sessionId) => {
                  router.push(`/telemedicine/sessions/${sessionId}/call`)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule New Session
              </CardTitle>
              <CardDescription>
                Schedule a telemedicine consultation for a future date and time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewSessionForm 
                onSuccess={(sessionId) => {
                  router.push(`/telemedicine/sessions/${sessionId}`)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ... rest of the component remains the same ... */}
    </div>
  )
}