'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ArrowLeft, Video, Calendar, HelpCircle, FileText, Shield } from 'lucide-react'
import { NewSessionForm } from '@/app/components/telemedicine/NewSessionForm'
import { QuickSessionForm } from '@/app/components/telemedicine/QuickSessionForm'
import Link from 'next/link'

export default function NewTelemedicineSessionPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'quick' | 'scheduled'>('quick')

  const handleQuickSessionSuccess = (sessionId: string): void => {
    router.push(`/telemedicine/sessions/${sessionId}/call`)
  }

  const handleScheduledSessionSuccess = (sessionId: string): void => {
    router.push(`/telemedicine/sessions/${sessionId}`)
  }

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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'quick' | 'scheduled')} className="space-y-6">
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
                onSuccess={handleQuickSessionSuccess}
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
                onSuccess={handleScheduledSessionSuccess}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Session Types</CardTitle>
          <CardDescription>
            Understand the different types of telemedicine sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-600" />
                Quick Session
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Immediate start (within minutes)</li>
                <li>Perfect for urgent medical concerns</li>
                <li>No prior scheduling required</li>
                <li>Patient notified instantly</li>
                <li>Maximum duration: 30 minutes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Scheduled Session
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Book in advance (hours to days)</li>
                <li>Ideal for follow-ups and consultations</li>
                <li>Allows for patient preparation</li>
                <li>Reminder notifications sent</li>
                <li>Flexible duration options</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Get assistance with telemedicine sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Technical Requirements</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Ensure you have a stable internet connection, working camera and microphone.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Documentation</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Always document the consultation notes and prescriptions electronically.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium">Security & Privacy</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                All sessions are HIPAA compliant and encrypted end-to-end.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions about telemedicine sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Can I prescribe medication during a telemedicine session?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can prescribe medication if medically appropriate. All prescriptions are documented in the patient&apos;s electronic health record.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">What if the patient doesn&apos;t show up?</h4>
              <p className="text-sm text-muted-foreground">
                For no-shows, you can mark the session as missed and reschedule. The system will notify the patient about the missed appointment.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Can I record the session?</h4>
              <p className="text-sm text-muted-foreground">
                Recording requires explicit consent from the patient. Use the recording feature only when necessary and ensure compliance with privacy regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}