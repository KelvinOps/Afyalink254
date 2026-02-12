// src/app/(dashboard)/resources/equipment/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Stethoscope, 
  Search, 
  Download,
  RefreshCw,
  Wrench,
  AlertTriangle
} from 'lucide-react'

// Define a proper type for specifications
interface EquipmentSpecifications {
  manufacturer?: string
  model?: string
  serialNumber?: string
  year?: number
  location?: string
  powerRequirements?: string
  weight?: string
  dimensions?: string
  [key: string]: string | number | undefined
}

interface EquipmentResource {
  id: string
  name: string
  type: string
  category: string
  department: string
  totalCapacity: number
  availableCapacity: number
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_ORDER'
  isOperational: boolean
  isCritical: boolean
  lastMaintenance?: string
  nextMaintenance?: string
  specifications: EquipmentSpecifications
  lastUpdated: string
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentResource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchEquipmentData()
  }, [])

  const fetchEquipmentData = async () => {
    try {
      const response = await fetch('/api/resources?type=VENTILATOR,MONITOR,DEFIBRILLATOR,DIALYSIS_MACHINE,OXYGEN_CONCENTRATOR,IMAGING_EQUIPMENT')
      if (response.ok) {
        const data = await response.json()
        setEquipment(data.resources || [])
      }
    } catch (error) {
      console.error('Error fetching equipment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === '' || item.status === filterStatus)
  )

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'IN_USE': return 'bg-blue-100 text-blue-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'OUT_OF_ORDER': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const needsMaintenance = (item: EquipmentResource): boolean => {
    if (!item.nextMaintenance) return false
    const nextMaintenance = new Date(item.nextMaintenance)
    const today = new Date()
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilMaintenance <= 7
  }

  const statusOptions: Array<'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_ORDER'> = [
    'AVAILABLE', 
    'IN_USE', 
    'MAINTENANCE', 
    'OUT_OF_ORDER'
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="h-16 bg-gray-200 rounded animate-pulse"></div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>

        {/* Equipment Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Management</h1>
          <p className="text-muted-foreground">
            Track and manage medical equipment status and maintenance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEquipmentData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment by name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {equipment.filter(item => item.isOperational).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((equipment.filter(item => item.isOperational).length / (equipment.length || 1)) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {equipment.filter(needsMaintenance).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Within next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {equipment.filter(item => item.isCritical).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${
            item.isCritical ? 'border-red-300 bg-red-50/50' : 
            !item.isOperational ? 'border-gray-300 bg-gray-50/50' : ''
          }`}>
            {/* Status Indicators */}
            {item.isCritical && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="destructive">Critical</Badge>
              </div>
            )}
            {needsMaintenance(item) && (
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  <Wrench className="w-3 h-3 mr-1" />
                  Maintenance Due
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.category} • {item.department}
                  </CardDescription>
                </div>
                <Badge className={`${getStatusColor(item.status)} border-0`}>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Availability */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-medium">{item.availableCapacity}/{item.totalCapacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      item.availableCapacity === 0 ? 'bg-red-500' :
                      item.availableCapacity < item.totalCapacity * 0.3 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((item.availableCapacity / item.totalCapacity) * 100, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={(item.availableCapacity / item.totalCapacity) * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>

              {/* Equipment Details */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {item.specifications.manufacturer && (
                  <>
                    <span className="text-muted-foreground">Manufacturer</span>
                    <span className="font-medium text-right">{item.specifications.manufacturer}</span>
                  </>
                )}
                {item.specifications.model && (
                  <>
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium text-right">{item.specifications.model}</span>
                  </>
                )}
                {item.specifications.location && (
                  <>
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-right">{item.specifications.location}</span>
                  </>
                )}
              </div>

              {/* Maintenance Info */}
              {(item.lastMaintenance || item.nextMaintenance) && (
                <div className="border-t pt-3">
                  {item.lastMaintenance && (
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Last Maintenance</span>
                      <span className="font-medium">
                        {new Date(item.lastMaintenance).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {item.nextMaintenance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Maintenance</span>
                      <span className={`font-medium ${
                        needsMaintenance(item) ? 'text-orange-600' : ''
                      }`}>
                        {new Date(item.nextMaintenance).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Operational Status */}
              <div className="flex justify-between items-center text-sm border-t pt-3">
                <span className="text-muted-foreground">Operational Status</span>
                <Badge variant={item.isOperational ? "default" : "destructive"}>
                  {item.isOperational ? 'Operational' : 'Non-Operational'}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground italic">
                Last updated: {new Date(item.lastUpdated).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm || filterStatus 
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for'
                : 'No equipment resources have been configured yet. Add equipment to get started.'
              }
            </p>
            {(searchTerm || filterStatus) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('')
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}