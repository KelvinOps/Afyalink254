'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Input } from '@/app/components/ui/input'
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  Ambulance
} from 'lucide-react'

interface DispatchLog {
  id: string
  dispatchNumber: string
  callerPhone: string
  callerName: string
  location: string
  emergencyType: string
  severity: 'CRITICAL' | 'URGENT' | 'NON_URGENT'
  status: string
  assignedAmbulance?: string
  callReceived: string
  dispatched?: string
  arrivedOnScene?: string
  arrivedHospital?: string
  completed?: string
}

export default function DispatchLogsPage() {
  const [logs, setLogs] = useState<DispatchLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/dispatch?logs=true')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching dispatch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.callerPhone.includes(searchTerm) ||
      log.callerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.dispatchNumber.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'URGENT': return 'bg-orange-500'
      case 'NON_URGENT': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-500'
      case 'DISPATCHED': return 'bg-purple-500'
      case 'ON_SCENE': return 'bg-green-500'
      case 'TRANSPORTING': return 'bg-indigo-500'
      case 'COMPLETED': return 'bg-gray-500'
      case 'CANCELLED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const calculateResponseTime = (log: DispatchLog) => {
    if (!log.dispatched || !log.arrivedOnScene) return null
    
    const dispatched = new Date(log.dispatched)
    const arrived = new Date(log.arrivedOnScene)
    return Math.round((arrived.getTime() - dispatched.getTime()) / 60000) // minutes
  }

  const exportToCSV = () => {
    const headers = ['Dispatch Number', 'Caller', 'Phone', 'Location', 'Emergency Type', 'Severity', 'Status', 'Response Time (min)']
    const csvData = filteredLogs.map(log => [
      log.dispatchNumber,
      log.callerName || 'Unknown',
      log.callerPhone,
      log.location,
      log.emergencyType,
      log.severity,
      log.status,
      calculateResponseTime(log) || 'N/A'
    ])
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dispatch-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Logs</h1>
          <p className="text-muted-foreground">
            Historical record of all emergency dispatch activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone, name, location..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="RECEIVED">Received</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="ON_SCENE">On Scene</option>
                <option value="TRANSPORTING">Transporting</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => log.severity === 'CRITICAL').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                logs.reduce((acc, log) => {
                  const time = calculateResponseTime(log)
                  return acc + (time || 0)
                }, 0) / logs.filter(log => calculateResponseTime(log)).length
              ) || 0} min
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Ambulance className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => log.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dispatch History</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispatch #</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Emergency Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.dispatchNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.callerName || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{log.callerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {log.location}
                    </div>
                  </TableCell>
                  <TableCell>{log.emergencyType}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {calculateResponseTime(log) ? `${calculateResponseTime(log)} min` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(log.callReceived).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No dispatch logs found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}