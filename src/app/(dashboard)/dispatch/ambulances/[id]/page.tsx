// dispatch/ambulances/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose, // Add SheetClose
} from '@/app/components/ui/sheet'
import { 
  ArrowLeft,
  Ambulance, 
  MapPin, 
  User,
  Wrench,
  AlertTriangle,
  Edit,
  History,
  Map,
  Plus
} from 'lucide-react'
import { toast } from '@/app/hooks/use-toast'

interface Ambulance {
  id: string
  registrationNumber: string
  type: 'BLS' | 'ALS' | 'CRITICAL_CARE'
  equipmentLevel: string
  status: string
  currentLocation?: { lat: number; lng: number; accuracy?: number; timestamp?: string }
  driverName: string
  driverPhone: string
  paramedicName?: string
  crewSize: number
  hasGPS: boolean
  hasRadio: boolean
  hasOxygen: boolean
  hasDefibrillator: boolean
  hasVentilator: boolean
  lastServiceDate: string
  nextServiceDate: string
  mileage: number
  fuelLevel: number
  isOperational: boolean
  hospital?: { name: string }
  county?: { name: string }
}

interface MaintenanceRecord {
  id: string
  date: string
  type: string
  description: string
  cost: number
  performedBy: string
  nextServiceDate?: string
}

interface DispatchLog {
  id: string
  dispatchNumber: string
  emergencyType: string
  status: string
  callReceived: string
}

