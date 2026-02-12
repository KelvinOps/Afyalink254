'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Badge } from '@/app/components/ui/badge'
import { Progress } from '@/app/components/ui/progress'
import { 
  BarChart3,
  Activity,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Building,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  Heart,
  Building2,
  Bed,
  Thermometer,
  Brain,
  Baby,
  Syringe,
  Ambulance,
  Target,
  XCircle,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart
} from 'recharts'
import { format } from 'date-fns'
import { LucideIcon } from 'lucide-react'

// Define proper interfaces for nested data structures
interface PriorityData {
  total: number
  byStatus?: {
    WAITING?: number
    IN_ASSESSMENT?: number
    IN_TREATMENT?: number
    ADMITTED?: number
    DISCHARGED?: number
    [key: string]: number | undefined
  }
}

interface Department {
  departmentId: string
  departmentName: string
  departmentType: string
  total: number
  byPriority: {
    [key: string]: PriorityData
  }
  bedUtilization: {
    totalBeds: number
    availableBeds: number
    occupancyRate: number
  }
}

interface DashboardData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  summary: {
    total: number
    byPriority: {
      [key: string]: PriorityData
    }
    byStatus: {
      [key: string]: number
    }
  }
  departments: Department[]
  kpis: {
    averageWaitTime: number
    longestWaitTime: number
    shortestWaitTime: number
    averageTreatmentTime: number
    leftWithoutTreatment: number
    readmissionRate: number
    patientSatisfaction: number
  }
  trends: {
    peakHours: Array<{
      hour: number
      total: number
      immediate: number
      urgent: number
    }>
    topComplaints: Array<{
      complaint: string
      count: number
    }>
    arrivalMode: {
      [key: string]: number
    }
  }
}

// Department icons mapping
const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
  'ACCIDENT_EMERGENCY': AlertTriangle,
  'PEDIATRICS': Baby,
  'MATERNITY': Heart,
  'SURGERY': Syringe,
  'ICU': Activity,
  'CARDIOLOGY': Heart,
  'NEUROLOGY': Brain,
  'ORTHOPEDICS': Bed,
  'RADIOLOGY': Thermometer,
  'LABORATORY': Activity
}

const PRIORITY_LABELS: Record<string, string> = {
  'IMMEDIATE': 'Immediate',
  'URGENT': 'Urgent',
  'LESS_URGENT': 'Less Urgent',
  'NON_URGENT': 'Non-Urgent'
}

// Define types for chart data
interface PriorityChartData {
  name: string
  total: number
  color: string
  value: number
}

interface StatusChartData {
  name: string
  value: number
  color: string
}

interface PeakHourChartData {
  hour: string
  total: number
  immediate: number
  urgent: number
}

interface ArrivalModeChartData {
  name: string
  value: number
  fill: string
}

interface DepartmentComparisonData {
  name: string
  patients: number
  occupancy: number
  critical: number
  urgent: number
  waiting: number
}

interface CompositeChartData {
  hour: string
  total: number
  immediate: number
  urgent: number
  criticalPercentage: number
}

interface QualityMetric {
  label: 'Left Without Treatment' | 'Readmission Rate' | 'Patient Satisfaction'
  value: number
  percentage?: number
  unit?: string
  target: number
  status: 'good' | 'poor'
  icon: LucideIcon
}

interface Filters {
  period: string
  hospitalId: string
  dateFrom: string
  dateTo: string
}

