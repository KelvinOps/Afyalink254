'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { 
  Ambulance, 
  Plus, 
  RefreshCw,
  MapPin,
  Wrench,
  Fuel
} from 'lucide-react'

interface Ambulance {
  id: string
  registrationNumber: string
  type: 'BLS' | 'ALS' | 'CRITICAL_CARE'
  equipmentLevel: string
  status: 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'TRANSPORTING' | 'UNAVAILABLE' | 'MAINTENANCE'
  currentLocation?: { lat: number; lng: number }
  driverName: string
  driverPhone: string
  lastServiceDate: string
  nextServiceDate: string
  fuelLevel: number
  mileage: number
}

export default function AmbulancesPage() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAmbulances()
  }, [])

  const fetchAmbulances = async () => {
    try {
      const response = await fetch('/api/dispatch/ambulances')
      const data = await response.json()
      setAmbulances(data.ambulances || [])
    } catch (error) {
      console.error('Error fetching ambulances:', error)
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BLS': return 'bg-blue-100 text-blue-800'
      case 'ALS': return 'bg-green-100 text-green-800'
      case 'CRITICAL_CARE': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold tracking-tight">Ambulance Fleet Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor ambulance fleet status and maintenance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAmbulances} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Ambulance
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ambulances</CardTitle>
            <Ambulance className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambulances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ambulances.filter(a => a.status === 'AVAILABLE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ambulances.filter(a => 
                ['DISPATCHED', 'ON_SCENE', 'TRANSPORTING'].includes(a.status)
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ambulances.filter(a => a.status === 'MAINTENANCE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ambulances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ambulance Fleet</CardTitle>
          <CardDescription>
            Complete list of all ambulances in the fleet with current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Fuel Level</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Last Service</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ambulances.map((ambulance) => (
                <TableRow key={ambulance.id}>
                  <TableCell className="font-medium">
                    {ambulance.registrationNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(ambulance.type)}>
                      {ambulance.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ambulance.status)}>
                      {ambulance.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ambulance.driverName}</TableCell>
                  <TableCell>{ambulance.driverPhone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-3 w-3" />
                      {ambulance.fuelLevel}%
                    </div>
                  </TableCell>
                  <TableCell>{ambulance.mileage.toLocaleString()} km</TableCell>
                  <TableCell>
                    {new Date(ambulance.lastServiceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}