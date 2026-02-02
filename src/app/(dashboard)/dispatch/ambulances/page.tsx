// src/app/dispatch/ambulances/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Ambulance as AmbulanceIcon,
  Plus,
  RefreshCw,
  MapPin,
  Wrench,
  Fuel,
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Hospital,
  Shield
} from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'

// Simple toast implementation
const useSimpleToast = () => {
  const showToast = (options: { 
    title?: string; 
    description?: string; 
    variant?: 'default' | 'destructive' 
  }) => {
    const { title, description, variant = 'default' } = options
    
    // Create a simple toast element
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg border ${
      variant === 'destructive' 
        ? 'bg-red-50 text-red-800 border-red-200' 
        : 'bg-green-50 text-green-800 border-green-200'
    }`
    toast.innerHTML = `
      <div>
        ${title ? `<h3 class="font-semibold">${title}</h3>` : ''}
        ${description ? `<p class="text-sm mt-1">${description}</p>` : ''}
      </div>
    `
    
    document.body.appendChild(toast)
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 5000)
    
    return { id: Date.now() }
  }
  
  return { toast: showToast }
}

interface AmbulanceData {
  id: string
  registrationNumber: string
  type: string
  equipmentLevel: string
  status: string
  currentLocation?: { lat: number; lng: number; accuracy?: number; timestamp?: string }
  driverName: string
  driverPhone: string
  paramedicName?: string
  lastServiceDate: string
  nextServiceDate: string
  fuelLevel: number
  mileage: number
  isOperational: boolean
  hospital?: { name: string }
  county?: { name: string }
  ambulanceType?: 'HOSPITAL' | 'COUNTY'
}

export default function AmbulancesPage() {
  const router = useRouter()
  const { toast } = useSimpleToast()
  const { user, logout } = useAuth()
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([])
  const [filteredAmbulances, setFilteredAmbulances] = useState<AmbulanceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [ambulanceTypeFilter, setAmbulanceTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchAmbulances()
  }, [])

  useEffect(() => {
    filterAmbulances()
  }, [searchTerm, statusFilter, typeFilter, ambulanceTypeFilter, ambulances])

  const fetchAmbulances = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to access this page',
          variant: 'destructive'
        })
        router.push('/login')
        return
      }
      
      console.log('🔐 Fetching ambulances with token...')
      
      const response = await fetch('/api/dispatch/ambulances', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please login again.',
            variant: 'destructive'
          })
          logout()
          return
        }
        throw new Error(`Failed to fetch ambulances: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🚑 Ambulances data:', data)
      
      if (data.success) {
        setAmbulances(data.ambulances || [])
      } else {
        throw new Error(data.error || 'Failed to fetch ambulances')
      }
      
    } catch (error) {
      console.error('Error fetching ambulances:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load ambulances',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterAmbulances = () => {
    let filtered = [...ambulances]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(ambulance =>
        ambulance.registrationNumber.toLowerCase().includes(term) ||
        ambulance.driverName.toLowerCase().includes(term) ||
        ambulance.driverPhone.includes(term) ||
        ambulance.type.toLowerCase().includes(term) ||
        (ambulance.hospital?.name?.toLowerCase().includes(term) || false) ||
        (ambulance.county?.name?.toLowerCase().includes(term) || false)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ambulance => ambulance.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ambulance => ambulance.type === typeFilter)
    }

    // Apply ambulance type filter
    if (ambulanceTypeFilter !== 'all') {
      filtered = filtered.filter(ambulance => ambulance.ambulanceType === ambulanceTypeFilter)
    }

    setFilteredAmbulances(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-300'
      case 'DISPATCHED': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ON_SCENE': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'TRANSPORTING': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'UNAVAILABLE': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle className="h-3 w-3" />
      case 'DISPATCHED': case 'ON_SCENE': case 'TRANSPORTING': 
        return <Clock className="h-3 w-3" />
      case 'UNAVAILABLE': case 'MAINTENANCE': 
        return <AlertCircle className="h-3 w-3" />
      default: return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BLS': return 'bg-blue-50 text-blue-700'
      case 'ALS': return 'bg-green-50 text-green-700'
      case 'CRITICAL_CARE': return 'bg-purple-50 text-purple-700'
      case 'AIR_AMBULANCE': return 'bg-red-50 text-red-700'
      case 'PATIENT_TRANSPORT': return 'bg-yellow-50 text-yellow-700'
      case 'MOBILE_CLINIC': return 'bg-teal-50 text-teal-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const getFuelColor = (level: number) => {
    if (level > 50) return 'text-green-600'
    if (level > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFuelIcon = (level: number) => {
    if (level > 50) return '🔋'
    if (level > 20) return '⚠️'
    return '🪫'
  }

  const handleAddAmbulance = () => {
    router.push('/dispatch/ambulances/new')
  }

  const handleViewDetails = (id: string) => {
    router.push(`/dispatch/ambulances/${id}`)
  }

  const handleQuickStatusUpdate = async (ambulanceId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to perform this action',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch(`/api/dispatch/ambulances/${ambulanceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      // Update local state
      setAmbulances(prev => prev.map(amb => 
        amb.id === ambulanceId ? { ...amb, status: newStatus } : amb
      ))

      toast({
        title: 'Success',
        description: 'Ambulance status updated successfully',
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ambulance status',
        variant: 'destructive'
      })
    }
  }

  const getAmbulanceTypeIcon = (ambulanceType?: string) => {
    switch (ambulanceType) {
      case 'HOSPITAL': return <Hospital className="h-3 w-3" />
      case 'COUNTY': return <Shield className="h-3 w-3" />
      default: return null
    }
  }

  const getAmbulanceTypeBadge = (ambulanceType?: string) => {
    switch (ambulanceType) {
      case 'HOSPITAL': return 'Hospital'
      case 'COUNTY': return 'County'
      default: return 'Unknown'
    }
  }

  const getAmbulanceTypeColor = (ambulanceType?: string) => {
    switch (ambulanceType) {
      case 'HOSPITAL': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'COUNTY': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = ['AVAILABLE', 'DISPATCHED', 'ON_SCENE', 'TRANSPORTING', 'UNAVAILABLE', 'MAINTENANCE']
    return allStatuses.filter(status => status !== currentStatus)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ambulance fleet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ambulance Fleet Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor ambulance fleet status and maintenance
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              Logged in as: <span className="font-semibold">{user.name}</span> ({user.role})
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchAmbulances} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddAmbulance} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Ambulance
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <AmbulanceIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambulances.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {ambulances.filter(a => a.ambulanceType === 'HOSPITAL').length} Hospital, {ambulances.filter(a => a.ambulanceType === 'COUNTY').length} County
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ambulances.filter(a => a.status === 'AVAILABLE' && a.isOperational).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready for dispatch</p>
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
            <p className="text-xs text-muted-foreground mt-1">Active emergencies</p>
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
            <p className="text-xs text-muted-foreground mt-1">Under service</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Fuel</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ambulances.filter(a => a.fuelLevel < 25).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">&lt; 25% fuel level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Due</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ambulances.filter(a => {
                try {
                  const nextService = new Date(a.nextServiceDate)
                  const today = new Date()
                  const daysUntilService = Math.ceil((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  return daysUntilService <= 7
                } catch {
                  return false
                }
              }).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Due in 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by registration, driver, phone, hospital, or county..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="ON_SCENE">On Scene</SelectItem>
                  <SelectItem value="TRANSPORTING">Transporting</SelectItem>
                  <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Ambulance Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ambulance Types</SelectItem>
                  <SelectItem value="BLS">BLS</SelectItem>
                  <SelectItem value="ALS">ALS</SelectItem>
                  <SelectItem value="CRITICAL_CARE">Critical Care</SelectItem>
                  <SelectItem value="AIR_AMBULANCE">Air Ambulance</SelectItem>
                  <SelectItem value="PATIENT_TRANSPORT">Patient Transport</SelectItem>
                  <SelectItem value="MOBILE_CLINIC">Mobile Clinic</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ambulanceTypeFilter} onValueChange={setAmbulanceTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Managed By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Management</SelectItem>
                  <SelectItem value="HOSPITAL">Hospital</SelectItem>
                  <SelectItem value="COUNTY">County</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setTypeFilter('all')
                  setAmbulanceTypeFilter('all')
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ambulances Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Ambulance Fleet</CardTitle>
              <CardDescription>
                {filteredAmbulances.length} of {ambulances.length} ambulances shown
                {user?.facilityName && ` • ${user.facilityName}`}
              </CardDescription>
            </div>
            {filteredAmbulances.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  Hospital: {filteredAmbulances.filter(a => a.ambulanceType === 'HOSPITAL').length}
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  County: {filteredAmbulances.filter(a => a.ambulanceType === 'COUNTY').length}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAmbulances.length === 0 ? (
            <div className="text-center py-12">
              <AmbulanceIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">No ambulances found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || ambulanceTypeFilter !== 'all'
                  ? 'Try changing your filters or search term'
                  : 'Add your first ambulance to get started'}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && ambulanceTypeFilter === 'all' && (
                <Button onClick={handleAddAmbulance} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ambulance
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Registration</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead>Driver & Crew</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-[100px]">Fuel</TableHead>
                    <TableHead className="w-[140px]">Service Due</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAmbulances.map((ambulance) => {
                    const isServiceDue = () => {
                      try {
                        const nextService = new Date(ambulance.nextServiceDate)
                        const today = new Date()
                        const daysUntilService = Math.ceil((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        return daysUntilService <= 7
                      } catch {
                        return false
                      }
                    }

                    return (
                      <TableRow key={ambulance.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <AmbulanceIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-semibold">{ambulance.registrationNumber}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getAmbulanceTypeColor(ambulance.ambulanceType)}`}
                                >
                                  {getAmbulanceTypeIcon(ambulance.ambulanceType)}
                                  {getAmbulanceTypeBadge(ambulance.ambulanceType)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {ambulance.hospital && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {ambulance.hospital.name}
                            </p>
                          )}
                          {ambulance.county && !ambulance.hospital && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {ambulance.county.name} County
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeColor(ambulance.type)}>
                            {ambulance.type}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ambulance.equipmentLevel}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 w-fit ${getStatusColor(ambulance.status)}`}
                            >
                              {getStatusIcon(ambulance.status)}
                              {ambulance.status}
                            </Badge>
                            {!ambulance.isOperational && (
                              <span className="text-xs text-red-600 font-medium">Not Operational</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ambulance.driverName}</p>
                            {ambulance.paramedicName && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Paramedic: {ambulance.paramedicName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Mileage: {ambulance.mileage?.toLocaleString() || 0} km
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a 
                            href={`tel:${ambulance.driverPhone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            {ambulance.driverPhone}
                          </a>
                          {ambulance.currentLocation && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              GPS: {ambulance.currentLocation.lat?.toFixed(4)}, {ambulance.currentLocation.lng?.toFixed(4)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={getFuelColor(ambulance.fuelLevel)}>
                              {getFuelIcon(ambulance.fuelLevel)}
                            </span>
                            <div>
                              <span className={`font-medium ${getFuelColor(ambulance.fuelLevel)}`}>
                                {ambulance.fuelLevel}%
                              </span>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    ambulance.fuelLevel > 50 ? 'bg-green-500' : 
                                    ambulance.fuelLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(ambulance.fuelLevel, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex flex-col gap-1 ${isServiceDue() ? 'text-orange-600' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">
                                {new Date(ambulance.nextServiceDate).toLocaleDateString()}
                              </span>
                            </div>
                            {isServiceDue() ? (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 w-fit">
                                Service Due
                              </Badge>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Last: {new Date(ambulance.lastServiceDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(ambulance.id)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dispatch/map?ambulance=${ambulance.id}`)}>
                                View on Map
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Quick Status</DropdownMenuLabel>
                              {getAvailableStatuses(ambulance.status).map((status) => (
                                <DropdownMenuItem 
                                  key={status} 
                                  onClick={() => handleQuickStatusUpdate(ambulance.id, status)}
                                >
                                  Set to {status}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to deactivate ambulance ${ambulance.registrationNumber}?`)) {
                                    handleQuickStatusUpdate(ambulance.id, 'UNAVAILABLE')
                                  }
                                }}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}