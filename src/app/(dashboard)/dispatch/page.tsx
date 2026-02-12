//(dashboard)/dispatch/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import {
  Phone,
  MapPin,
  AlertTriangle,
  Clock,
  Ambulance,
  Plus,
  RefreshCw,
  Eye,
  MessageSquare,
  Mic,
  Headphones,
  Radio,
  Bell,
  Activity
} from 'lucide-react'
import { useToast } from '@/app/hooks/use-toast'

// Type definitions
type SeverityType = 'CRITICAL' | 'URGENT' | 'NON_URGENT'
type StatusType = 'RECEIVED' | 'ASSESSING' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'TRANSPORTING' | 'COMPLETED'

interface DispatchCall {
  id: string
  dispatchNumber: string
  callerPhone: string
  callerName?: string
  callerLocation: string
  coordinates?: { lat: number; lng: number }
  emergencyType: string
  severity: SeverityType
  description: string
  patientCount: number
  status: StatusType
  callReceived: string
  dispatchedAt?: string
  onSceneAt?: string
  transportingAt?: string
  completedAt?: string
  ambulance?: {
    registrationNumber: string
    type: string
  }
  dispatcher?: {
    name: string
  }
}

interface ActiveCall {
  id: string
  dispatchNumber: string
  emergencyType: string
  severity: string
  callerPhone: string
  location: string
  status: string
  callReceived: string
}

interface NewCallData {
  callerPhone: string
  callerName: string
  callerLocation: string
  emergencyType: string
  severity: SeverityType
  description: string
  patientCount: number
}

