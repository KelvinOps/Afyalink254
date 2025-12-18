'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'

// Mock data for supply requests
const supplyRequests = [
  {
    id: 'REQ-001',
    requestNumber: 'SR-2024-001',
    items: ['IV Fluids', 'Syringes', 'PPE Kits'],
    totalEstimatedCost: 150000,
    priority: 'HIGH',
    status: 'PENDING',
    requestedBy: 'Dr. Jane Smith',
    requestedByRole: 'Head of Emergency',
    approvedByHOD: false,
    approvedByAdmin: false,
    approvedByCounty: false,
    requestedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'REQ-002',
    requestNumber: 'SR-2024-002',
    items: ['Lab Reagents', 'Test Tubes'],
    totalEstimatedCost: 75000,
    priority: 'MEDIUM',
    status: 'APPROVED',
    requestedBy: 'Dr. John Doe',
    requestedByRole: 'Lab Director',
    approvedByHOD: true,
    approvedByAdmin: true,
    approvedByCounty: false,
    requestedAt: '2024-01-14T14:20:00Z',
  },
  {
    id: 'REQ-003',
    requestNumber: 'SR-2024-003',
    items: ['Oxygen Cylinders', 'Ventilator Parts'],
    totalEstimatedCost: 450000,
    priority: 'CRITICAL',
    status: 'REJECTED',
    requestedBy: 'Nurse Mary Johnson',
    requestedByRole: 'ICU Supervisor',
    approvedByHOD: true,
    approvedByAdmin: false,
    approvedByCounty: false,
    requestedAt: '2024-01-13T09:15:00Z',
  },
]

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ORDERED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
}

const priorityColors = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
}

export default function SupplyRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRequests = supplyRequests.filter(request =>
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supply Requests</h1>
          <p className="text-muted-foreground">
            Manage and track all supply requests from hospital departments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Supply Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Supply Requests</CardTitle>
              <CardDescription>
                View, manage, and track the status of supply requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Approvals</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.requestNumber}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="text-sm line-clamp-2">
                        {request.items.join(', ')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(request.totalEstimatedCost)}</TableCell>
                  <TableCell>
                    <Badge className={priorityColors[request.priority as keyof typeof priorityColors]}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.requestedBy}</p>
                      <p className="text-sm text-muted-foreground">{request.requestedByRole}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(request.requestedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={request.approvedByHOD ? "default" : "outline"} className="h-6">
                        HOD
                      </Badge>
                      <Badge variant={request.approvedByAdmin ? "default" : "outline"} className="h-6">
                        Admin
                      </Badge>
                      <Badge variant={request.approvedByCounty ? "default" : "outline"} className="h-6">
                        County
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No supply requests found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}