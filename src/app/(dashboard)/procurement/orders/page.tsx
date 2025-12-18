'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText // Added FileText import
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

// Mock data for purchase orders
const purchaseOrders = [
  {
    id: 'PO-001',
    procurementNumber: 'PO-2024-001',
    procurementType: 'MEDICAL_EQUIPMENT',
    items: ['Patient Monitors', 'Defibrillators'],
    totalValue: 2500000,
    supplierName: 'MedTech Supplies Ltd',
    deliveryStatus: 'DELIVERED',
    paymentStatus: 'PAID',
    expectedDeliveryDate: '2024-01-20T00:00:00Z',
    actualDeliveryDate: '2024-01-18T00:00:00Z',
    status: 'COMPLETED',
  },
  {
    id: 'PO-002',
    procurementNumber: 'PO-2024-002',
    procurementType: 'PHARMACEUTICALS',
    items: ['Antibiotics', 'Analgesics', 'IV Fluids'],
    totalValue: 850000,
    supplierName: 'PharmaDist KE',
    deliveryStatus: 'IN_TRANSIT',
    paymentStatus: 'PENDING',
    expectedDeliveryDate: '2024-01-25T00:00:00Z',
    actualDeliveryDate: null,
    status: 'CONTRACTED',
  },
  {
    id: 'PO-003',
    procurementNumber: 'PO-2024-003',
    procurementType: 'LABORATORY_SUPPLIES',
    items: ['Lab Reagents', 'Microscopes'],
    totalValue: 1200000,
    supplierName: 'LabEquip Africa',
    deliveryStatus: 'PENDING',
    paymentStatus: 'PENDING',
    expectedDeliveryDate: '2024-02-01T00:00:00Z',
    actualDeliveryDate: null,
    status: 'AWARDED',
  },
]

const statusColors = {
  INITIATED: 'bg-gray-100 text-gray-800',
  TENDER_ISSUED: 'bg-blue-100 text-blue-800',
  EVALUATION: 'bg-yellow-100 text-yellow-800',
  AWARDED: 'bg-purple-100 text-purple-800',
  CONTRACTED: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const deliveryStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  PARTIAL_DELIVERY: 'bg-orange-100 text-orange-800',
  DELAYED: 'bg-red-100 text-red-800',
}

const paymentStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-800',
  OVERDUE: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-purple-100 text-purple-800',
}

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOrders = purchaseOrders.filter(order =>
    order.procurementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'IN_TRANSIT':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'DELAYED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Track and manage all purchase orders and deliveries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Delivery</p>
                <p className="text-2xl font-bold">8</p>
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
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered This Month</p>
                <p className="text-2xl font-bold">11</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                Monitor all purchase orders and their delivery status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.procurementNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.procurementType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="text-sm line-clamp-2">
                        {order.items.join(', ')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalValue)}</TableCell>
                  <TableCell>{order.supplierName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeliveryStatusIcon(order.deliveryStatus)}
                      <Badge className={deliveryStatusColors[order.deliveryStatus as keyof typeof deliveryStatusColors]}>
                        {order.deliveryStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors]}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(order.expectedDeliveryDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {order.status}
                    </Badge>
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
                          <Truck className="h-4 w-4 mr-2" />
                          Update Delivery
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download PO
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No purchase orders found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}