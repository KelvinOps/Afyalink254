'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  ArrowLeft,
  Ambulance, 
  MapPin, 
  Phone,
  User,
  Wrench,
  Fuel,
  Calendar,
  AlertTriangle
} from 'lucide-react'

interface Ambulance {
  id: string
  registrationNumber: string
  type: 'BLS' | 'ALS' | 'CRITICAL_CARE'
  equipmentLevel: string
  status: string
  currentLocation?: { lat: number; lng: number }
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
}

interface MaintenanceRecord {
  id: string
  date: string
  type: string
  description: string
  cost: number
  performedBy: string
}

export default function AmbulanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchAmbulanceData(params.id as string)
    }
  }, [params.id])

  const fetchAmbulanceData = async (id: string) => {
    try {
      const response = await fetch(`/api/dispatch/ambulances/${id}`)
      const data = await response.json()
      setAmbulance(data.ambulance)
      setMaintenanceRecords(data.maintenanceRecords || [])
    } catch (error) {
      console.error('Error fetching ambulance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500'
      case 'DISPATCHED': return 'bg-blue-500'
      case 'ON_SCENE': return 'bg-purple-500'
      case 'TRANSPORTING': return 'bg-indigo-500'
      case 'UNAVAILABLE': return 'bg-gray-500'
      case 'MAINTENANCE': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!ambulance) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Ambulance Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The ambulance you're looking for doesn't exist.
        </p>
        <Button onClick={() => router.push('/dispatch/ambulances')} className="mt-4">
          Back to Ambulances
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dispatch/ambulances')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ambulance.registrationNumber}</h1>
          <p className="text-muted-foreground">
            Ambulance Details & Management
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button>Update Status</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="font-medium">{ambulance.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Equipment Level</label>
                    <p className="font-medium">{ambulance.equipmentLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div>
                      <Badge className={getStatusColor(ambulance.status)}>
                        {ambulance.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Operational</label>
                    <p className="font-medium">
                      {ambulance.isOperational ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crew Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Crew Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Crew Size</label>
                  <p className="font-medium">{ambulance.crewSize} people</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fuel className="h-5 w-5" />
                  Fuel & Mileage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fuel Level</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${ambulance.fuelLevel}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{ambulance.fuelLevel}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mileage</label>
                    <p className="font-medium">{ambulance.mileage.toLocaleString()} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="h-5 w-5" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ambulance.currentLocation ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Lat: {ambulance.currentLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-sm">
                      Lng: {ambulance.currentLocation.lng.toFixed(6)}
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      View on Map
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No location data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Status</CardTitle>
              <CardDescription>
                Medical equipment and vehicle systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>GPS Navigation</span>
                  <Badge variant={ambulance.hasGPS ? 'default' : 'secondary'}>
                    {ambulance.hasGPS ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Radio Communication</span>
                  <Badge variant={ambulance.hasRadio ? 'default' : 'secondary'}>
                    {ambulance.hasRadio ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Oxygen Supply</span>
                  <Badge variant={ambulance.hasOxygen ? 'default' : 'secondary'}>
                    {ambulance.hasOxygen ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Defibrillator</span>
                  <Badge variant={ambulance.hasDefibrillator ? 'default' : 'secondary'}>
                    {ambulance.hasDefibrillator ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Ventilator</span>
                  <Badge variant={ambulance.hasVentilator ? 'default' : 'secondary'}>
                    {ambulance.hasVentilator ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>
                Recent maintenance and service history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceRecords.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.type}</p>
                        <p className="text-sm text-muted-foreground">{record.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()} • {record.performedBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">KES {record.cost.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No maintenance records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}