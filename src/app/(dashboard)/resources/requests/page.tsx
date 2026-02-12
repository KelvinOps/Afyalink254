// src/app/(dashboard)/resources/requests/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Package, 
  Plus, 
  Search, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

// Define proper types for request items
interface RequestItem {
  name: string
  type: string
  quantity: number
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedCost: number
}

// Define proper union types for status and priority
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED'
type RequestPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface SupplyRequest {
  id: string
  requestNumber: string
  items: RequestItem[]
  totalEstimatedCost: number
  justification: string
  priority: RequestPriority
  status: RequestStatus
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
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('')

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
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.justification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: RequestStatus): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'ORDERED': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: RequestPriority): string => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      case 'ORDERED': return <Package className="w-4 h-4" />
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const statusOptions: RequestStatus[] = [
    'PENDING', 
    'APPROVED', 
    'REJECTED', 
    'ORDERED', 
    'DELIVERED', 
    'CANCELLED'
  ]

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
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

        {/* Requests List Skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Supply Requests</h1>
          <p className="text-muted-foreground">
            Manage and track supply requests and procurement approvals
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
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by request number, justification, or item name..."
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
                onChange={(e) => setFilterStatus(e.target.value as RequestStatus | '')}
                aria-label="Filter by status"
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
            <p className="text-xs text-muted-foreground mt-1">
              Total value: {formatCurrency(requests.reduce((sum, req) => sum + req.totalEstimatedCost, 0))}
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Ready for ordering
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
              {requests.filter(req => req.priority === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  {/* Header with ID and Badges */}
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-lg">{request.requestNumber}</h3>
                    <Badge className={`${getPriorityColor(request.priority)} border-0`}>
                      {request.priority}
                    </Badge>
                    <Badge className={`${getStatusColor(request.status)} border-0`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </Badge>
                  </div>
                  
                  {/* Justification */}
                  <div className="text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-700">Justification: </span>
                    <span className="text-gray-600">{request.justification}</span>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Requested Items:</div>
                    <div className="flex flex-wrap gap-2">
                      {request.items.slice(0, 3).map((item, index) => (
                        <Badge key={index} variant="outline" className="bg-white">
                          {item.name} ({item.quantity}) - {formatCurrency(item.estimatedCost)}
                        </Badge>
                      ))}
                      {request.items.length > 3 && (
                        <Badge variant="outline" className="bg-gray-50">
                          +{request.items.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Total Cost</span>
                      <span className="font-medium">{formatCurrency(request.totalEstimatedCost)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Requested By</span>
                      <span className="font-medium">{request.requestedBy}</span>
                      <span className="text-xs text-muted-foreground block">{request.requestedByRole}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Requested Date</span>
                      <span className="font-medium">{formatDate(request.requestedAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total Items</span>
                      <span className="font-medium">{request.items.length} items</span>
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Approval Progress:</div>
                    <div className="flex flex-wrap gap-4">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                        request.approvedByHOD 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          request.approvedByHOD ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        HOD: {request.approvedByHOD ? 'Approved' : 'Pending'}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                        request.approvedByAdmin 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          request.approvedByAdmin ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        Admin: {request.approvedByAdmin ? 'Approved' : 'Pending'}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                        request.approvedByCounty 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          request.approvedByCounty ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        County: {request.approvedByCounty ? 'Approved' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex lg:flex-col gap-2 lg:min-w-[120px]">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/resources/requests/${request.id}`}>
                      View Details
                    </Link>
                  </Button>
                  {request.status === 'PENDING' && (
                    <>
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm" className="w-full">
                        Reject
                      </Button>
                    </>
                  )}
                  {request.status === 'APPROVED' && (
                    <Button size="sm" className="w-full">
                      Create Order
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {searchTerm || filterStatus 
                ? 'No requests match your search criteria. Try adjusting your filters.'
                : 'No supply requests have been created yet. Create your first request to get started.'
              }
            </p>
            {(searchTerm || filterStatus) ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('')
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/resources/requests/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Request
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}