// Mock data generator for development
const generateMockDashboardData = (filters: Filters): DashboardData => {
  const now = new Date()
  const startDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endDate = filters.dateTo ? new Date(filters.dateTo) : now
  
  // Generate realistic data based on period
  let basePatients = 100
  switch (filters.period) {
    case 'today': basePatients = 245; break
    case 'week': basePatients = 1500; break
    case 'month': basePatients = 6000; break
    default: basePatients = 245
  }

  const departments = [
    {
      departmentId: 'dept-001',
      departmentName: 'Accident & Emergency',
      departmentType: 'ACCIDENT_EMERGENCY',
      total: Math.floor(basePatients * 0.35),
      byPriority: {
        IMMEDIATE: { total: Math.floor(basePatients * 0.04), byStatus: { WAITING: 1, IN_ASSESSMENT: 2, IN_TREATMENT: Math.floor(basePatients * 0.04) - 3 } },
        URGENT: { total: Math.floor(basePatients * 0.12), byStatus: { WAITING: 5, IN_ASSESSMENT: 8, IN_TREATMENT: Math.floor(basePatients * 0.12) - 13 } },
        LESS_URGENT: { total: Math.floor(basePatients * 0.10), byStatus: { WAITING: 8, IN_ASSESSMENT: 7, IN_TREATMENT: Math.floor(basePatients * 0.10) - 15 } },
        NON_URGENT: { total: Math.floor(basePatients * 0.09), byStatus: { WAITING: 10, IN_ASSESSMENT: 6, IN_TREATMENT: Math.floor(basePatients * 0.09) - 16 } }
      },
      bedUtilization: {
        totalBeds: 50,
        availableBeds: 12,
        occupancyRate: 76
      }
    },
    {
      departmentId: 'dept-002',
      departmentName: 'Pediatrics',
      departmentType: 'PEDIATRICS',
      total: Math.floor(basePatients * 0.20),
      byPriority: {
        IMMEDIATE: { total: Math.floor(basePatients * 0.02), byStatus: { WAITING: 1, IN_ASSESSMENT: 1, IN_TREATMENT: Math.floor(basePatients * 0.02) - 2 } },
        URGENT: { total: Math.floor(basePatients * 0.08), byStatus: { WAITING: 3, IN_ASSESSMENT: 4, IN_TREATMENT: Math.floor(basePatients * 0.08) - 7 } },
        LESS_URGENT: { total: Math.floor(basePatients * 0.06), byStatus: { WAITING: 5, IN_ASSESSMENT: 5, IN_TREATMENT: Math.floor(basePatients * 0.06) - 10 } },
        NON_URGENT: { total: Math.floor(basePatients * 0.04), byStatus: { WAITING: 6, IN_ASSESSMENT: 3, IN_TREATMENT: Math.floor(basePatients * 0.04) - 9 } }
      },
      bedUtilization: {
        totalBeds: 40,
        availableBeds: 18,
        occupancyRate: 55
      }
    },
    {
      departmentId: 'dept-003',
      departmentName: 'Maternity',
      departmentType: 'MATERNITY',
      total: Math.floor(basePatients * 0.15),
      byPriority: {
        IMMEDIATE: { total: Math.floor(basePatients * 0.03), byStatus: { WAITING: 0, IN_ASSESSMENT: 1, IN_TREATMENT: Math.floor(basePatients * 0.03) - 1 } },
        URGENT: { total: Math.floor(basePatients * 0.05), byStatus: { WAITING: 2, IN_ASSESSMENT: 2, IN_TREATMENT: Math.floor(basePatients * 0.05) - 4 } },
        LESS_URGENT: { total: Math.floor(basePatients * 0.04), byStatus: { WAITING: 3, IN_ASSESSMENT: 3, IN_TREATMENT: Math.floor(basePatients * 0.04) - 6 } },
        NON_URGENT: { total: Math.floor(basePatients * 0.03), byStatus: { WAITING: 4, IN_ASSESSMENT: 2, IN_TREATMENT: Math.floor(basePatients * 0.03) - 6 } }
      },
      bedUtilization: {
        totalBeds: 35,
        availableBeds: 10,
        occupancyRate: 71
      }
    },
    {
      departmentId: 'dept-004',
      departmentName: 'ICU',
      departmentType: 'ICU',
      total: Math.floor(basePatients * 0.10),
      byPriority: {
        IMMEDIATE: { total: Math.floor(basePatients * 0.06), byStatus: { WAITING: 0, IN_ASSESSMENT: 2, IN_TREATMENT: Math.floor(basePatients * 0.06) - 2 } },
        URGENT: { total: Math.floor(basePatients * 0.03), byStatus: { WAITING: 0, IN_ASSESSMENT: 1, IN_TREATMENT: Math.floor(basePatients * 0.03) - 1 } },
        LESS_URGENT: { total: Math.floor(basePatients * 0.01), byStatus: { WAITING: 1, IN_ASSESSMENT: 0, IN_TREATMENT: Math.floor(basePatients * 0.01) - 1 } },
        NON_URGENT: { total: 0, byStatus: {} }
      },
      bedUtilization: {
        totalBeds: 20,
        availableBeds: 2,
        occupancyRate: 90
      }
    },
    {
      departmentId: 'dept-005',
      departmentName: 'Surgery',
      departmentType: 'SURGERY',
      total: Math.floor(basePatients * 0.12),
      byPriority: {
        IMMEDIATE: { total: Math.floor(basePatients * 0.02), byStatus: { WAITING: 0, IN_ASSESSMENT: 1, IN_TREATMENT: Math.floor(basePatients * 0.02) - 1 } },
        URGENT: { total: Math.floor(basePatients * 0.04), byStatus: { WAITING: 1, IN_ASSESSMENT: 2, IN_TREATMENT: Math.floor(basePatients * 0.04) - 3 } },
        LESS_URGENT: { total: Math.floor(basePatients * 0.03), byStatus: { WAITING: 2, IN_ASSESSMENT: 2, IN_TREATMENT: Math.floor(basePatients * 0.03) - 4 } },
        NON_URGENT: { total: Math.floor(basePatients * 0.03), byStatus: { WAITING: 3, IN_ASSESSMENT: 2, IN_TREATMENT: Math.floor(basePatients * 0.03) - 5 } }
      },
      bedUtilization: {
        totalBeds: 30,
        availableBeds: 8,
        occupancyRate: 73
      }
    }
  ]

  const totalPatients = departments.reduce((sum, dept) => sum + dept.total, 0)
  
  // Calculate summary from departments
  const summaryByPriority = {
    IMMEDIATE: { 
      total: departments.reduce((sum, dept) => sum + (dept.byPriority.IMMEDIATE?.total || 0), 0),
      byStatus: {
        WAITING: departments.reduce((sum, dept) => sum + (dept.byPriority.IMMEDIATE?.byStatus?.WAITING || 0), 0),
        IN_ASSESSMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.IMMEDIATE?.byStatus?.IN_ASSESSMENT || 0), 0),
        IN_TREATMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.IMMEDIATE?.byStatus?.IN_TREATMENT || 0), 0)
      }
    },
    URGENT: { 
      total: departments.reduce((sum, dept) => sum + (dept.byPriority.URGENT?.total || 0), 0),
      byStatus: {
        WAITING: departments.reduce((sum, dept) => sum + (dept.byPriority.URGENT?.byStatus?.WAITING || 0), 0),
        IN_ASSESSMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.URGENT?.byStatus?.IN_ASSESSMENT || 0), 0),
        IN_TREATMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.URGENT?.byStatus?.IN_TREATMENT || 0), 0)
      }
    },
    LESS_URGENT: { 
      total: departments.reduce((sum, dept) => sum + (dept.byPriority.LESS_URGENT?.total || 0), 0),
      byStatus: {
        WAITING: departments.reduce((sum, dept) => sum + (dept.byPriority.LESS_URGENT?.byStatus?.WAITING || 0), 0),
        IN_ASSESSMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.LESS_URGENT?.byStatus?.IN_ASSESSMENT || 0), 0),
        IN_TREATMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.LESS_URGENT?.byStatus?.IN_TREATMENT || 0), 0)
      }
    },
    NON_URGENT: { 
      total: departments.reduce((sum, dept) => sum + (dept.byPriority.NON_URGENT?.total || 0), 0),
      byStatus: {
        WAITING: departments.reduce((sum, dept) => sum + (dept.byPriority.NON_URGENT?.byStatus?.WAITING || 0), 0),
        IN_ASSESSMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.NON_URGENT?.byStatus?.IN_ASSESSMENT || 0), 0),
        IN_TREATMENT: departments.reduce((sum, dept) => sum + (dept.byPriority.NON_URGENT?.byStatus?.IN_TREATMENT || 0), 0)
      }
    }
  }

  const summaryByStatus = {
    WAITING: Object.values(summaryByPriority).reduce((sum, priority) => sum + (priority.byStatus?.WAITING || 0), 0),
    IN_ASSESSMENT: Object.values(summaryByPriority).reduce((sum, priority) => sum + (priority.byStatus?.IN_ASSESSMENT || 0), 0),
    IN_TREATMENT: Object.values(summaryByPriority).reduce((sum, priority) => sum + (priority.byStatus?.IN_TREATMENT || 0), 0)
  }

  // Generate peak hours data (24 hours)
  const peakHours = Array.from({ length: 24 }, (_, i) => {
    // Create a realistic distribution with peaks at 10am and 7pm
    let baseTotal = 5
    if (i >= 9 && i <= 11) baseTotal = 25 // Morning peak
    if (i >= 18 && i <= 20) baseTotal = 30 // Evening peak
    if (i >= 0 && i <= 5) baseTotal = 3 // Early morning low
    
    const total = baseTotal + Math.floor(Math.random() * 8)
    const immediate = Math.floor(total * 0.08)
    const urgent = Math.floor(total * 0.15)
    
    return {
      hour: i,
      total,
      immediate,
      urgent
    }
  })

  return {
    period: filters.period,
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    summary: {
      total: totalPatients,
      byPriority: summaryByPriority,
      byStatus: summaryByStatus
    },
    departments,
    kpis: {
      averageWaitTime: filters.period === 'today' ? 45 : filters.period === 'week' ? 50 : 55,
      longestWaitTime: 120,
      shortestWaitTime: 5,
      averageTreatmentTime: 90,
      leftWithoutTreatment: Math.floor(totalPatients * 0.02),
      readmissionRate: 2.5,
      patientSatisfaction: 85
    },
    trends: {
      peakHours,
      topComplaints: [
        { complaint: 'Fever', count: Math.floor(totalPatients * 0.18) },
        { complaint: 'Chest Pain', count: Math.floor(totalPatients * 0.15) },
        { complaint: 'Difficulty Breathing', count: Math.floor(totalPatients * 0.13) },
        { complaint: 'Abdominal Pain', count: Math.floor(totalPatients * 0.11) },
        { complaint: 'Headache', count: Math.floor(totalPatients * 0.10) },
        { complaint: 'Trauma/Injury', count: Math.floor(totalPatients * 0.09) },
        { complaint: 'Nausea/Vomiting', count: Math.floor(totalPatients * 0.08) },
        { complaint: 'Back Pain', count: Math.floor(totalPatients * 0.07) },
        { complaint: 'Dizziness', count: Math.floor(totalPatients * 0.05) },
        { complaint: 'Rash', count: Math.floor(totalPatients * 0.04) }
      ],
      arrivalMode: {
        WALK_IN: Math.floor(totalPatients * 0.61),
        AMBULANCE: Math.floor(totalPatients * 0.27),
        PRIVATE_VEHICLE: Math.floor(totalPatients * 0.10),
        REFERRAL: Math.floor(totalPatients * 0.02)
      }
    }
  }
}

