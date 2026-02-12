// src/app/(dashboard)/resources/supplies/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  Package, 
  Plus, 
  Search, 
  RefreshCw,
  AlertTriangle,
  Calendar
} from 'lucide-react'

// Define proper types for supply status
type SupplyStatus = 'AVAILABLE' | 'LOW_STOCK' | 'CRITICAL' | 'DEPLETED'
type StockStatus = 'CRITICAL' | 'LOW_STOCK' | 'MINIMUM' | 'ADEQUATE'

interface SupplyResource {
  id: string
  name: string
  type: string
  category: string
  department: string
  totalCapacity: number
  availableCapacity: number
  unit: string
  status: SupplyStatus
  minimumLevel: number
  reorderLevel: number
  criticalLevel: number
  isCritical: boolean
  expiryDate?: string
  lastRestock?: string
  supplier?: string
  lastUpdated: string
}

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<SupplyResource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<SupplyStatus | ''>('')

  useEffect(() => {
    fetchSuppliesData()
  }, [])

  const fetchSuppliesData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/resources?type=MEDICATION,BLOOD_PRODUCT,PPE,SURGICAL_EQUIPMENT,LABORATORY_REAGENT,MEDICAL_SUPPLY')
      if (response.ok) {
        const data = await response.json()
        setSupplies(data.resources || [])
      }
    } catch (error) {
      console.error('Error fetching supplies data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSupplies = supplies.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStockStatus = (item: SupplyResource): StockStatus => {
    if (item.availableCapacity <= item.criticalLevel) return 'CRITICAL'
    if (item.availableCapacity <= item.reorderLevel) return 'LOW_STOCK'
    if (item.availableCapacity <= item.minimumLevel) return 'MINIMUM'
    return 'ADEQUATE'
  }

  const getStatusColor = (status: SupplyStatus): string => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200'
      case 'LOW_STOCK': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'DEPLETED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStockStatusColor = (status: StockStatus): string => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'LOW_STOCK': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MINIMUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ADEQUATE': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isExpiringSoon = (item: SupplyResource): boolean => {
    if (!item.expiryDate) return false
    const expiry = new Date(item.expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (item: SupplyResource): boolean => {
    if (!item.expiryDate) return false
    const expiry = new Date(item.expiryDate)
    const today = new Date()
    return expiry.getTime() < today.getTime()
  }

  const statusOptions: SupplyStatus[] = ['AVAILABLE', 'LOW_STOCK', 'CRITICAL', 'DEPLETED']

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-56 bg-gray-200 rounded animate-pulse"></div>
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

        {/* Supplies Grid Skeleton */}
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
          <h1 className="text-3xl font-bold tracking-tight">Supplies Management</h1>
          <p className="text-muted-foreground">
            Monitor medical supplies inventory and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSuppliesData}>
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
                  placeholder="Search by name, category, department, or supplier..."
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
                onChange={(e) => setFilterStatus(e.target.value as SupplyStatus | '')}
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
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <div className="h-4 w-4 bg-orange-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {supplies.filter(item => getStockStatus(item) === 'LOW_STOCK').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Below reorder level
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
              {supplies.filter(item => getStockStatus(item) === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Immediate action required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {supplies.filter(isExpiringSoon).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Within 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupplies.map((item) => {
          const stockStatus = getStockStatus(item)
          const stockPercentage = Math.min((item.availableCapacity / item.totalCapacity) * 100, 100)
          const expiringSoon = isExpiringSoon(item)
          const expired = isExpired(item)
          
          return (
            <Card 
              key={item.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                stockStatus === 'CRITICAL' ? 'border-red-300 bg-red-50/50' : 
                stockStatus === 'LOW_STOCK' ? 'border-orange-300 bg-orange-50/50' : 
                expired ? 'border-gray-300 bg-gray-50/50' : ''
              }`}
            >
              {/* Status Badges */}
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                {stockStatus === 'CRITICAL' && (
                  <Badge variant="destructive">Critical Stock</Badge>
                )}
                {stockStatus === 'LOW_STOCK' && (
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                    Low Stock
                  </Badge>
                )}
                {item.isCritical && (
                  <Badge variant="destructive">Critical Item</Badge>
                )}
              </div>
              
              {expiringSoon && !expired && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Calendar className="w-3 h-3 mr-1" />
                    Expires Soon
                  </Badge>
                </div>
              )}
              
              {expired && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expired
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
                {/* Stock Level */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Stock Level</span>
                    <span className="font-medium">
                      {item.availableCapacity} {item.unit} / {item.totalCapacity} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        stockStatus === 'CRITICAL' ? 'bg-red-500' :
                        stockStatus === 'LOW_STOCK' ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${stockPercentage}%` }}
                      role="progressbar"
                      aria-valuenow={stockPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Min: {item.minimumLevel}</span>
                    <span>Reorder: {item.reorderLevel}</span>
                    <span>Critical: {item.criticalLevel}</span>
                  </div>
                </div>

                {/* Stock Status Indicator */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stock Status</span>
                  <Badge className={`${getStockStatusColor(stockStatus)} border-0`}>
                    {stockStatus.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Supplier Info */}
                {item.supplier && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Supplier</span>
                    <div className="font-medium">{item.supplier}</div>
                  </div>
                )}

                {/* Expiry Date */}
                {item.expiryDate && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Expiry Date</span>
                    <div className={`font-medium ${
                      expired ? 'text-red-600' :
                      expiringSoon ? 'text-yellow-600' : ''
                    }`}>
                      {formatDate(item.expiryDate)}
                      {expired && ' (Expired)'}
                      {expiringSoon && !expired && ' (Expiring soon)'}
                    </div>
                  </div>
                )}

                {/* Last Restock */}
                {item.lastRestock && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Last Restock</span>
                    <div className="font-medium">{formatDate(item.lastRestock)}</div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground italic pt-2 border-t">
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
          )
        })}
      </div>

      {filteredSupplies.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No supplies found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {searchTerm || filterStatus 
                ? 'No supplies match your search criteria. Try adjusting your filters.'
                : 'No supply resources have been configured yet.'
              }
            </p>
            {(searchTerm || filterStatus) && (
              <Button 
                variant="outline" 
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