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
  AlertTriangle,
  Calendar
} from 'lucide-react'

interface SupplyResource {
  id: string
  name: string
  type: string
  category: string
  department: string
  totalCapacity: number
  availableCapacity: number
  unit: string
  status: 'AVAILABLE' | 'LOW_STOCK' | 'CRITICAL' | 'DEPLETED'
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
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchSuppliesData()
  }, [])

  const fetchSuppliesData = async () => {
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
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === '' || item.status === filterStatus)
  )

  const getStockStatus = (item: SupplyResource) => {
    if (item.availableCapacity <= item.criticalLevel) return 'CRITICAL'
    if (item.availableCapacity <= item.reorderLevel) return 'LOW_STOCK'
    if (item.availableCapacity <= item.minimumLevel) return 'MINIMUM'
    return 'ADEQUATE'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'LOW_STOCK': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'DEPLETED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (item: SupplyResource) => {
    if (!item.expiryDate) return false
    const expiry = new Date(item.expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30
  }

  const statusOptions = ['AVAILABLE', 'LOW_STOCK', 'CRITICAL', 'DEPLETED']

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
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search supplies..."
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
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplies.length}</div>
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
          </CardContent>
        </Card>
      </div>

      {/* Supplies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupplies.map((item) => {
          const stockStatus = getStockStatus(item)
          const stockPercentage = (item.availableCapacity / item.totalCapacity) * 100
          
          return (
            <Card key={item.id} className={`relative ${
              stockStatus === 'CRITICAL' ? 'border-red-300 bg-red-50' : 
              stockStatus === 'LOW_STOCK' ? 'border-orange-300 bg-orange-50' : ''
            }`}>
              {stockStatus === 'CRITICAL' && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive">Critical</Badge>
                </div>
              )}
              {isExpiringSoon(item) && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    <Calendar className="w-3 h-3 mr-1" />
                    Expiring
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
                {/* Stock Level */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stock Level</span>
                    <span>{item.availableCapacity} {item.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        stockStatus === 'CRITICAL' ? 'bg-red-500' :
                        stockStatus === 'LOW_STOCK' ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${stockPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Min: {item.minimumLevel}</span>
                    <span>Reorder: {item.reorderLevel}</span>
                    <span>Critical: {item.criticalLevel}</span>
                  </div>
                </div>

                {/* Supplier Info */}
                {item.supplier && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Supplier</div>
                    <div>{item.supplier}</div>
                  </div>
                )}

                {/* Expiry Date */}
                {item.expiryDate && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Expiry Date</div>
                    <div className={isExpiringSoon(item) ? 'text-yellow-600 font-semibold' : ''}>
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Last Restock */}
                {item.lastRestock && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Last Restock</div>
                    <div>{new Date(item.lastRestock).toLocaleDateString()}</div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(item.lastUpdated).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSupplies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No supplies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus 
                ? 'Try adjusting your search criteria' 
                : 'No supply resources configured yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Add missing import
import Link from 'next/link'