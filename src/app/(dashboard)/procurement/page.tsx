// src/app/(dashboard)/procurement/page.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Badge } from '@/app/components/ui/badge'
import { 
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
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50">
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
              
              {/* Supply Requests Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SRQ-2024-001</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Radiology</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">X-ray films (50)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES 25,000</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">Pending HOD</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-15</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SRQ-2024-002</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Pharmacy</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Amoxicillin (1000)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES 45,000</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">Approved</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-14</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SRQ-2024-003</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Laboratory</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Reagents (20 boxes)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES 32,500</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">County Review</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-13</td>
                    </tr>
                  </tbody>
                </table>
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
              {/* Purchase Orders Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PO-2024-001</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MediSupplies Ltd</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Surgical masks (5000)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES 75,000</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">Delivered</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-10</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PO-2024-002</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PharmaCare Kenya</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">IV fluids (200)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES 120,000</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">In Transit</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-18</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PO-2024-003</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MedTech Solutions</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Patient monitors (5)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES 450,000</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">Processing</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-25</td>
                    </tr>
                  </tbody>
                </table>
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
              {/* Approval Queue Table */}
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">SRQ-2024-001</span>
                          <Badge variant="secondary">Radiology</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          X-ray films (50 units) • KES 25,000
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Requested by: Dr. Jane Smith • 2024-01-15
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="default">Approve</Button>
                      <Button size="sm" variant="outline">Reject</Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">SRQ-2024-003</span>
                          <Badge variant="secondary">Laboratory</Badge>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            County Approval
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Laboratory reagents (20 boxes) • KES 32,500
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Requested by: Dr. Michael Chen • 2024-01-13
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="default">Review</Button>
                  </div>
                </div>
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
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Monthly Procurement Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Requests</span>
                        <span className="font-medium">156</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Orders</span>
                        <span className="font-medium">89</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Value</span>
                        <span className="font-medium">KES 2.4M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Processing Time</span>
                        <span className="font-medium">3.5 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Department Spend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pharmacy</span>
                        <span className="font-medium">KES 850K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Laboratory</span>
                        <span className="font-medium">KES 620K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Radiology</span>
                        <span className="font-medium">KES 480K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Surgical</span>
                        <span className="font-medium">KES 450K</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Full Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}