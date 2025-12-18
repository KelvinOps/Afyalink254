'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Badge } from '@/app/components/ui/badge'
import { 
  Package, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Download,
  Filter
} from 'lucide-react'
import { ProcurementStats } from '@/app/components/procurement/procurement-stats'
import { ProcurementList } from '@/app/components/procurement/procurement-list'
import { QuickActions } from '@/app/components/procurement/quick-actions'

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement Management</h1>
          <p className="text-muted-foreground">
            Manage hospital procurement, supply requests, and orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Supply Requests</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProcurementStats />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Procurement Activities</CardTitle>
                  <CardDescription>
                    Latest procurement requests and orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProcurementList />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <QuickActions />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Urgent Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pending HOD Approval</p>
                      <p className="text-sm text-muted-foreground">3 requests</p>
                    </div>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">County Approval Required</p>
                      <p className="text-sm text-muted-foreground">2 requests</p>
                    </div>
                    {/* Fixed: Changed variant from "warning" to "outline" with custom styling */}
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Supply Requests</CardTitle>
              <CardDescription>
                Manage all supply requests from departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
              {/* Supply requests table will be implemented here */}
              <div className="text-center py-8 text-muted-foreground">
                Supply requests table component
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                Track all purchase orders and deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Purchase orders table will be implemented here */}
              <div className="text-center py-8 text-muted-foreground">
                Purchase orders table component
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Approval Queue</CardTitle>
              <CardDescription>
                Review and approve procurement requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Approval queue table will be implemented here */}
              <div className="text-center py-8 text-muted-foreground">
                Approval queue table component
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Procurement Reports</CardTitle>
              <CardDescription>
                Generate procurement reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Reports component will be implemented here */}
              <div className="text-center py-8 text-muted-foreground">
                Reports and analytics component
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}