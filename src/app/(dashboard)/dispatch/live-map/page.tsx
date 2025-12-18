'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  MapPin, 
  Search, 
  Filter,
  RefreshCw,
  Ambulance,
  AlertTriangle
} from 'lucide-react'

interface AmbulanceLocation {
  id: string
  registrationNumber: string
  status: string
  currentLocation: { lat: number; lng: number }
  lastUpdated: string
}

interface EmergencyCall {
  id: string
  location: string
  coordinates?: { lat: number; lng: number }
  severity: string
  emergencyType: string
}

export default function LiveMapPage() {
  const [ambulances, setAmbulances] = useState<AmbulanceLocation[]>([])
  const [emergencies, setEmergencies] = useState<EmergencyCall[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('ALL')

  useEffect(() => {
    fetchMapData()
    const interval = setInterval(fetchMapData, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMapData = async () => {
    try {
      const [ambulancesRes, emergenciesRes] = await Promise.all([
        fetch('/api/dispatch/ambulances'),
        fetch('/api/dispatch')
      ])
      
      const ambulancesData = await ambulancesRes.json()
      const emergenciesData = await emergenciesRes.json()
      
      setAmbulances(ambulancesData.ambulances || [])
      setEmergencies(emergenciesData.calls || [])
    } catch (error) {
      console.error('Error fetching map data:', error)
    }
  }

  const filteredAmbulances = ambulances.filter(ambulance => 
    ambulance.status === selectedFilter || selectedFilter === 'ALL'
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Dispatch Map</h1>
          <p className="text-muted-foreground">
            Real-time tracking of ambulances and emergency incidents
          </p>
        </div>
        <Button onClick={fetchMapData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search location..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Filter</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'AVAILABLE', 'DISPATCHED', 'ON_SCENE', 'TRANSPORTING'].map((filter) => (
                    <Badge
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ambulance List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ambulance className="h-4 w-4" />
                Ambulances ({filteredAmbulances.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAmbulances.map((ambulance) => (
                  <div key={ambulance.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ambulance.registrationNumber}</p>
                        <Badge variant="outline" className="mt-1">
                          {ambulance.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        Track
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated: {new Date(ambulance.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Emergencies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4" />
                Active Emergencies ({emergencies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emergencies.map((emergency) => (
                  <div key={emergency.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{emergency.emergencyType}</p>
                        <p className="text-xs text-muted-foreground">{emergency.location}</p>
                      </div>
                      <Badge variant={
                        emergency.severity === 'CRITICAL' ? 'destructive' : 
                        emergency.severity === 'URGENT' ? 'default' : 'outline'
                      }>
                        {emergency.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Real-time Map View</CardTitle>
              <CardDescription>
                Showing {filteredAmbulances.length} ambulances and {emergencies.length} emergencies
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              {/* Map implementation would go here */}
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Map integration would be implemented here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Integration with Google Maps or OpenStreetMap
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}