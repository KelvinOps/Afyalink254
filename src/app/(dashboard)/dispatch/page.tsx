'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  Ambulance, 
  MapPin, 
  Clock, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Square,
  RefreshCw
} from 'lucide-react'

interface DispatchCall {
  id: string
  callerPhone: string
  callerName: string
  location: string
  emergencyType: string
  severity: 'CRITICAL' | 'URGENT' | 'NON_URGENT'
  status: 'RECEIVED' | 'DISPATCHED' | 'ON_SCENE' | 'TRANSPORTING' | 'COMPLETED'
  timestamp: string
  assignedAmbulance?: string
}

interface Ambulance {
  id: string
  registrationNumber: string
  status: 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'TRANSPORTING' | 'UNAVAILABLE'
  currentLocation?: { lat: number; lng: number }
  crew: string[]
  equipmentLevel: 'BLS' | 'ALS' | 'CRITICAL_CARE'
}

export default function DispatchPage() {
  const [activeCalls, setActiveCalls] = useState<DispatchCall[]>([])
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [selectedCall, setSelectedCall] = useState<DispatchCall | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDispatchData()
    const interval = setInterval(fetchDispatchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchDispatchData = async () => {
    try {
      const [callsRes, ambulancesRes] = await Promise.all([
        fetch('/api/dispatch'),
        fetch('/api/dispatch/ambulances')
      ])
      
      const callsData = await callsRes.json()
      const ambulancesData = await ambulancesRes.json()
      
      setActiveCalls(callsData.calls || [])
      setAmbulances(ambulancesData.ambulances || [])
    } catch (error) {
      console.error('Error fetching dispatch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignAmbulance = async (callId: string, ambulanceId: string) => {
    try {
      const response = await fetch(`/api/dispatch/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ambulanceId,
          status: 'DISPATCHED'
        })
      })
      
      if (response.ok) {
        fetchDispatchData()
      }
    } catch (error) {
      console.error('Error assigning ambulance:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'URGENT': return 'bg-orange-500'
      case 'NON_URGENT': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-500'
      case 'DISPATCHED': return 'bg-purple-500'
      case 'ON_SCENE': return 'bg-green-500'
      case 'TRANSPORTING': return 'bg-indigo-500'
      case 'COMPLETED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Dispatch Center</h1>
          <p className="text-muted-foreground">
            Manage emergency calls and ambulance deployments
          </p>
        </div>
        <Button onClick={fetchDispatchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Calls */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Active Emergency Calls
            </CardTitle>
            <CardDescription>
              {activeCalls.length} active calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeCalls.map((call) => (
                <Card 
                  key={call.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 ${
                    selectedCall?.id === call.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(call.severity)}>
                          {call.severity}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {call.callerName || 'Unknown Caller'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {call.callerPhone}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {call.location}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-sm font-medium">{call.emergencyType}</p>
                      {call.assignedAmbulance && (
                        <Badge variant="secondary">
                          Ambulance: {call.assignedAmbulance}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {activeCalls.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active emergency calls</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ambulance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ambulance className="h-5 w-5" />
              Ambulance Fleet
            </CardTitle>
            <CardDescription>
              {ambulances.filter(a => a.status === 'AVAILABLE').length} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ambulances.map((ambulance) => (
                <div key={ambulance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ambulance.registrationNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getStatusColor(ambulance.status)}>
                        {ambulance.status}
                      </Badge>
                      <Badge variant="secondary">
                        {ambulance.equipmentLevel}
                      </Badge>
                    </div>
                  </div>
                  {selectedCall && ambulance.status === 'AVAILABLE' && (
                    <Button
                      size="sm"
                      onClick={() => handleAssignAmbulance(selectedCall.id, ambulance.id)}
                    >
                      Assign
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              New Emergency Call
            </Button>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              View Live Map
            </Button>
            <Button variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Mass Casualty Protocol
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}