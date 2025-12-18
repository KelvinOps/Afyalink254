'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  UserCheck
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'

// Mock data for approval queue
const approvalQueue = [
  {
    id: 'APV-001',
    requestNumber: 'SR-2024-015',
    type: 'SUPPLY_REQUEST',
    title: 'Emergency ICU Equipment',
    requestedBy: 'Dr. Sarah Chen',
    department: 'Intensive Care Unit',
    totalAmount: 1850000,
    priority: 'CRITICAL',
    currentStage: 'HOD_APPROVAL',
    daysInQueue: 2,
    urgency: 'HIGH',
  },
  {
    id: 'APV-002',
    requestNumber: 'SR-2024-016',
    type: 'SUPPLY_REQUEST',
    title: 'Laboratory Consumables',
    requestedBy: 'Dr. Michael Otieno',
    department: 'Pathology Lab',
    totalAmount: 450000,
    priority: 'MEDIUM',
    currentStage: 'ADMIN_APPROVAL',
    daysInQueue: 1,
    urgency: 'MEDIUM',
  },
  {
    id: 'APV-003',
    requestNumber: 'PO-2024-008',
    type: 'PURCHASE_ORDER',
    title: 'Pharmaceutical Supplies Q1',
    requestedBy: 'Pharmacy Department',
    department: 'Pharmacy',
    totalAmount: 3200000,
    priority: 'HIGH',
    currentStage: 'COUNTY_APPROVAL',
    daysInQueue: 5,
    urgency: 'HIGH',
  },
]

const stageLabels = {
  HOD_APPROVAL: 'HOD Approval',
  ADMIN_APPROVAL: 'Admin Approval',
  COUNTY_APPROVAL: 'County Approval',
  FINANCE_APPROVAL: 'Finance Approval',
  COMPLETED: 'Completed',
}

const priorityColors = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
}

const urgencyColors = {
  HIGH: 'bg-red-50 border-red-200',
  MEDIUM: 'bg-yellow-50 border-yellow-200',
  LOW: 'bg-blue-50 border-blue-200',
}

export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  const filteredApprovals = approvalQueue.filter(approval =>
    approval.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'MEDIUM':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <FileText className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Queue</h1>
          <p className="text-muted-foreground">
            Review and approve procurement requests and purchase orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected This Week</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>
                    Requests awaiting your review and approval
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search approvals..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Days in Queue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval) => (
                    <TableRow key={approval.id} className={urgencyColors[approval.urgency as keyof typeof urgencyColors]}>
                      <TableCell className="font-medium">
                        {approval.requestNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {approval.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {approval.title}
                      </TableCell>
                      <TableCell>{approval.requestedBy}</TableCell>
                      <TableCell>{approval.department}</TableCell>
                      <TableCell>{formatCurrency(approval.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={priorityColors[approval.priority as keyof typeof priorityColors]}>
                          {approval.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          {stageLabels[approval.currentStage as keyof typeof stageLabels]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getUrgencyIcon(approval.urgency)}
                          <span>{approval.daysInQueue} days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredApprovals.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending approvals found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
              <CardDescription>
                Previously approved procurement requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Approved requests table component
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
              <CardDescription>
                Requests that were not approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Rejected requests table component
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Approval Requests</CardTitle>
              <CardDescription>
                Complete history of all approval requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                All requests table component
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}