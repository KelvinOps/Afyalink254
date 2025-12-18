'use client'

import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Eye, FileText, Clock, CheckCircle } from 'lucide-react'

const recentActivities = [
  {
    id: 1,
    type: 'Supply Request',
    number: 'SR-2024-045',
    department: 'Emergency',
    status: 'PENDING',
    amount: 450000,
    date: '2024-01-15',
    priority: 'HIGH',
  },
  {
    id: 2,
    type: 'Purchase Order',
    number: 'PO-2024-023',
    department: 'Pharmacy',
    status: 'APPROVED',
    amount: 1200000,
    date: '2024-01-14',
    priority: 'MEDIUM',
  },
  {
    id: 3,
    type: 'Supply Request',
    number: 'SR-2024-044',
    department: 'Laboratory',
    status: 'REJECTED',
    amount: 780000,
    date: '2024-01-13',
    priority: 'HIGH',
  },
  {
    id: 4,
    type: 'Purchase Order',
    number: 'PO-2024-022',
    department: 'ICU',
    status: 'DELIVERED',
    amount: 2300000,
    date: '2024-01-12',
    priority: 'CRITICAL',
  },
]

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
}

const priorityColors = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
}

export function ProcurementList() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-4">
      {recentActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getStatusIcon(activity.status)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">
                    {activity.number}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.department} • {formatCurrency(activity.amount)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              {/* Fixed: Removed variant and used className only for styling */}
              <Badge className={`${priorityColors[activity.priority as keyof typeof priorityColors]} mb-1`}>
                {activity.priority}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {formatDate(activity.date)}
              </p>
            </div>
            {/* Fixed: Removed variant and used className only for styling */}
            <Badge className={statusColors[activity.status as keyof typeof statusColors]}>
              {activity.status}
            </Badge>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}