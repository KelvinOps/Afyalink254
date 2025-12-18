'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  Building, 
  Activity, 
  Users, 
  Ambulance, 
  Stethoscope, 
  BarChart3,
  Settings
} from 'lucide-react'

interface HospitalTabsProps {
  hospitalId: string
  activeTab: string
}

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Building,
    href: (id: string) => `/hospitals/${id}/overview`
  },
  {
    id: 'status',
    label: 'Status',
    icon: Activity,
    href: (id: string) => `/hospitals/${id}/status`
  },
  {
    id: 'capacity',
    label: 'Capacity',
    icon: Users,
    href: (id: string) => `/hospitals/${id}/capacity`
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: Stethoscope,
    href: (id: string) => `/hospitals/${id}/departments`
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: Ambulance,
    href: (id: string) => `/hospitals/${id}/emergency`
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: (id: string) => `/hospitals/${id}/analytics`
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: (id: string) => `/hospitals/${id}/settings`
  }
]

export function HospitalTabs({ hospitalId, activeTab }: HospitalTabsProps) {
  const pathname = usePathname()

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id || pathname.includes(tab.id)
          
          return (
            <Link key={tab.id} href={tab.href(hospitalId)} className="w-full">
              <TabsTrigger 
                value={tab.id} 
                className="w-full flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            </Link>
          )
        })}
      </TabsList>
    </Tabs>
  )
}