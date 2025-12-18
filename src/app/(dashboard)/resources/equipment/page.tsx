'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Wrench,
  AlertTriangle
} from 'lucide-react'

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
  specifications: any
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'IN_USE': return 'bg-blue-100 text-blue-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'OUT_OF_ORDER': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const needsMaintenance = (item: EquipmentResource) => {
    if (!item.nextMaintenance) return false
    const nextMaintenance = new Date(item.nextMaintenance)
    const today = new Date()
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilMaintenance <= 7
  }

  const statusOptions = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_ORDER']

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
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
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
          </CardContent>
        </Card>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className={`relative ${
            item.isCritical ? 'border-red-300 bg-red-50' : 
            !item.isOperational ? 'border-gray-300 bg-gray-50' : ''
          }`}>
            {item.isCritical && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive">Critical</Badge>
              </div>
            )}
            {needsMaintenance(item) && (
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  <Wrench className="w-3 h-3 mr-1" />
                  Maintenance Due
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>
                    {item.category} • {item.department}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(item.status)}>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Availability */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Availability</span>
                  <span>{item.availableCapacity}/{item.totalCapacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.availableCapacity === 0 ? 'bg-red-500' :
                      item.availableCapacity < item.totalCapacity * 0.3 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(item.availableCapacity / item.totalCapacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Maintenance Info */}
              {item.lastMaintenance && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Last Maintenance</div>
                  <div>{new Date(item.lastMaintenance).toLocaleDateString()}</div>
                </div>
              )}

              {item.nextMaintenance && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Next Maintenance</div>
                  <div className={needsMaintenance(item) ? 'text-orange-600 font-semibold' : ''}>
                    {new Date(item.nextMaintenance).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Operational Status */}
              <div className="flex justify-between items-center text-sm">
                <span>Operational:</span>
                <Badge variant={item.isOperational ? "default" : "destructive"}>
                  {item.isOperational ? 'Yes' : 'No'}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                Updated: {new Date(item.lastUpdated).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus 
                ? 'Try adjusting your search criteria' 
                : 'No equipment resources configured yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}