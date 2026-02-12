'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  MapPin,
  Ambulance,
  AlertTriangle,
  Navigation,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  Clock
} from 'lucide-react'

interface AmbulanceMarker {
  id: string
  registrationNumber: string
  type: string
  status: string
  lat: number
  lng: number
  driverName: string
  fuelLevel: number
  lastUpdate: string
}

interface HospitalMarker {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  availableBeds: number
  availableIcuBeds: number
  status: string
}

interface EmergencyMarker {
  id: string
  emergencyType: string
  severity: string
  lat: number
  lng: number
  description: string
  callReceived: string
}

export default function LiveMapPage() {
  const [ambulances, setAmbulances] = useState<AmbulanceMarker[]>([])
  const [hospitals, setHospitals] = useState<HospitalMarker[]>([])
  const [emergencies, setEmergencies] = useState<EmergencyMarker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapView, setMapView] = useState<'ambulances' | 'hospitals' | 'all'>('all')
  const [center, setCenter] = useState<[number, number]>([-1.2921, 36.8219]) // Nairobi center
  const [zoom, setZoom] = useState(12)

  const fetchMapData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // In a real app, you would fetch this from your API
      // For now, using mock data
      
      // Mock ambulances
      const mockAmbulances: AmbulanceMarker[] = [
        {
          id: '1',
          registrationNumber: 'KAA 123A',
          type: 'ALS',
          status: 'AVAILABLE',
          lat: -1.2915,
          lng: 36.8155,
          driverName: 'John Kamau',
          fuelLevel: 85,
          lastUpdate: new Date().toISOString()
        },
        {
          id: '2',
          registrationNumber: 'KAA 456B',
          type: 'BLS',
          status: 'DISPATCHED',
          lat: -1.2955,
          lng: 36.8285,
          driverName: 'Peter Ochieng',
          fuelLevel: 65,
          lastUpdate: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '3',
          registrationNumber: 'KAA 789C',
          type: 'CRITICAL_CARE',
          status: 'TRANSPORTING',
          lat: -1.2885,
          lng: 36.8355,
          driverName: 'Sarah Mwangi',
          fuelLevel: 45,
          lastUpdate: new Date(Date.now() - 600000).toISOString()
        }
      ]

      // Mock hospitals
      const mockHospitals: HospitalMarker[] = [
        {
          id: '1',
          name: 'Kenyatta National Hospital',
          type: 'NATIONAL_REFERRAL',
          lat: -1.3014,
          lng: 36.8070,
          availableBeds: 12,
          availableIcuBeds: 3,
          status: 'OPERATIONAL'
        },
        {
          id: '2',
          name: 'Mama Lucy Kibaki Hospital',
          type: 'COUNTY',
          lat: -1.2802,
          lng: 36.8652,
          availableBeds: 8,
          availableIcuBeds: 1,
          status: 'OPERATIONAL'
        },
        {
          id: '3',
          name: 'Mbagathi Hospital',
          type: 'COUNTY',
          lat: -1.3045,
          lng: 36.7753,
          availableBeds: 15,
          availableIcuBeds: 2,
          status: 'LIMITED_CAPACITY'
        }
      ]

      // Mock emergencies
      const mockEmergencies: EmergencyMarker[] = [
        {
          id: '1',
          emergencyType: 'CARDIAC',
          severity: 'CRITICAL',
          lat: -1.2935,
          lng: 36.8235,
          description: 'Cardiac arrest reported',
          callReceived: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: '2',
          emergencyType: 'TRAUMA',
          severity: 'URGENT',
          lat: -1.2855,
          lng: 36.8195,
          description: 'Road traffic accident',
          callReceived: new Date(Date.now() - 1200000).toISOString()
        }
      ]

      setAmbulances(mockAmbulances)
      setHospitals(mockHospitals)
      setEmergencies(mockEmergencies)
      
    } catch (error) {
      console.error('Error fetching map data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMapData()
    const interval = setInterval(fetchMapData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [fetchMapData])

  const centerOnLocation = (lat: number, lng: number) => {
    setCenter([lat, lng])
    setZoom(15)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return `${Math.floor(diffMins / 60)}h ago`
  }

  const handleViewModeChange = (value: string) => {
    setMapView(value as 'ambulances' | 'hospitals' | 'all')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Dispatch Map</h1>
          <p className="text-muted-foreground">
            Real-time tracking of ambulances, emergencies, and hospitals
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchMapData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => centerOnLocation(center[0], center[1])}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Re-center
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Controls Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>View Mode</Label>
                <Select value={mapView} onValueChange={handleViewModeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Layers</SelectItem>
                    <SelectItem value="ambulances">Ambulances Only</SelectItem>
                    <SelectItem value="hospitals">Hospitals Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Available Ambulances ({ambulances.filter(a => a.status === 'AVAILABLE').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Dispatched Ambulances ({ambulances.filter(a => a.status === 'DISPATCHED').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Transporting Ambulances ({ambulances.filter(a => a.status === 'TRANSPORTING').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Critical Emergencies ({emergencies.filter(e => e.severity === 'CRITICAL').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Urgent Emergencies ({emergencies.filter(e => e.severity === 'URGENT').length})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Emergencies List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Emergencies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergencies.map((emergency) => (
                <div 
                  key={emergency.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => centerOnLocation(emergency.lat, emergency.lng)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{emergency.emergencyType}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {emergency.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(emergency.callReceived)}
                        </span>
                      </div>
                    </div>
                    <Badge className={
                      emergency.severity === 'CRITICAL' ? 'bg-red-500' :
                      emergency.severity === 'URGENT' ? 'bg-orange-500' : 'bg-yellow-500'
                    }>
                      {emergency.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Tracking Map</CardTitle>
                  <CardDescription>
                    Showing {ambulances.length} ambulances, {hospitals.length} hospitals, {emergencies.length} emergencies
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setZoom(zoom + 1)}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setZoom(zoom - 1)}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-full relative">
                  {/* Fallback for when Leaflet isn't loaded */}
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Interactive map loading...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Showing mock data for demonstration
                      </p>
                    </div>
                  </div>
                  
                  {/* In a real implementation, you would render the Leaflet map here */}
                  {/* Map implementation would go here with proper Leaflet integration */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ambulance Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ambulance className="h-5 w-5" />
            Ambulance Fleet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ambulances.map((ambulance) => (
              <Card key={ambulance.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ambulance className={`h-4 w-4 ${
                          ambulance.status === 'AVAILABLE' ? 'text-green-500' :
                          ambulance.status === 'DISPATCHED' ? 'text-blue-500' :
                          'text-purple-500'
                        }`} />
                        <span className="font-semibold">{ambulance.registrationNumber}</span>
                      </div>
                      <Badge className={
                        ambulance.status === 'AVAILABLE' ? 'bg-green-500' :
                        ambulance.status === 'DISPATCHED' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }>
                        {ambulance.status}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>Type: {ambulance.type}</p>
                      <p>Driver: {ambulance.driverName}</p>
                      <p>Fuel: {ambulance.fuelLevel}%</p>
                      <p className="text-xs text-muted-foreground">
                        Last update: {formatTimeAgo(ambulance.lastUpdate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => centerOnLocation(ambulance.lat, ambulance.lng)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Navigation className="h-3 w-3 mr-1" />
                        Dispatch
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}