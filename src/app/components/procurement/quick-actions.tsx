'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Plus, FileText, Download, BarChart3 } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'New Supply Request',
      description: 'Create a new supply request',
      icon: Plus,
      variant: 'default' as const,
      onClick: () => console.log('New supply request'),
    },
    {
      title: 'Generate Report',
      description: 'Create procurement report',
      icon: FileText,
      variant: 'outline' as const,
      onClick: () => console.log('Generate report'),
    },
    {
      title: 'Export Data',
      description: 'Export procurement data',
      icon: Download,
      variant: 'outline' as const,
      onClick: () => console.log('Export data'),
    },
    {
      title: 'View Analytics',
      description: 'Procurement analytics dashboard',
      icon: BarChart3,
      variant: 'outline' as const,
      onClick: () => console.log('View analytics'),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Frequently used procurement actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start"
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.title}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}