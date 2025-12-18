'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Bed, 
  Plus, 
  Search, 
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface BedResource {
  id: string
  name: string
  type: string
  department: string
  totalCapacity: number
  availableCapacity: number
  reservedCapacity: number
  inUseCapacity: number
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED'
  isCritical: boolean
  lastUpdated: string
}

export default function BedsPage() {
  const [beds, setBeds] = useState<BedResource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')

  useEffect(() => {
    fetchBedsData()
  }, [])

  const fetchBedsData = async () => {
    try {
      const response = await fetch('/api/resources?type=BED,ICU_BED')
      if (response.ok) {
        const data = await response.json()
        setBeds(data.resources || [])
      }
    } catch (error) {
      console.error('Error fetching beds data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBeds = beds.filter(bed => 
    bed.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterDepartment === '' || bed.department === filterDepartment)
  )

  const getUtilizationPercentage = (bed: BedResource) => {
    return ((bed.totalCapacity - bed.availableCapacity) / bed.totalCapacity) * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'IN_USE': return 'bg-blue-100 text-blue-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'RESERVED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const departments = [...new Set(beds.map(bed => bed.department))]

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
          <h1 className="text-3xl font-bold tracking-tight">Bed Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage hospital bed capacity and availability
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBedsData}>
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
                  placeholder="Search beds..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
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
            <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {beds.reduce((sum, bed) => sum + bed.totalCapacity, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {beds.reduce((sum, bed) => sum + bed.availableCapacity, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <div className="h-4 w-4 bg-blue-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {beds.reduce((sum, bed) => sum + bed.inUseCapacity, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {beds.filter(bed => bed.isCritical).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBeds.map((bed) => (
          <Card key={bed.id} className={`relative ${bed.isCritical ? 'border-red-300 bg-red-50' : ''}`}>
            {bed.isCritical && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive">Critical</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{bed.name}</CardTitle>
                  <CardDescription>{bed.department}</CardDescription>
                </div>
                <Badge className={getStatusColor(bed.status)}>
                  {bed.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Capacity Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Capacity</span>
                  <span>{bed.availableCapacity}/{bed.totalCapacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUtilizationPercentage(bed)}%` }}
                  ></div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Available</div>
                  <div className="font-semibold text-green-600">{bed.availableCapacity}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">In Use</div>
                  <div className="font-semibold text-blue-600">{bed.inUseCapacity}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reserved</div>
                  <div className="font-semibold text-orange-600">{bed.reservedCapacity}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Utilization</div>
                  <div className="font-semibold">{getUtilizationPercentage(bed).toFixed(1)}%</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Updated: {new Date(bed.lastUpdated).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBeds.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No beds found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterDepartment 
                ? 'Try adjusting your search criteria' 
                : 'No bed resources configured yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}