export default function TriageDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    period: 'today',
    hospitalId: 'all',
    dateFrom: '',
    dateTo: ''
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setUsingMockData(false)
      
      const params = new URLSearchParams({
        period: filters.period,
        hospitalId: filters.hospitalId,
        ...(filters.dateFrom && { startDate: filters.dateFrom }),
        ...(filters.dateTo && { endDate: filters.dateTo })
      })
      
      const response = await fetch(`/api/stats/triage?${params}`)
      
      if (!response.ok) {
        // If API doesn't exist (404) or fails, use mock data
        if (response.status === 404 || response.status >= 500) {
          console.warn('API endpoint not found or failed, using mock data')
          const mockData = generateMockDashboardData(filters)
          setDashboardData(mockData)
          setUsingMockData(true)
          setLastUpdated(new Date())
          setLoading(false)
          return
        }
        throw new Error(`Failed to fetch dashboard data: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setDashboardData(data.data || data)
        setUsingMockData(false)
        setLastUpdated(new Date())
      } else {
        setError(data.error || 'Failed to load dashboard data')
        // Fallback to mock data on API error
        const mockData = generateMockDashboardData(filters)
        setDashboardData(mockData)
        setUsingMockData(true)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to mock data on any error
      const mockData = generateMockDashboardData(filters)
      setDashboardData(mockData)
      setUsingMockData(true)
      setLastUpdated(new Date())
      // Don't show error if we have mock data
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'IMMEDIATE': return '#ef4444' // red
      case 'URGENT': return '#f97316' // orange
      case 'LESS_URGENT': return '#eab308' // yellow
      case 'NON_URGENT': return '#22c55e' // green
      default: return '#94a3b8' // slate
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return '#64748b'
      case 'IN_ASSESSMENT': return '#3b82f6'
      case 'IN_TREATMENT': return '#8b5cf6'
      case 'ADMITTED': return '#10b981'
      case 'DISCHARGED': return '#6366f1'
      default: return '#94a3b8'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mt-2">{error || 'No data available'}</p>
          <Button className="mt-4" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Prepare data for charts with proper typing and safe property access
  const priorityData: PriorityChartData[] = Object.entries(dashboardData!.summary.byPriority).map(([priority, data]) => ({
    name: PRIORITY_LABELS[priority] || priority,
    total: data.total,
    color: getPriorityColor(priority),
    value: data.total
  }))

  const statusData: StatusChartData[] = Object.entries(dashboardData!.summary.byStatus).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    color: getStatusColor(status)
  }))

  const peakHourData: PeakHourChartData[] = dashboardData!.trends.peakHours.map(hour => ({
    hour: `${hour.hour}:00`,
    total: hour.total,
    immediate: hour.immediate,
    urgent: hour.urgent
  }))

  const arrivalModeData: ArrivalModeChartData[] = Object.entries(dashboardData!.trends.arrivalMode).map(([mode, count], index) => ({
    name: mode.replace('_', ' '),
    value: count,
    fill: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index % 4]
  }))

  // Prepare data for department comparison chart with safe property access
  const departmentComparisonData: DepartmentComparisonData[] = dashboardData!.departments.map(dept => {
    // Safely access priority data with type assertions
    const immediateData = dept.byPriority.IMMEDIATE as PriorityData | undefined
    const urgentData = dept.byPriority.URGENT as PriorityData | undefined
    
    // Calculate waiting patients safely
    const waiting = Object.entries(dept.byPriority).reduce((acc, [, data]) => {
      const priorityData = data as PriorityData
      return acc + (priorityData.byStatus?.WAITING || 0)
    }, 0)

    return {
      name: dept.departmentName,
      patients: dept.total,
      occupancy: dept.bedUtilization.occupancyRate,
      critical: immediateData?.total || 0,
      urgent: urgentData?.total || 0,
      waiting
    }
  })

  // Prepare data for composite chart
  const compositeData: CompositeChartData[] = peakHourData.map(hour => ({
    ...hour,
    criticalPercentage: hour.immediate > 0 ? (hour.immediate / hour.total) * 100 : 0
  }))

  const PriorityIndicator = ({ priority, count }: { priority: string, count: number }) => (
    <div className="flex items-center gap-2">
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: getPriorityColor(priority) }}
      />
      <span className="text-sm">{PRIORITY_LABELS[priority] || priority}</span>
      <span className="font-semibold ml-auto">{count}</span>
    </div>
  )

  // Calculate insights with safe property access
  const peakHour = dashboardData!.trends.peakHours.reduce((a, b) => a.total > b.total ? a : b)
  const busiestDept = dashboardData!.departments.reduce((a, b) => a.total > b.total ? a : b)
  const highestOccupancy = dashboardData!.departments.reduce((a, b) => 
    a.bedUtilization.occupancyRate > b.bedUtilization.occupancyRate ? a : b
  )

  // Safely access immediate priority data
  const immediatePriorityData = dashboardData!.summary.byPriority.IMMEDIATE as PriorityData | undefined
  const immediateCount = immediatePriorityData?.total || 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Triage Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time monitoring and analysis of emergency operations
                {usingMockData && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Using Demo Data
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground hidden md:block">
              Last updated: {format(lastUpdated, 'HH:mm:ss')}
              {usingMockData && ' (Demo)'}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Dashboard Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time Period</span>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({...filters, period: e.target.value})}
                  className="text-sm border rounded-md px-3 py-1.5"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {filters.period === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="text-sm border rounded-md px-3 py-1.5"
                  />
                  <span className="self-center text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="text-sm border rounded-md px-3 py-1.5"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hospital</span>
                <select
                  value={filters.hospitalId}
                  onChange={(e) => setFilters({...filters, hospitalId: e.target.value})}
                  className="text-sm border rounded-md px-3 py-1.5"
                >
                  <option value="all">All Hospitals</option>
                  <option value="hosp-001">Main Hospital</option>
                  <option value="hosp-002">County Referral</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(dashboardData!.dateRange.start), 'MMM d, yyyy')} 
              {' → '}
              {format(new Date(dashboardData!.dateRange.end), 'MMM d, yyyy')}
              {usingMockData && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Demo
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{dashboardData!.summary.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Across {dashboardData!.departments.length} departments
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{dashboardData!.kpis.averageWaitTime}<span className="text-xl text-muted-foreground">m</span></div>
            <div className="flex items-center gap-2 mt-2">
              {dashboardData!.kpis.averageWaitTime > 60 ? (
                <Badge variant="destructive" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Above Target
                </Badge>
              ) : (
                <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  On Target
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">Target: ≤ 60m</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-red-600">
              {immediateCount}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-red-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${((immediateCount) / dashboardData!.summary.total) * 100}%` 
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {(((immediateCount) / dashboardData!.summary.total) * 100).toFixed(1)}% of total
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Left Without Treatment</CardTitle>
            <Activity className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{dashboardData!.kpis.leftWithoutTreatment}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${(dashboardData!.kpis.leftWithoutTreatment / dashboardData!.summary.total) * 100}%` 
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {(dashboardData!.kpis.leftWithoutTreatment / dashboardData!.summary.total * 100).toFixed(1)}% of total
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bed Occupancy</CardTitle>
            <Bed className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(dashboardData!.departments.reduce((acc, dept) => acc + dept.bedUtilization.occupancyRate, 0) / dashboardData!.departments.length)}%
            </div>
            <Progress 
              value={Math.round(dashboardData!.departments.reduce((acc, dept) => acc + dept.bedUtilization.occupancyRate, 0) / dashboardData!.departments.length)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Treatment Time</CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData!.kpis.averageTreatmentTime}<span className="text-sm text-muted-foreground">m</span></div>
            <Progress 
              value={(dashboardData!.kpis.averageTreatmentTime / 180) * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData!.kpis.patientSatisfaction}%</div>
            <Progress 
              value={dashboardData!.kpis.patientSatisfaction}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readmission Rate</CardTitle>
            <Target className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData!.kpis.readmissionRate}%</div>
            <Progress 
              value={dashboardData!.kpis.readmissionRate * 20}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Building2 className="w-4 h-4" />
            <span>Departments</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2 data-[state=active]:bg-background">
            <RechartsLineChart className="w-4 h-4" />
            <span>Trends</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Activity className="w-4 h-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center gap-2 data-[state=active]:bg-background">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Priority</span>
          </TabsTrigger>
          <TabsTrigger value="arrivals" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Ambulance className="w-4 h-4" />
            <span className="hidden sm:inline">Arrivals</span>
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Enhanced Priority Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Triage Priority Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of patients by triage priority level
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value} patients`, 'Count']}
                      labelFormatter={() => ''}
                    />
                    <Bar 
                      dataKey="total" 
                      name="Patients" 
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Enhanced Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Patient Status
                </CardTitle>
                <CardDescription>
                  Current status distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      label={(entry) => `${entry.name}: ${((entry.value / statusData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} patients`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Comparison - Horizontal Bar Chart */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Department Comparison
                </CardTitle>
                <CardDescription>
                  Patient volume and waiting cases by department
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentComparisonData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'patients') return [`${value} patients`, 'Total Patients']
                        if (name === 'waiting') return [`${value} patients`, 'Waiting']
                        if (name === 'critical') return [`${value} patients`, 'Critical Cases']
                        return [value, name]
                      }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="patients" name="Total Patients" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="waiting" name="Waiting" fill="#64748b" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="critical" name="Critical Cases" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData!.departments.map((dept) => {
              const DepartmentIcon = DEPARTMENT_ICONS[dept.departmentType] || Building2
              // Safely access priority data with type assertions
              const immediateData = dept.byPriority.IMMEDIATE as PriorityData | undefined
              
              return (
                <Card key={dept.departmentId} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <DepartmentIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dept.departmentName}</CardTitle>
                          <CardDescription className="capitalize">
                            {dept.departmentType.toLowerCase().replace('_', ' ')}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={
                        dept.bedUtilization.occupancyRate > 85 ? "destructive" :
                        dept.bedUtilization.occupancyRate > 70 ? "default" : "secondary"
                      } className="text-xs">
                        {dept.bedUtilization.occupancyRate.toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Patient Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{dept.total}</div>
                          <div className="text-sm text-blue-600 dark:text-blue-300">Total</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                            {immediateData?.total || 0}
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-300">Critical</div>
                        </div>
                      </div>

                      {/* Bed Status */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Bed Utilization</span>
                          <span className="font-semibold">
                            {dept.bedUtilization.availableBeds} / {dept.bedUtilization.totalBeds} available
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${dept.bedUtilization.occupancyRate}%`,
                              backgroundColor: dept.bedUtilization.occupancyRate > 85 ? '#ef4444' :
                                             dept.bedUtilization.occupancyRate > 70 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                      </div>

                      {/* Priority Breakdown */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Priority Breakdown</div>
                        {Object.entries(dept.byPriority).map(([priority, data]) => {
                          const priorityData = data as PriorityData
                          return (
                            <PriorityIndicator key={priority} priority={priority} count={priorityData.total} />
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Enhanced Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Enhanced Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Peak Hours Analysis
                </CardTitle>
                <CardDescription>
                  Patient arrivals by hour with critical case percentage
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={compositeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'criticalPercentage') return [`${value.toFixed(1)}%`, 'Critical %']
                        return [`${value}`, name]
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="Total Arrivals" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="immediate" 
                      name="Critical Cases" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ stroke: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Enhanced Arrival Modes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="w-5 h-5" />
                  Arrival Mode Distribution
                </CardTitle>
                <CardDescription>
                  How patients arrive at the facility
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={arrivalModeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${((entry.value / arrivalModeData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {arrivalModeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} patients`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Top Complaints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Top 10 Chief Complaints
              </CardTitle>
              <CardDescription>
                Most common reasons for seeking care with trend indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData!.trends.topComplaints.map((complaint, index) => {
                  const percentage = (complaint.count / dashboardData!.trends.topComplaints[0].count) * 100
                  return (
                    <div key={complaint.complaint} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{complaint.complaint}</div>
                        <div className="text-sm text-muted-foreground">
                          {complaint.count} cases • {((complaint.count / dashboardData!.summary.total) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-semibold w-16 text-right">{complaint.count}</span>
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Enhanced Wait Time Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Wait Time Performance
                </CardTitle>
                <CardDescription>Time metrics for patient care</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { 
                    label: 'Average Wait Time', 
                    value: dashboardData!.kpis.averageWaitTime,
                    unit: 'm',
                    target: 60, 
                    status: dashboardData!.kpis.averageWaitTime <= 60 ? 'good' : 'poor',
                    icon: Clock
                  },
                  { 
                    label: 'Longest Wait', 
                    value: dashboardData!.kpis.longestWaitTime,
                    unit: 'm',
                    target: 120, 
                    status: dashboardData!.kpis.longestWaitTime <= 120 ? 'good' : 'poor',
                    icon: AlertTriangle
                  },
                  { 
                    label: 'Avg Treatment Time', 
                    value: dashboardData!.kpis.averageTreatmentTime,
                    unit: 'm',
                    target: 90, 
                    status: dashboardData!.kpis.averageTreatmentTime <= 90 ? 'good' : 'poor',
                    icon: Activity
                  },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  const percentage = Math.min((metric.value / (metric.target * 1.5)) * 100, 100)
                  return (
                    <div key={index} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">{metric.label}</div>
                            <div className="text-sm text-muted-foreground">Target: ≤ {metric.target}{metric.unit}</div>
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${metric.status === 'good' ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.value}{metric.unit}
                        </div>
                      </div>
                      <Progress 
                        value={percentage}
                        className={`h-2 ${metric.status === 'good' ? '' : 'bg-red-100 [&>div]:bg-red-600'}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Current: {metric.value}{metric.unit}</span>
                        <span>Target: ≤ {metric.target}{metric.unit}</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Enhanced Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quality Metrics
                </CardTitle>
                <CardDescription>Patient care quality indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  { 
                    label: 'Left Without Treatment', 
                    value: dashboardData!.kpis.leftWithoutTreatment,
                    percentage: (dashboardData!.kpis.leftWithoutTreatment / dashboardData!.summary.total * 100),
                    target: 2, 
                    status: (dashboardData!.kpis.leftWithoutTreatment / dashboardData!.summary.total * 100) <= 2 ? 'good' : 'poor',
                    icon: XCircle
                  },
                  { 
                    label: 'Readmission Rate', 
                    value: dashboardData!.kpis.readmissionRate,
                    percentage: dashboardData!.kpis.readmissionRate,
                    unit: '%',
                    target: 5, 
                    status: dashboardData!.kpis.readmissionRate <= 5 ? 'good' : 'poor',
                    icon: RefreshCw
                  },
                  { 
                    label: 'Patient Satisfaction', 
                    value: dashboardData!.kpis.patientSatisfaction,
                    percentage: dashboardData!.kpis.patientSatisfaction,
                    unit: '%',
                    target: 80, 
                    status: dashboardData!.kpis.patientSatisfaction >= 80 ? 'good' : 'poor',
                    icon: Heart
                  },
                ] as QualityMetric[]).map((metric, index) => {
                  const Icon = metric.icon
                  const showPercentage = 'percentage' in metric
                  
                  return (
                    <div key={index} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">{metric.label}</div>
                            <div className="text-sm text-muted-foreground">
                              Target: {metric.label === 'Patient Satisfaction' ? '≥' : '≤'} {metric.target}{metric.unit || '%'}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${metric.status === 'good' ? 'text-green-600' : 'text-red-600'}`}>
                          {showPercentage ? (metric.percentage ?? 0).toFixed(1) : metric.value}{metric.unit || (showPercentage ? '%' : '')}
                        </div>
                      </div>
                      <Progress 
                        value={showPercentage ? (metric.percentage ?? 0) : metric.value}
                        max={metric.label === 'Patient Satisfaction' ? 100 : (metric.target * 2)}
                        className={`h-2 ${metric.status === 'good' ? '' : 'bg-red-100 [&>div]:bg-red-600'}`}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Department Efficiency Scatter Plot */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Department Efficiency
                </CardTitle>
                <CardDescription>Patient load vs. bed occupancy</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="patients" 
                      name="Patients" 
                      label={{ value: 'Patient Count', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="occupancy" 
                      name="Occupancy %" 
                      label={{ value: 'Bed Occupancy %', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis type="number" range={[50, 400]} dataKey="critical" name="Critical Cases" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'patients') return [`${value}`, 'Patients']
                        if (name === 'occupancy') return [`${value}%`, 'Occupancy']
                        if (name === 'critical') return [`${value}`, 'Critical Cases']
                        return [value, name]
                      }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Scatter 
                      name="Departments" 
                      data={departmentComparisonData} 
                      fill="#8884d8" 
                      shape="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Priority Analysis Tab */}
        <TabsContent value="priority" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution by Department</CardTitle>
                <CardDescription>How different priorities are distributed across departments</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentComparisonData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} patients`, name]}
                    />
                    <Legend />
                    <Bar dataKey="critical" name="Critical Cases" stackId="a" fill="#ef4444" />
                    <Bar dataKey="urgent" name="Urgent Cases" stackId="a" fill="#f97316" />
                    <Bar dataKey="patients" name="Other Cases" stackId="a" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Priority Trends</CardTitle>
                <CardDescription>Critical and urgent cases throughout the day</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={peakHourData}>
                    <defs>
                      <linearGradient id="colorImmediate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUrgent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} patients`, name]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="immediate" name="Critical Cases" stroke="#ef4444" fillOpacity={1} fill="url(#colorImmediate)" />
                    <Area type="monotone" dataKey="urgent" name="Urgent Cases" stroke="#f97316" fillOpacity={1} fill="url(#colorUrgent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Arrivals Tab */}
        <TabsContent value="arrivals" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Arrival Mode Analysis</CardTitle>
                <CardDescription>Detailed breakdown of patient arrival methods</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={arrivalModeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${((entry.value / arrivalModeData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {arrivalModeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} patients`, 'Count']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Arrival Statistics</CardTitle>
                <CardDescription>Key metrics about patient arrivals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {arrivalModeData.map((mode, index) => {
                    const totalArrivals = arrivalModeData.reduce((acc, curr) => acc + curr.value, 0)
                    const percentage = totalArrivals > 0 ? (mode.value / totalArrivals) * 100 : 0
                    return (
                      <div key={index} className="p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold">{mode.value}</div>
                        <div className="text-sm text-muted-foreground">{mode.name} Arrivals</div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: mode.fill
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Enhanced Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Peak Hours Identified
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Highest patient volume at <span className="font-semibold">{peakHour.hour}:00</span> with <span className="font-semibold">{peakHour.total}</span> arrivals.
                Consider adding 2 additional staff members during <span className="font-semibold">{peakHour.hour-1}:00-{peakHour.hour+1}:00</span>.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <div className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {dashboardData!.kpis.averageWaitTime > 60 ? 'Wait Time Alert' : 'Wait Time Status'}
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Average wait time is <span className="font-semibold">{dashboardData!.kpis.averageWaitTime}m</span>. 
                {dashboardData!.kpis.averageWaitTime > 60 ? 
                  ' This exceeds the 60-minute target. Consider process optimization and resource reallocation.' : 
                  ' Within acceptable range. Monitor for potential delays during peak hours.'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Resource Utilization
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                Overall bed occupancy is <span className="font-semibold">{
                  Math.round(dashboardData!.departments.reduce((acc, dept) => acc + dept.bedUtilization.occupancyRate, 0) / dashboardData!.departments.length)
                }%</span>. <span className="font-semibold">{busiestDept.departmentName}</span> has highest patient load ({busiestDept.total} patients). 
                <span className="font-semibold"> {highestOccupancy.departmentName}</span> has highest occupancy at {highestOccupancy.bedUtilization.occupancyRate.toFixed(1)}%.
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdated ? format(lastUpdated, 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                {usingMockData && ' • Using demo data for testing'}
              </div>
              <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}