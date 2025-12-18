'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  Bed, 
  Stethoscope, 
  Package, 
  AlertTriangle, 
  Plus,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface ResourceStats {
  totalBeds: number
  availableBeds: number
  totalEquipment: number
  operationalEquipment: number
  totalSupplies: number
  lowStockSupplies: number
  criticalAlerts: number
}

interface ResourceAlert {
  id: string
  type: 'BED_SHORTAGE' | 'EQUIPMENT_MAINTENANCE' | 'SUPPLY_LOW' | 'CRITICAL'
  title: string
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  resourceId?: string
  createdAt: string
}

export default function ResourcesPage() {
  const [stats, setStats] = useState<ResourceStats>({
    totalBeds: 0,
    availableBeds: 0,
    totalEquipment: 0,
    operationalEquipment: 0,
    totalSupplies: 0,
    lowStockSupplies: 0,
    criticalAlerts: 0
  })
  const [alerts, setAlerts] = useState<ResourceAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResourceData()
  }, [])

  const fetchResourceData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch('/api/resources/stats'),
        fetch('/api/resources/alerts?severity=CRITICAL,HIGH')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching resource data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBedUtilization = () => {
    if (stats.totalBeds === 0) return 0
    return ((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100
  }

  const getEquipmentOperationalRate = () => {
    if (stats.totalEquipment === 0) return 0
    return (stats.operationalEquipment / stats.totalEquipment) * 100
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Resource Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage hospital resources, beds, equipment, and supplies
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/resources/requests/new">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bed Capacity</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.availableBeds}/{stats.totalBeds}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getBedUtilization().toFixed(1)}% utilization
              {getBedUtilization() > 80 ? (
                <TrendingUp className="h-3 w-3 ml-1 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 ml-1 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.operationalEquipment}/{stats.totalEquipment}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getEquipmentOperationalRate().toFixed(1)}% operational
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supplies</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSupplies}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.lowStockSupplies} items low stock
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalAlerts}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              Requires immediate attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="beds">Beds</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="supplies">Supplies</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your hospital resources efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="h-auto py-3">
                    <Link href="/resources/beds">
                      <Bed className="w-4 h-4 mr-2" />
                      Manage Beds
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto py-3">
                    <Link href="/resources/equipment">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Equipment
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto py-3">
                    <Link href="/resources/supplies">
                      <Package className="w-4 h-4 mr-2" />
                      Supplies
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto py-3">
                    <Link href="/resources/requests">
                      <Clock className="w-4 h-4 mr-2" />
                      Requests
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Critical Alerts</CardTitle>
                <CardDescription>
                  Issues requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No critical alerts at this time
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'
                        }`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{alert.title}</p>
                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {alerts.length > 3 && (
                  <Button variant="ghost" className="w-full mt-3" asChild>
                    <Link href="/resources/alerts">View All Alerts</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="beds">
          <Card>
            <CardHeader>
              <CardTitle>Bed Management</CardTitle>
              <CardDescription>
                Monitor bed capacity and availability across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bed Management</h3>
                <p className="text-muted-foreground mb-4">
                  Detailed bed management and capacity planning
                </p>
                <Button asChild>
                  <Link href="/resources/beds">Go to Bed Management</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Management</CardTitle>
              <CardDescription>
                Track medical equipment status and maintenance schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Equipment Management</h3>
                <p className="text-muted-foreground mb-4">
                  Medical equipment tracking and maintenance
                </p>
                <Button asChild>
                  <Link href="/resources/equipment">Go to Equipment</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplies">
          <Card>
            <CardHeader>
              <CardTitle>Supplies Management</CardTitle>
              <CardDescription>
                Monitor medical supplies inventory and stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Supplies Management</h3>
                <p className="text-muted-foreground mb-4">
                  Medical supplies inventory and stock management
                </p>
                <Button asChild>
                  <Link href="/resources/supplies">Go to Supplies</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Resource Alerts</CardTitle>
              <CardDescription>
                All resource-related alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Resource Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage all resource alerts
                </p>
                <Button asChild>
                  <Link href="/resources/alerts">View All Alerts</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}