export default function DispatchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [recentDispatches, setRecentDispatches] = useState<DispatchCall[]>([])
  const [newCallDialogOpen, setNewCallDialogOpen] = useState(false)
  const [newCallData, setNewCallData] = useState<NewCallData>({
    callerPhone: '',
    callerName: '',
    callerLocation: '',
    emergencyType: '',
    severity: 'URGENT',
    description: '',
    patientCount: 1
  })

  const fetchDispatchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/dispatch', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch dispatch data')
      }
      
      const data = await response.json()
      setActiveCalls(data.activeCalls || [])
      setRecentDispatches(data.recentDispatches || [])
      
    } catch (error) {
      console.error('Error fetching dispatch data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dispatch data',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    fetchDispatchData()
    // Simulate real-time updates
    const interval = setInterval(fetchDispatchData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [fetchDispatchData])

  const handleNewCall = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCallData)
      })

      if (!response.ok) {
        throw new Error('Failed to create dispatch')
      }

      const data = await response.json()
      
      toast({
        title: 'Dispatch Created',
        description: `Dispatch #${data.dispatchNumber} created successfully`,
      })

      setNewCallDialogOpen(false)
      setNewCallData({
        callerPhone: '',
        callerName: '',
        callerLocation: '',
        emergencyType: '',
        severity: 'URGENT',
        description: '',
        patientCount: 1
      })
      
      fetchDispatchData()
      
      // Navigate to the new dispatch
      router.push(`/dispatch/${data.dispatch.id}`)
    } catch (error) {
      console.error('Error creating dispatch:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create dispatch',
        variant: 'destructive'
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 hover:bg-red-600'
      case 'URGENT': return 'bg-orange-500 hover:bg-orange-600'
      case 'NON_URGENT': return 'bg-blue-500 hover:bg-blue-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'ASSESSING': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'DISPATCHED': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'EN_ROUTE': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'ON_SCENE': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'TRANSPORTING': return 'bg-pink-100 text-pink-800 border-pink-300'
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  // Type-safe handler for severity change
  const handleSeverityChange = (value: string) => {
    // Type assertion to ensure the value is one of the allowed severities
    if (value === 'CRITICAL' || value === 'URGENT' || value === 'NON_URGENT') {
      setNewCallData(prev => ({
        ...prev,
        severity: value
      }))
    } else {
      // Fallback to default if an invalid value somehow gets through
      setNewCallData(prev => ({
        ...prev,
        severity: 'URGENT'
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Dispatch Center</h1>
          <p className="text-muted-foreground">
            999/911 Emergency Response System
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchDispatchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={newCallDialogOpen} onOpenChange={setNewCallDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Emergency Call
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Emergency Call</DialogTitle>
                <DialogDescription>
                  Enter emergency call details to dispatch response
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="callerPhone">Caller Phone *</Label>
                    <Input
                      id="callerPhone"
                      placeholder="07xx xxx xxx"
                      value={newCallData.callerPhone}
                      onChange={(e) => setNewCallData({...newCallData, callerPhone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="callerName">Caller Name</Label>
                    <Input
                      id="callerName"
                      placeholder="Optional"
                      value={newCallData.callerName}
                      onChange={(e) => setNewCallData({...newCallData, callerName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callerLocation">Location *</Label>
                  <Input
                    id="callerLocation"
                    placeholder="Describe the location or landmark"
                    value={newCallData.callerLocation}
                    onChange={(e) => setNewCallData({...newCallData, callerLocation: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyType">Emergency Type *</Label>
                    <Select 
                      value={newCallData.emergencyType}
                      onValueChange={(value) => setNewCallData({...newCallData, emergencyType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEDICAL">Medical Emergency</SelectItem>
                        <SelectItem value="TRAUMA">Trauma/Injury</SelectItem>
                        <SelectItem value="CARDIAC">Cardiac Arrest</SelectItem>
                        <SelectItem value="STROKE">Stroke</SelectItem>
                        <SelectItem value="RESPIRATORY">Respiratory Distress</SelectItem>
                        <SelectItem value="OBSTETRIC">Obstetric Emergency</SelectItem>
                        <SelectItem value="PEDIATRIC">Pediatric Emergency</SelectItem>
                        <SelectItem value="PSYCHIATRIC">Psychiatric Emergency</SelectItem>
                        <SelectItem value="OVERDOSE">Overdose/Poisoning</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity *</Label>
                    <Select 
                      value={newCallData.severity}
                      onValueChange={handleSeverityChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRITICAL">Critical (Life-threatening)</SelectItem>
                        <SelectItem value="URGENT">Urgent (Serious)</SelectItem>
                        <SelectItem value="NON_URGENT">Non-Urgent (Routine)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientCount">Number of Patients</Label>
                  <Input
                    id="patientCount"
                    type="number"
                    min="1"
                    value={newCallData.patientCount}
                    onChange={(e) => setNewCallData({...newCallData, patientCount: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Emergency Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the emergency situation, symptoms, and any immediate threats..."
                    rows={4}
                    value={newCallData.description}
                    onChange={(e) => setNewCallData({...newCallData, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setNewCallDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleNewCall}>
                  Create Dispatch
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Emergency Alert Bar */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Emergency Dispatch Active</h3>
                <p className="text-sm text-red-700">
                  {activeCalls.filter(call => call.severity === 'CRITICAL').length} critical emergencies in progress
                </p>
              </div>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => router.push('/dispatch/live-map')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View Live Map
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCalls.length}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-muted-foreground">
                {activeCalls.filter(call => call.severity === 'CRITICAL').length} critical
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5m</div>
            <p className="text-xs text-muted-foreground">Target: ≤ 10 minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ambulances Available</CardTitle>
            <Ambulance className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 BLS, 6 ALS, 3 Critical Care</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="active">Active Calls</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch Console</TabsTrigger>
          <TabsTrigger value="recent">Recent Dispatches</TabsTrigger>
        </TabsList>

        {/* Active Calls Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Emergency Calls</CardTitle>
              <CardDescription>
                {activeCalls.length} emergency calls currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeCalls.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No active calls</h3>
                  <p className="text-muted-foreground mt-1">
                    All emergency calls have been resolved
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCalls.map((call) => (
                    <Card key={call.id} className={`border-l-4 ${
                      call.severity === 'CRITICAL' ? 'border-l-red-500' :
                      call.severity === 'URGENT' ? 'border-l-orange-500' : 'border-l-blue-500'
                    }`}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{call.dispatchNumber}</h3>
                              <Badge className={getSeverityColor(call.severity)}>
                                {call.severity}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(call.status)}>
                                {call.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Caller</p>
                                <p className="font-medium flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {call.callerPhone}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Location</p>
                                <p className="font-medium flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {call.location}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Emergency Type</p>
                                <p className="font-medium">{call.emergencyType}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Time</p>
                                <p className="font-medium">
                                  {formatTimeAgo(call.callReceived)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/dispatch/${call.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button 
                              size="sm"
                              className={getSeverityColor(call.severity)}
                            >
                              <Radio className="h-4 w-4 mr-2" />
                              Dispatch
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dispatch Console Tab */}
        <TabsContent value="dispatch">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Call Taking Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Call Taking Console
                </CardTitle>
                <CardDescription>
                  Take new emergency calls and provide pre-arrival instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Caller Information</Label>
                    <Input placeholder="Caller phone number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input placeholder="Location description or what3words" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Emergency Description</Label>
                  <Textarea placeholder="Describe the emergency..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Pre-Arrival Instructions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      CPR Instructions
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      Bleeding Control
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      Choking Response
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      Seizure Care
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create Dispatch
                  </Button>
                  <Button variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Transfer Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ambulance Dispatch Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="h-5 w-5" />
                  Available Ambulances
                </CardTitle>
                <CardDescription>
                  Dispatch nearest available units
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">KAA 123{i}</p>
                        <p className="text-xs text-muted-foreground">ALS • 2.3km away</p>
                      </div>
                      <Button size="sm">Dispatch</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Dispatches Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Dispatch Logs</CardTitle>
              <CardDescription>
                Last 50 emergency dispatches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentDispatches.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No recent dispatches</h3>
                  <p className="text-muted-foreground mt-1">
                    No emergency dispatches in the last 24 hours
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dispatch #</TableHead>
                        <TableHead>Emergency Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Caller</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Ambulance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDispatches.map((dispatch) => (
                        <TableRow key={dispatch.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {dispatch.dispatchNumber}
                          </TableCell>
                          <TableCell>{dispatch.emergencyType}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(dispatch.severity)}>
                              {dispatch.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <a href={`tel:${dispatch.callerPhone}`} className="text-blue-600 hover:underline">
                              {dispatch.callerPhone}
                            </a>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {dispatch.callerLocation}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(dispatch.status)}>
                              {dispatch.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatTimeAgo(dispatch.callReceived)}
                          </TableCell>
                          <TableCell>
                            {dispatch.ambulance ? (
                              <span className="text-sm">
                                {dispatch.ambulance.registrationNumber}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/dispatch/${dispatch.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}