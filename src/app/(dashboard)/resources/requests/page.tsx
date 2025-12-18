'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface SupplyRequest {
  id: string
  requestNumber: string
  items: Array<{
    name: string
    type: string
    quantity: number
    urgency: string
    estimatedCost: number
  }>
  totalEstimatedCost: number
  justification: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED'
  requestedBy: string
  requestedByRole: string
  approvedByHOD: boolean
  approvedByAdmin: boolean
  approvedByCounty: boolean
  requestedAt: string
  approvedAt?: string
  rejectedAt?: string
  orderedAt?: string
  deliveredAt?: string
}

export default function SupplyRequestsPage() {
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchRequestsData()
  }, [])

  const fetchRequestsData = async () => {
    try {
      const response = await fetch('/api/resources/requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching requests data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(request => 
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === '' || request.status === filterStatus)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'ORDERED': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      case 'ORDERED': return <Package className="w-4 h-4" />
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const statusOptions = ['PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'DELIVERED', 'CANCELLED']

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Supply Requests</h1>
          <p className="text-muted-foreground">
            Manage and track supply requests and procurement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRequestsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/resources/requests/new">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Link>
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
                  placeholder="Search requests..."
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
                    {status}
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
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(req => req.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter(req => req.status === 'APPROVED').length}
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
              {requests.filter(req => req.priority === 'CRITICAL').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{request.requestNumber}</h3>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>{request.justification}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="font-medium">Items: </span>
                      {request.items.length} items
                    </div>
                    <div>
                      <span className="font-medium">Total Cost: </span>
                      KES {request.totalEstimatedCost.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Requested By: </span>
                      {request.requestedBy} ({request.requestedByRole})
                    </div>
                    <div>
                      <span className="font-medium">Requested: </span>
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div className="flex gap-4 text-sm">
                    <div className={`flex items-center gap-1 ${
                      request.approvedByHOD ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      HOD: {request.approvedByHOD ? 'Approved' : 'Pending'}
                    </div>
                    <div className={`flex items-center gap-1 ${
                      request.approvedByAdmin ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      Admin: {request.approvedByAdmin ? 'Approved' : 'Pending'}
                    </div>
                    <div className={`flex items-center gap-1 ${
                      request.approvedByCounty ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      County: {request.approvedByCounty ? 'Approved' : 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/resources/requests/${request.id}`}>
                      View Details
                    </Link>
                  </Button>
                  {request.status === 'PENDING' && (
                    <>
                      <Button size="sm">Approve</Button>
                      <Button variant="destructive" size="sm">Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus 
                ? 'Try adjusting your search criteria' 
                : 'No supply requests have been created yet'
              }
            </p>
            <Button asChild>
              <Link href="/resources/requests/new">
                <Plus className="w-4 h-4 mr-2" />
                Create First Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}