// dispatch/logs/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  FileText,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Phone,
  MapPin,
  User,
  Clock,
  Calendar,
  RefreshCw,
  Download,
  Printer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus
} from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

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

// Types
interface DispatchLog {
  id: string
  dispatchNumber: string
  emergencyType: string
  severity: 'CRITICAL' | 'URGENT' | 'NON_URGENT' | 'ROUTINE'
  callerPhone: string
  callerName?: string
  callerLocation?: string
  status: 'RECEIVED' | 'ASSESSING' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'TRANSPORTING' | 'AT_HOSPITAL' | 'COMPLETED' | 'CANCELLED'
  callReceived: string
  dispatched?: string
  arrivedOnScene?: string
  departedScene?: string
  arrivedHospital?: string
  cleared?: string
  outcome?: 'TRANSPORTED' | 'TREATED_ON_SCENE' | 'REFUSED_TRANSPORT' | 'CANCELLED_BY_CALLER' | 'FALSE_ALARM' | 'PATIENT_NOT_FOUND' | 'DEAD_ON_ARRIVAL'
  ambulance?: {
    registrationNumber: string
    type: string
  }
  countyAmbulance?: {
    registrationNumber: string
    type: string
  }
  dispatcher?: {
    firstName: string
    lastName: string
  }
  patientCount: number
  description?: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FilterOptions {
  search: string
  status: string
  emergencyType: string
  severity: string
  dateRange: string
  startDate?: string
  endDate?: string
}

export default function DispatchLogsPage() {
  const router = useRouter()
  const { toast } = useSimpleToast()
  
  // State
  const [logs, setLogs] = useState<DispatchLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<DispatchLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<DispatchLog | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    emergencyType: 'all',
    severity: 'all',
    dateRange: 'today'
  })
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  })

  // Fetch logs
  const fetchLogs = useCallback(async (page = 1, limit = 50) => {
    try {
      const isInitialLoad = page === 1
      if (isInitialLoad) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.emergencyType !== 'all' && { emergencyType: filters.emergencyType }),
        ...(filters.severity !== 'all' && { severity: filters.severity }),
        ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })
      
      const response = await fetch(`/api/dispatch/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch dispatch logs')
      }
      
      const data = await response.json()
      
      if (page === 1) {
        setLogs(data.logs || [])
        setFilteredLogs(data.logs || [])
      } else {
        setLogs(prev => [...prev, ...(data.logs || [])])
        setFilteredLogs(prev => [...prev, ...(data.logs || [])])
      }
      
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 50,
        totalPages: data.totalPages || 1
      })
      
    } catch (error) {
      console.error('Error fetching dispatch logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dispatch logs',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [router, toast, filters])

  // Initial fetch
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Apply filters
  useEffect(() => {
    let filtered = [...logs]

    // Apply search filter
    if (filters.search) {
      const term = filters.search.toLowerCase()
      filtered = filtered.filter(log =>
        log.dispatchNumber.toLowerCase().includes(term) ||
        log.callerPhone.toLowerCase().includes(term) ||
        log.callerName?.toLowerCase().includes(term) ||
        log.callerLocation?.toLowerCase().includes(term) ||
        log.emergencyType.toLowerCase().includes(term)
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status)
    }

    // Apply emergency type filter
    if (filters.emergencyType !== 'all') {
      filtered = filtered.filter(log => log.emergencyType === filters.emergencyType)
    }

    // Apply severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(log => log.severity === filters.severity)
    }

    // Apply date range filter
    if (filters.dateRange !== 'all' && !filters.startDate && !filters.endDate) {
      const now = new Date()
      let startDate: Date
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          break
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          break
        default:
          startDate = new Date(0) // Beginning of time
      }
      
      filtered = filtered.filter(log => {
        const logDate = parseISO(log.callReceived)
        return logDate >= startDate
      })
    }
    
    // Apply custom date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(log => {
        const logDate = parseISO(log.callReceived)
        const start = filters.startDate ? parseISO(filters.startDate) : new Date(0)
        const end = filters.endDate ? parseISO(filters.endDate) : new Date()
        return logDate >= start && logDate <= end
      })
    }

    setFilteredLogs(filtered)
  }, [logs, filters])

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'AT_HOSPITAL': case 'TRANSPORTING': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ON_SCENE': case 'EN_ROUTE': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'DISPATCHED': case 'ASSESSING': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'RECEIVED': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-3 w-3" />
      case 'CANCELLED': return <XCircle className="h-3 w-3" />
      case 'AT_HOSPITAL': case 'TRANSPORTING': case 'ON_SCENE': case 'EN_ROUTE': 
      case 'DISPATCHED': case 'ASSESSING': return <Clock className="h-3 w-3" />
      case 'RECEIVED': return <AlertCircle className="h-3 w-3" />
      default: return null
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200'
      case 'URGENT': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'NON_URGENT': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'ROUTINE': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const getEmergencyTypeColor = (type: string) => {
    switch (type) {
      case 'CARDIAC': return 'bg-red-50 text-red-700'
      case 'TRAUMA': return 'bg-orange-50 text-orange-700'
      case 'RESPIRATORY': return 'bg-purple-50 text-purple-700'
      case 'OBSTETRIC': return 'bg-pink-50 text-pink-700'
      case 'PEDIATRIC': return 'bg-blue-50 text-blue-700'
      case 'STROKE': return 'bg-indigo-50 text-indigo-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // Simple formatting for Kenyan phone numbers
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 9) {
      return `0${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
    }
    if (cleaned.length === 10) {
      return `0${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }
    return phone
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'dd/MM/yyyy HH:mm')
    } catch {
      return dateString
    }
  }

  const getTimeAgo = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return ''
    }
  }

  const calculateResponseTime = (log: DispatchLog) => {
    if (!log.dispatched || !log.arrivedOnScene) return null
    
    const dispatched = parseISO(log.dispatched)
    const arrived = parseISO(log.arrivedOnScene)
    const diffInMinutes = Math.round((arrived.getTime() - dispatched.getTime()) / (1000 * 60))
    
    return diffInMinutes
  }

  const calculateSceneTime = (log: DispatchLog) => {
    if (!log.arrivedOnScene || !log.departedScene) return null
    
    const arrived = parseISO(log.arrivedOnScene)
    const departed = parseISO(log.departedScene)
    const diffInMinutes = Math.round((departed.getTime() - arrived.getTime()) / (1000 * 60))
    
    return diffInMinutes
  }

  const calculateTransportTime = (log: DispatchLog) => {
    if (!log.departedScene || !log.arrivedHospital) return null
    
    const departed = parseISO(log.departedScene)
    const arrived = parseISO(log.arrivedHospital)
    const diffInMinutes = Math.round((arrived.getTime() - departed.getTime()) / (1000 * 60))
    
    return diffInMinutes
  }

  const getAmbulanceInfo = (log: DispatchLog) => {
    if (log.ambulance) {
      return `${log.ambulance.registrationNumber} (${log.ambulance.type})`
    }
    if (log.countyAmbulance) {
      return `${log.countyAmbulance.registrationNumber} (${log.countyAmbulance.type})`
    }
    return 'Not assigned'
  }

  const getDispatcherName = (log: DispatchLog) => {
    if (log.dispatcher) {
      return `${log.dispatcher.firstName} ${log.dispatcher.lastName}`
    }
    return 'Unknown'
  }

  // Handlers
  const handleViewDetails = (log: DispatchLog) => {
    setSelectedLog(log)
    setIsDetailsOpen(true)
  }

  const handleCreateNewCall = () => {
    router.push('/dispatch/calls/new')
  }

  const handleExportLogs = async () => {
    try {
      setIsExporting(true)
      const token = localStorage.getItem('token')
      
      // Build query parameters for export
      const params = new URLSearchParams({
        format: 'csv',
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.emergencyType !== 'all' && { emergencyType: filters.emergencyType }),
        ...(filters.severity !== 'all' && { severity: filters.severity }),
        ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })
      
      const response = await fetch(`/api/dispatch/logs/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to export logs')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dispatch_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Success',
        description: 'Dispatch logs exported successfully',
      })
      
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to export dispatch logs',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrintLogs = () => {
    window.print()
  }

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchLogs(pagination.page + 1)
    }
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset custom dates when changing date range
      ...(key === 'dateRange' && value !== 'custom' && { startDate: undefined, endDate: undefined })
    }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      emergencyType: 'all',
      severity: 'all',
      dateRange: 'today'
    })
  }

  const handleCallPhone = (phone: string) => {
    window.open(`tel:${phone}`, '_blank')
  }

  const handleViewOnMap = (log: DispatchLog) => {
    if (log.callerLocation) {
      const encodedLocation = encodeURIComponent(log.callerLocation)
      router.push(`/dispatch/map?location=${encodedLocation}`)
    }
  }

  if (isLoading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Logs</h1>
          <p className="text-muted-foreground">
            View and manage emergency dispatch records
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => fetchLogs(1)} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleExportLogs} 
            variant="outline" 
            size="sm"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <Button 
            onClick={handlePrintLogs} 
            variant="outline" 
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            onClick={handleCreateNewCall} 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Call
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Showing {filteredLogs.length.toLocaleString()} filtered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <div className="h-3 w-3 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => 
                ['RECEIVED', 'ASSESSING', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING'].includes(log.status)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active emergencies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => 
                log.status === 'COMPLETED' && 
                parseISO(log.callReceived).getDate() === new Date().getDate()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully handled today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const completedLogs = logs.filter(log => log.status === 'COMPLETED' && log.dispatched && log.arrivedOnScene)
                if (completedLogs.length === 0) return '0'
                
                const totalTime = completedLogs.reduce((sum, log) => {
                  const responseTime = calculateResponseTime(log)
                  return sum + (responseTime || 0)
                }, 0)
                
                return Math.round(totalTime / completedLogs.length)
              })()} min
            </div>
            <p className="text-xs text-muted-foreground">
              Average for completed calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by dispatch number, phone, name, or location..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="ASSESSING">Assessing</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="EN_ROUTE">En Route</SelectItem>
                    <SelectItem value="ON_SCENE">On Scene</SelectItem>
                    <SelectItem value="TRANSPORTING">Transporting</SelectItem>
                    <SelectItem value="AT_HOSPITAL">At Hospital</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Emergency Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="emergencyType">Emergency Type</Label>
                <Select 
                  value={filters.emergencyType} 
                  onValueChange={(value) => handleFilterChange('emergencyType', value)}
                >
                  <SelectTrigger id="emergencyType">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="CARDIAC">Cardiac</SelectItem>
                    <SelectItem value="TRAUMA">Trauma</SelectItem>
                    <SelectItem value="RESPIRATORY">Respiratory</SelectItem>
                    <SelectItem value="OBSTETRIC">Obstetric</SelectItem>
                    <SelectItem value="PEDIATRIC">Pediatric</SelectItem>
                    <SelectItem value="STROKE">Stroke</SelectItem>
                    <SelectItem value="MEDICAL">Medical</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Filter */}
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select 
                  value={filters.severity} 
                  onValueChange={(value) => handleFilterChange('severity', value)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="NON_URGENT">Non-Urgent</SelectItem>
                    <SelectItem value="ROUTINE">Routine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(value) => handleFilterChange('dateRange', value)}
                >
                  <SelectTrigger id="dateRange">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Filter Actions */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {logs.length} logs
              </div>
              <Button
                variant="outline"
                onClick={handleResetFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dispatch Logs</CardTitle>
          <CardDescription>
            Recent emergency calls and dispatches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">No dispatch logs found</h3>
              <p className="text-muted-foreground mt-1">
                {filters.search || filters.status !== 'all' || filters.emergencyType !== 'all' || 
                 filters.severity !== 'all' || filters.dateRange !== 'today'
                  ? 'Try changing your filters or search term'
                  : 'No dispatch logs available yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispatch #</TableHead>
                      <TableHead>Emergency</TableHead>
                      <TableHead>Caller</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Ambulance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {log.dispatchNumber}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getTimeAgo(log.callReceived)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge 
                              variant="outline" 
                              className={getEmergencyTypeColor(log.emergencyType)}
                            >
                              {log.emergencyType}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`ml-2 ${getSeverityColor(log.severity)}`}
                            >
                              {log.severity}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {log.patientCount} patient(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {log.callerName ? (
                              <p className="font-medium flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.callerName}
                              </p>
                            ) : null}
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              <a 
                                href={`tel:${log.callerPhone}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleCallPhone(log.callerPhone)
                                }}
                              >
                                {formatPhoneNumber(log.callerPhone)}
                              </a>
                            </div>
                            {log.callerLocation && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {log.callerLocation}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 ${getStatusColor(log.status)}`}
                            >
                              {getStatusIcon(log.status)}
                              {log.status.replace('_', ' ')}
                            </Badge>
                            {log.outcome && (
                              <span className="text-xs text-muted-foreground">
                                ({log.outcome.replace('_', ' ')})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {formatDate(log.callReceived)}
                            </p>
                            {log.dispatched && (
                              <p className="text-xs text-muted-foreground">
                                Dispatched: {formatDate(log.dispatched)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getAmbulanceInfo(log)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Dispatcher: {getDispatcherName(log)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCallPhone(log.callerPhone)}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call Back
                              </DropdownMenuItem>
                              {log.callerLocation && (
                                <DropdownMenuItem 
                                  onClick={() => handleViewOnMap(log)}
                                >
                                  <MapPin className="h-4 w-4 mr-2" />
                                  View on Map
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/dispatch/calls/${log.id}`)}>
                                Open in Calls
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Add Note
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Mark as False Alarm
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} • {pagination.total.toLocaleString()} total records
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(1)}
                      disabled={pagination.page === 1 || isLoading}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(pagination.page - 1)}
                      disabled={pagination.page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(pagination.totalPages)}
                      disabled={pagination.page === pagination.totalPages || isLoading}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Load More */}
              {pagination.page < pagination.totalPages && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load More ({pagination.total - filteredLogs.length} remaining)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dispatch Details: {selectedLog.dispatchNumber}
                </DialogTitle>
                <DialogDescription>
                  Complete information for this dispatch call
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Dispatch Number</Label>
                      <p className="font-medium">{selectedLog.dispatchNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Emergency Type</Label>
                      <Badge variant="outline" className={getEmergencyTypeColor(selectedLog.emergencyType)}>
                        {selectedLog.emergencyType}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Severity</Label>
                      <Badge variant="outline" className={getSeverityColor(selectedLog.severity)}>
                        {selectedLog.severity}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${getStatusColor(selectedLog.status)}`}>
                        {getStatusIcon(selectedLog.status)}
                        {selectedLog.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Outcome</Label>
                      <p>{selectedLog.outcome ? selectedLog.outcome.replace('_', ' ') : 'Pending'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Patient Count</Label>
                      <p>{selectedLog.patientCount} patient(s)</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Caller Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Caller Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Caller Name</Label>
                      <p className="font-medium">{selectedLog.callerName || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a 
                          href={`tel:${selectedLog.callerPhone}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {formatPhoneNumber(selectedLog.callerPhone)}
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Location</Label>
                      <p>{selectedLog.callerLocation || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Call Received</Label>
                        <p>{formatDate(selectedLog.callReceived)}</p>
                      </div>
                      {selectedLog.dispatched && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Dispatched</Label>
                          <p>{formatDate(selectedLog.dispatched)}</p>
                        </div>
                      )}
                      {selectedLog.arrivedOnScene && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Arrived on Scene</Label>
                          <p>{formatDate(selectedLog.arrivedOnScene)}</p>
                        </div>
                      )}
                      {selectedLog.departedScene && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Departed Scene</Label>
                          <p>{formatDate(selectedLog.departedScene)}</p>
                        </div>
                      )}
                      {selectedLog.arrivedHospital && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Arrived at Hospital</Label>
                          <p>{formatDate(selectedLog.arrivedHospital)}</p>
                        </div>
                      )}
                      {selectedLog.cleared && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Cleared</Label>
                          <p>{formatDate(selectedLog.cleared)}</p>
                        </div>
                      )}
                    </div>

                    {/* Response Times */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      {selectedLog.dispatched && selectedLog.arrivedOnScene && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Response Time</Label>
                          <p className="font-medium">{calculateResponseTime(selectedLog)} minutes</p>
                        </div>
                      )}
                      {selectedLog.arrivedOnScene && selectedLog.departedScene && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Scene Time</Label>
                          <p className="font-medium">{calculateSceneTime(selectedLog)} minutes</p>
                        </div>
                      )}
                      {selectedLog.departedScene && selectedLog.arrivedHospital && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Transport Time</Label>
                          <p className="font-medium">{calculateTransportTime(selectedLog)} minutes</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Dispatch Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dispatch Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Ambulance</Label>
                      <p className="font-medium">{getAmbulanceInfo(selectedLog)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Dispatcher</Label>
                      <p>{getDispatcherName(selectedLog)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {selectedLog.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md bg-gray-50 p-4">
                        <p className="whitespace-pre-wrap">{selectedLog.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCallPhone(selectedLog.callerPhone)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Back
                </Button>
                {selectedLog.callerLocation && (
                  <Button
                    variant="outline"
                    onClick={() => handleViewOnMap(selectedLog)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                )}
                <Button
                  onClick={() => router.push(`/dispatch/calls/${selectedLog.id}`)}
                >
                  Open in Calls
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}