export default function AmbulanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null)
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editData, setEditData] = useState<Partial<Ambulance>>({})
  const [newMaintenance, setNewMaintenance] = useState({
    type: '',
    description: '',
    cost: '',
    performedBy: ''
  })
  const [sheetOpen, setSheetOpen] = useState(false) // State for sheet control

  useEffect(() => {
    if (params.id) {
      fetchAmbulanceData(params.id as string)
    }
  }, [params.id])

  const fetchAmbulanceData = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/dispatch/ambulances/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch ambulance data')
      }
      
      const data = await response.json()
      setAmbulance(data.ambulance)
      setDispatchLogs(data.dispatchLogs || [])
      setMaintenanceRecords(data.maintenanceRecords || [])
      setEditData(data.ambulance)
    } catch (error) {
      console.error('Error fetching ambulance data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load ambulance details',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAmbulanceStatus = async (newStatus: string) => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/dispatch/ambulances/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      setAmbulance(data.ambulance)
      
      toast({
        title: 'Success',
        description: `Ambulance status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ambulance status',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateAmbulanceDetails = async () => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/dispatch/ambulances/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      })

      if (!response.ok) {
        throw new Error('Failed to update ambulance')
      }

      const data = await response.json()
      setAmbulance(data.ambulance)
      
      toast({
        title: 'Success',
        description: 'Ambulance details updated successfully',
      })
    } catch (error) {
      console.error('Error updating ambulance:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ambulance details',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const addMaintenanceRecord = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/dispatch/ambulances/${params.id}/maintenance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newMaintenance,
          cost: parseFloat(newMaintenance.cost),
          date: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add maintenance record')
      }

      const data = await response.json()
      setMaintenanceRecords([data.record, ...maintenanceRecords])
      setNewMaintenance({
        type: '',
        description: '',
        cost: '',
        performedBy: ''
      })
      setSheetOpen(false) // Close the sheet after successful submission
      
      toast({
        title: 'Success',
        description: 'Maintenance record added successfully',
      })
    } catch (error) {
      console.error('Error adding maintenance:', error)
      toast({
        title: 'Error',
        description: 'Failed to add maintenance record',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500 hover:bg-green-600'
      case 'DISPATCHED': return 'bg-blue-500 hover:bg-blue-600'
      case 'ON_SCENE': return 'bg-purple-500 hover:bg-purple-600'
      case 'TRANSPORTING': return 'bg-indigo-500 hover:bg-indigo-600'
      case 'UNAVAILABLE': return 'bg-gray-500 hover:bg-gray-600'
      case 'MAINTENANCE': return 'bg-orange-500 hover:bg-orange-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusOptions = () => {
    const currentStatus = ambulance?.status
    const allStatuses = ['AVAILABLE', 'DISPATCHED', 'ON_SCENE', 'TRANSPORTING', 'UNAVAILABLE', 'MAINTENANCE']
    
    return allStatuses.filter(status => status !== currentStatus)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!ambulance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Ambulance Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The ambulance you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/dispatch/ambulances')} className="mt-4">
            Back to Ambulances
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dispatch/ambulances')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{ambulance.registrationNumber}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              {ambulance.type} Ambulance • {ambulance.equipmentLevel}
            </p>
            {ambulance.hospital && (
              <Badge variant="outline">{ambulance.hospital.name}</Badge>
            )}
            {ambulance.county && (
              <Badge variant="outline">{ambulance.county.name}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Ambulance Details</DialogTitle>
                <DialogDescription>
                  Update the ambulance information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input
                    id="driverName"
                    value={editData.driverName || ''}
                    onChange={(e) => setEditData({...editData, driverName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverPhone">Driver Phone</Label>
                  <Input
                    id="driverPhone"
                    value={editData.driverPhone || ''}
                    onChange={(e) => setEditData({...editData, driverPhone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paramedicName">Paramedic Name</Label>
                  <Input
                    id="paramedicName"
                    value={editData.paramedicName || ''}
                    onChange={(e) => setEditData({...editData, paramedicName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crewSize">Crew Size</Label>
                  <Input
                    id="crewSize"
                    type="number"
                    value={editData.crewSize || 2}
                    onChange={(e) => setEditData({...editData, crewSize: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage (km)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={editData.mileage || 0}
                    onChange={(e) => setEditData({...editData, mileage: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelLevel">Fuel Level (%)</Label>
                  <Input
                    id="fuelLevel"
                    type="number"
                    min="0"
                    max="100"
                    value={editData.fuelLevel || 100}
                    onChange={(e) => setEditData({...editData, fuelLevel: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditData(ambulance)}>
                  Cancel
                </Button>
                <Button onClick={updateAmbulanceDetails} disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Select onValueChange={updateAmbulanceStatus} disabled={isUpdating}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              {getStatusOptions().map((status) => (
                <SelectItem key={status} value={status}>
                  Set to {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            className={getStatusColor(ambulance.status)}
            onClick={() => router.push(`/dispatch/map?ambulance=${ambulance.id}`)}
          >
            <Map className="h-4 w-4 mr-2" />
            View on Map
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(ambulance.status).replace('hover:', '')}`} />
              <div>
                <h3 className="text-lg font-semibold">Current Status: {ambulance.status}</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: {ambulance.currentLocation?.timestamp 
                    ? new Date(ambulance.currentLocation.timestamp).toLocaleString() 
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={ambulance.isOperational ? 'default' : 'destructive'}>
                {ambulance.isOperational ? 'Operational' : 'Non-Operational'}
              </Badge>
              <Badge variant="outline">
                {ambulance.fuelLevel}% Fuel
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="font-medium text-lg">{ambulance.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Equipment Level</label>
                      <p className="font-medium">{ambulance.equipmentLevel}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Crew Size</label>
                      <p className="font-medium">{ambulance.crewSize} people</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Driver</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{ambulance.driverName}</p>
                          <p className="text-sm text-muted-foreground">{ambulance.driverPhone}</p>
                        </div>
                      </div>
                    </div>
                    {ambulance.paramedicName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Paramedic</label>
                        <p className="font-medium">{ambulance.paramedicName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Vehicle Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Fuel Level</span>
                    <span className="text-sm font-medium">{ambulance.fuelLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        ambulance.fuelLevel > 50 ? 'bg-green-500' : 
                        ambulance.fuelLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${ambulance.fuelLevel}%` }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mileage</label>
                  <p className="font-medium text-lg">{ambulance.mileage.toLocaleString()} km</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Service</label>
                    <p className="font-medium">
                      {new Date(ambulance.lastServiceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Next Service</label>
                    <p className="font-medium">
                      {new Date(ambulance.nextServiceDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ambulance.currentLocation ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Current Location</h4>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Latitude:</span>{' '}
                        {ambulance.currentLocation.lat.toFixed(6)}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Longitude:</span>{' '}
                        {ambulance.currentLocation.lng.toFixed(6)}
                      </p>
                      {ambulance.currentLocation.accuracy && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Accuracy:</span>{' '}
                          {ambulance.currentLocation.accuracy.toFixed(2)}m
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-red-500" />
                      <div className="ml-4">
                        <p className="font-medium">Live location enabled</p>
                        <p className="text-sm text-muted-foreground">
                          Real-time tracking is active
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No location data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable GPS tracking to see real-time location
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Dispatch Logs */}
          {dispatchLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Dispatch History
                </CardTitle>
                <CardDescription>
                  Last 10 emergency calls responded to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dispatchLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{log.dispatchNumber}</p>
                        <p className="text-sm text-muted-foreground">{log.emergencyType}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.callReceived).toLocaleString()}
                        </p>
                      </div>
                      <Badge>{log.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Medical Equipment Status</CardTitle>
              <CardDescription>
                Available medical equipment and vehicle systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={`p-4 border rounded-lg ${ambulance.hasGPS ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">GPS Navigation</span>
                    <Badge variant={ambulance.hasGPS ? 'default' : 'secondary'}>
                      {ambulance.hasGPS ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Real-time location tracking</p>
                </div>
                <div className={`p-4 border rounded-lg ${ambulance.hasRadio ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Radio Communication</span>
                    <Badge variant={ambulance.hasRadio ? 'default' : 'secondary'}>
                      {ambulance.hasRadio ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Emergency communication system</p>
                </div>
                <div className={`p-4 border rounded-lg ${ambulance.hasOxygen ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Oxygen Supply</span>
                    <Badge variant={ambulance.hasOxygen ? 'default' : 'secondary'}>
                      {ambulance.hasOxygen ? 'Available' : 'Check'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Medical oxygen cylinders</p>
                </div>
                <div className={`p-4 border rounded-lg ${ambulance.hasDefibrillator ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Defibrillator</span>
                    <Badge variant={ambulance.hasDefibrillator ? 'default' : 'secondary'}>
                      {ambulance.hasDefibrillator ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">AED with monitoring</p>
                </div>
                <div className={`p-4 border rounded-lg ${ambulance.hasVentilator ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Ventilator</span>
                    <Badge variant={ambulance.hasVentilator ? 'default' : 'secondary'}>
                      {ambulance.hasVentilator ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Mechanical ventilation system</p>
                </div>
                <div className="p-4 border rounded-lg border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Basic Life Support</span>
                    <Badge>Standard</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {ambulance.type === 'BLS' ? 'BLS Equipment Set' : 
                     ambulance.type === 'ALS' ? 'ALS Advanced Kit' : 
                     'Critical Care Package'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Maintenance Records</CardTitle>
                    <CardDescription>
                      Service and repair history
                    </CardDescription>
                  </div>
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Record
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Add Maintenance Record</SheetTitle>
                        <SheetDescription>
                          Record service or repair details
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Type of Service</Label>
                          <Select 
                            value={newMaintenance.type}
                            onValueChange={(value) => setNewMaintenance({...newMaintenance, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Regular Service">Regular Service</SelectItem>
                              <SelectItem value="Repair">Repair</SelectItem>
                              <SelectItem value="Medical Equipment">Medical Equipment</SelectItem>
                              <SelectItem value="Emergency Repair">Emergency Repair</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe the maintenance work..."
                            value={newMaintenance.description}
                            onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cost">Cost (KES)</Label>
                            <Input
                              id="cost"
                              type="number"
                              placeholder="0.00"
                              value={newMaintenance.cost}
                              onChange={(e) => setNewMaintenance({...newMaintenance, cost: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="performedBy">Performed By</Label>
                            <Input
                              id="performedBy"
                              placeholder="Service provider"
                              value={newMaintenance.performedBy}
                              onChange={(e) => setNewMaintenance({...newMaintenance, performedBy: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-4 pt-4">
                        <SheetClose asChild>
                          <Button variant="outline">
                            Cancel
                          </Button>
                        </SheetClose>
                        <Button onClick={addMaintenanceRecord}>
                          Save Record
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent>
                {maintenanceRecords.length > 0 ? (
                  <div className="space-y-3">
                    {maintenanceRecords.map((record) => (
                      <div key={record.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{record.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-2">{record.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Performed by: {record.performedBy}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KES {record.cost.toLocaleString()}</p>
                          {record.nextServiceDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Next: {new Date(record.nextServiceDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No maintenance records found</p>
                    <p className="text-sm mt-1">Add your first maintenance record</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{maintenanceRecords.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">
                    KES {maintenanceRecords.reduce((sum, record) => sum + record.cost, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Service</p>
                  <p className="font-medium">
                    {maintenanceRecords.length > 0 
                      ? new Date(maintenanceRecords[0].date).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Service Due</p>
                  <p className="font-medium">
                    {new Date(ambulance.nextServiceDate).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(
                            (new Date().getTime() - new Date(ambulance.lastServiceDate).getTime()) / 
                            (new Date(ambulance.nextServiceDate).getTime() - new Date(ambulance.lastServiceDate).getTime()) * 100, 
                            100
                          )}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Complete Service History</CardTitle>
              <CardDescription>
                Detailed timeline of all services and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Timeline view would go here */}
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed timeline view coming soon</p>
                  <p className="text-sm mt-1">
                    This will show a complete chronological history of all services
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}