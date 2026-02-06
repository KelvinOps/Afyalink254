// /app/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/lib/utils'
import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Badge } from '@/app/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible'
import { useAuth } from '@/app/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  Ambulance,
  Stethoscope,
  Truck,
  BarChart3,
  Settings,
  FileText,
  Package,
  ShoppingCart,
  Video,
  Siren,
  UserCog,
  Building,
  ClipboardList,
  Shield,
  Heart,
  Bed,
  Microscope,
  Pill,
  MapPin,
  Clock,
  AlertTriangle,
  Bell,
  Database,
  Server,
  Network,
  PhoneCall,
  MessageCircle,
  Download,
  Upload,
  Archive,
  Search,
  Calendar,
  FileSearch,
  TrendingUp,
  Activity,
  Map,
  Radio,
  Car,
  Plane,
  ClipboardCheck,
  Calculator,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  X,
  LogOut,
  Plus
} from 'lucide-react'

// Define all user roles with their display names
const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  COUNTY_ADMIN: 'County Administrator',
  HOSPITAL_ADMIN: 'Hospital Administrator',
  DOCTOR: 'Medical Doctor',
  NURSE: 'Nursing Staff',
  TRIAGE_OFFICER: 'Triage Officer',
  DISPATCHER: 'Dispatch Coordinator',
  AMBULANCE_DRIVER: 'Ambulance Crew',
  AMBULANCE_CREW: 'Ambulance Crew',
  DISPATCH_COORDINATOR: 'Dispatch Coordinator',
  FINANCE_OFFICER: 'Finance Officer',
  LAB_TECHNICIAN: 'Lab Technician',
  PHARMACIST: 'Pharmacist',
  EMERGENCY_MANAGER: 'Emergency Manager'
}

// Enhanced navigation structure with role-based access control
// NOTE: Using ADMIN for all admin types since backend normalizes to ADMIN
const navigationStructure = {
  core: {
    name: 'Core Operations',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST', 'EMERGENCY_MANAGER'],
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST', 'EMERGENCY_MANAGER'],
        description: 'System overview and metrics'
      },
      {
        name: 'Triage',
        href: '/dashboard/triage',
        icon: Stethoscope,
        permission: 'triage.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'],
        description: 'Patient assessment and prioritization',
        subItems: [
          { name: 'Triage Queue', href: '/dashboard/triage/queue', icon: Clock, permission: 'triage.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] },
          { name: 'New Triage', href: '/dashboard/triage/new', icon: Plus, permission: 'triage.write', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] },
          { name: 'Triage History', href: '/dashboard/triage/history', icon: Clock, permission: 'triage.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] }
        ]
      },
      {
        name: 'Patients',
        href: '/dashboard/patients',
        icon: Users,
        permission: 'patients.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'],
        description: 'Patient management and records',
        subItems: [
          { name: 'Patient List', href: '/dashboard/patients', icon: FileText, permission: 'patients.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'] },
          { name: 'New Patient', href: '/dashboard/patients/new', icon: Plus, permission: 'patients.write', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] },
          { name: 'Patient Search', href: '/dashboard/patients/search', icon: Search, permission: 'patients.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'] }
        ]
      }
    ]
  },
  emergency: {
    name: 'Emergency Response',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'DOCTOR', 'EMERGENCY_MANAGER'],
    items: [
      {
        name: 'Dispatch Center',
        href: '/dashboard/dispatch',
        icon: Ambulance,
        permission: 'dispatch.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'EMERGENCY_MANAGER'],
        description: '999/911 emergency dispatch',
        subItems: [
          { name: 'Dispatch Board', href: '/dashboard/dispatch', icon: Map, permission: 'dispatch.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'EMERGENCY_MANAGER'] },
          { name: 'Live Map', href: '/dashboard/dispatch/map', icon: MapPin, permission: 'dispatch.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'EMERGENCY_MANAGER'] },
          { name: 'Ambulances', href: '/dashboard/dispatch/ambulances', icon: Truck, permission: 'ambulances.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'EMERGENCY_MANAGER'] },
          { name: 'New Dispatch', href: '/dashboard/dispatch/new', icon: Plus, permission: 'dispatch.write', roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'EMERGENCY_MANAGER'] }
        ]
      },
      {
        name: 'Emergencies',
        href: '/dashboard/emergencies',
        icon: Siren,
        permission: 'emergencies.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'EMERGENCY_MANAGER'],
        description: 'Active emergency incidents',
        subItems: [
          { name: 'Active Emergencies', href: '/dashboard/emergencies', icon: AlertTriangle, permission: 'emergencies.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'EMERGENCY_MANAGER'] },
          { name: 'Emergency History', href: '/dashboard/emergencies/history', icon: Clock, permission: 'emergencies.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'EMERGENCY_MANAGER'] }
        ]
      },
      {
        name: 'Transfers',
        href: '/dashboard/transfers',
        icon: Truck,
        permission: 'transfers.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW'],
        description: 'Inter-facility patient transfers',
        subItems: [
          { name: 'Transfer Requests', href: '/dashboard/transfers', icon: FileText, permission: 'transfers.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW'] },
          { name: 'New Transfer', href: '/dashboard/transfers/new', icon: Plus, permission: 'transfers.write', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] }
        ]
      }
    ]
  },
  clinical: {
    name: 'Clinical Services',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW'],
    items: [
      {
        name: 'Referrals',
        href: '/dashboard/referrals',
        icon: ClipboardList,
        permission: 'referrals.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW'],
        description: 'Inter-facility referrals',
        subItems: [
          { name: 'Referral List', href: '/dashboard/referrals', icon: FileText, permission: 'referrals.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW'] },
          { name: 'New Referral', href: '/dashboard/referrals/new', icon: Plus, permission: 'referrals.write', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] }
        ]
      },
      {
        name: 'Telemedicine',
        href: '/dashboard/telemedicine',
        icon: Video,
        permission: 'telemedicine.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
        description: 'Virtual consultations',
        subItems: [
          { name: 'Consultations', href: '/dashboard/telemedicine', icon: Video, permission: 'telemedicine.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
          { name: 'Schedule Session', href: '/dashboard/telemedicine/new', icon: Plus, permission: 'telemedicine.write', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] }
        ]
      }
    ]
  },
  resources: {
    name: 'Resources & Inventory',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
    items: [
      {
        name: 'Resources',
        href: '/dashboard/resources',
        icon: Package,
        permission: 'resources.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
        description: 'Medical equipment and supplies',
        subItems: [
          { name: 'Resource Inventory', href: '/dashboard/resources', icon: Package, permission: 'resources.read', roles: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'] },
          { name: 'Bed Management', href: '/dashboard/resources/beds', icon: Bed, permission: 'resources.read', roles: ['SUPER_ADMIN', 'ADMIN'] }
        ]
      },
      {
        name: 'Procurement',
        href: '/dashboard/procurement',
        icon: ShoppingCart,
        permission: 'procurement.read',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Supply chain management',
        subItems: [
          { name: 'Purchase Orders', href: '/dashboard/procurement', icon: ShoppingCart, permission: 'procurement.read', roles: ['SUPER_ADMIN', 'ADMIN'] },
          { name: 'New Order', href: '/dashboard/procurement/new', icon: Plus, permission: 'procurement.write', roles: ['SUPER_ADMIN', 'ADMIN'] }
        ]
      }
    ]
  },
  financial: {
    name: 'Financial Management',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'],
    items: [
      {
        name: 'SHA Claims',
        href: '/dashboard/sha-claims',
        icon: FileText,
        permission: 'claims.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'],
        description: 'Social Health Authority claims processing',
        subItems: [
          { name: 'Claims Dashboard', href: '/dashboard/sha-claims', icon: FileText, permission: 'claims.read', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'] },
          { name: 'New Claim', href: '/dashboard/sha-claims/new', icon: Plus, permission: 'claims.write', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'] }
        ]
      }
    ]
  },
  analytics: {
    name: 'Analytics & Reports',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'],
    items: [
      {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        permission: 'analytics.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'],
        description: 'Performance metrics and insights',
        subItems: [
          { name: 'Overview', href: '/dashboard/analytics', icon: BarChart3, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Reports', href: '/dashboard/analytics/reports', icon: FileText, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER'] }
        ]
      }
    ]
  },
  administration: {
    name: 'Administration',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        name: 'Staff Management',
        href: '/dashboard/staff',
        icon: UserCog,
        permission: 'staff.read',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Healthcare personnel management',
        subItems: [
          { name: 'Staff Directory', href: '/dashboard/staff', icon: Users, permission: 'staff.read', roles: ['SUPER_ADMIN', 'ADMIN'] }
        ]
      },
      {
        name: 'Hospitals',
        href: '/dashboard/hospitals',
        icon: Building,
        permission: 'hospitals.read',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Facility management and directory',
        subItems: [
          { name: 'Hospital Directory', href: '/dashboard/hospitals', icon: Building, permission: 'hospitals.read', roles: ['SUPER_ADMIN', 'ADMIN'] }
        ]
      },
      {
        name: 'System Settings',
        href: '/dashboard/settings',
        icon: Settings,
        permission: 'settings.read',
        roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST', 'EMERGENCY_MANAGER'],
        description: 'System configuration and preferences',
        subItems: [
          { name: 'Profile', href: '/dashboard/settings/profile', icon: Users, permission: 'settings.read', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'DISPATCH_COORDINATOR', 'AMBULANCE_DRIVER', 'AMBULANCE_CREW', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST', 'EMERGENCY_MANAGER'] }
        ]
      }
    ]
  },
  monitoring: {
    name: 'System Monitoring',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        name: 'System Health',
        href: '/dashboard/monitoring',
        icon: Activity,
        permission: 'monitoring.read',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'System performance monitoring',
        subItems: [
          { name: 'System Status', href: '/dashboard/monitoring', icon: Server, permission: 'monitoring.read', roles: ['SUPER_ADMIN', 'ADMIN'] },
          { name: 'Audit Logs', href: '/dashboard/monitoring/audit', icon: FileSearch, permission: 'monitoring.read', roles: ['SUPER_ADMIN', 'ADMIN'] }
        ]
      }
    ]
  }
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

// Enhanced role normalization function - MUST match backend normalization
const normalizeRole = (role: string): string => {
  if (!role) return 'UNKNOWN'
  
  const roleMap: Record<string, string> = {
    // Super Admin variations
    'super_admin': 'SUPER_ADMIN',
    'superadmin': 'SUPER_ADMIN',
    'SUPERADMIN': 'SUPER_ADMIN',
    
    // ADMIN variations - CRITICAL: All admin types normalize to ADMIN
    'administrator': 'ADMIN',
    'ADMINISTRATOR': 'ADMIN',
    'admin': 'ADMIN',
    'ADMIN': 'ADMIN',
    
    // County Admin variations - normalize to ADMIN
    'county_admin': 'ADMIN',
    'countyadmin': 'ADMIN',
    'COUNTYADMIN': 'ADMIN',
    'county_administrator': 'ADMIN',
    
    // Hospital Admin variations - normalize to ADMIN
    'hospital_admin': 'ADMIN',
    'hospitaladmin': 'ADMIN',
    'HOSPITALADMIN': 'ADMIN',
    'hospital_administrator': 'ADMIN',
    
    // Doctor variations
    'doctor': 'DOCTOR',
    'DOCTOR': 'DOCTOR',
    'medical_doctor': 'DOCTOR',
    'medicaldoctor': 'DOCTOR',
    
    // Nurse variations
    'nurse': 'NURSE',
    'NURSE': 'NURSE',
    'nursing_staff': 'NURSE',
    
    // Triage Officer variations
    'triage_officer': 'TRIAGE_OFFICER',
    'triageofficer': 'TRIAGE_OFFICER',
    'TRIAGE_OFFICER': 'TRIAGE_OFFICER',
    'TRIAGEOFFICER': 'TRIAGE_OFFICER',
    
    // Dispatcher variations
    'dispatcher': 'DISPATCHER',
    'DISPATCHER': 'DISPATCHER',
    'dispatch_coordinator': 'DISPATCH_COORDINATOR',
    'DISPATCH_COORDINATOR': 'DISPATCH_COORDINATOR',
    
    // Ambulance Driver/Crew variations
    'ambulance_driver': 'AMBULANCE_DRIVER',
    'ambulancedriver': 'AMBULANCE_DRIVER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'ambulance_crew': 'AMBULANCE_CREW',
    'AMBULANCE_CREW': 'AMBULANCE_CREW',
    
    // Finance Officer variations
    'finance_officer': 'FINANCE_OFFICER',
    'financeofficer': 'FINANCE_OFFICER',
    'FINANCE_OFFICER': 'FINANCE_OFFICER',
    
    // Lab Technician variations
    'lab_technician': 'LAB_TECHNICIAN',
    'labtechnician': 'LAB_TECHNICIAN',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    
    // Pharmacist variations
    'pharmacist': 'PHARMACIST',
    'PHARMACIST': 'PHARMACIST',
    
    // Emergency Manager variations
    'emergency_manager': 'EMERGENCY_MANAGER',
    'emergencymanager': 'EMERGENCY_MANAGER',
    'EMERGENCY_MANAGER': 'EMERGENCY_MANAGER'
  }

  const normalized = roleMap[role.toLowerCase()] || role.toUpperCase()
  console.log(`🔄 Sidebar role normalization: "${role}" → "${normalized}"`)
  return normalized
}

function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, hasPermission, logout } = useAuth()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    emergency: true,
    clinical: false,
    resources: false,
    financial: false,
    analytics: false,
    administration: false,
    monitoring: false
  })

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isOpen && onClose) {
      onClose()
    }
  }, [pathname])

  // Debug log user info
  useEffect(() => {
    if (user) {
      console.log('🔍 Sidebar User Info:', {
        email: user.email,
        role: user.role,
        normalizedRole: normalizeRole(user.role),
        permissionsCount: user.permissions?.length || 0,
        samplePermissions: user.permissions?.slice(0, 5)
      })
    }
  }, [user])

  if (!user) {
    return null
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Enhanced helper function to check if user has access to an item
  const hasAccess = (item: any): boolean => {
    if (!user) {
      console.log('❌ hasAccess: No user')
      return false
    }

    // Normalize the user's role for comparison
    const userNormalizedRole = normalizeRole(user.role)
    
    console.log(`🔐 Checking access for "${item.name}" - User role: ${userNormalizedRole}`)
    
    // SUPER_ADMIN has access to everything - bypass all checks
    if (userNormalizedRole === 'SUPER_ADMIN') {
      console.log(`✅ SUPER_ADMIN has access to "${item.name}"`)
      return true
    }
    
    // ADMIN has access to everything except SUPER_ADMIN-only items
    if (userNormalizedRole === 'ADMIN') {
      // Check if item has roles defined
      if (!item.roles || !Array.isArray(item.roles)) {
        console.log(`❌ "${item.name}" has no roles defined`)
        return false
      }
      
      const itemNormalizedRoles = item.roles.map((role: string) => normalizeRole(role))
      
      // ADMIN can access if ADMIN or SUPER_ADMIN is in allowed roles
      const hasRoleAccess = itemNormalizedRoles.includes('ADMIN') || itemNormalizedRoles.includes('SUPER_ADMIN')
      
      if (!hasRoleAccess) {
        console.log(`❌ ADMIN lacks role access to "${item.name}". Item roles:`, itemNormalizedRoles)
        return false
      }
      
      // Check permissions
      if (item.permission && !hasPermission(item.permission)) {
        console.log(`❌ ADMIN lacks permission "${item.permission}" for "${item.name}"`)
        return false
      }
      
      console.log(`✅ ADMIN has access to "${item.name}"`)
      return true
    }

    // For other roles, check normally
    if (!item.roles || !Array.isArray(item.roles)) {
      console.log(`❌ "${item.name}" has no roles defined`)
      return false
    }
    
    const itemNormalizedRoles = item.roles.map((role: string) => normalizeRole(role))

    // Check if user's role is allowed
    const hasRoleAccess = itemNormalizedRoles.includes(userNormalizedRole)
    if (!hasRoleAccess) {
      console.log(`❌ Role ${userNormalizedRole} not in allowed roles for "${item.name}":`, itemNormalizedRoles)
      return false
    }
    
    // Check if user has required permissions (only if role has access)
    if (item.permission && !hasPermission(item.permission)) {
      console.log(`❌ User lacks permission "${item.permission}" for "${item.name}"`)
      return false
    }
    
    console.log(`✅ User has access to "${item.name}"`)
    return true
  }

  const NavigationItem = ({ item, level = 0 }: { item: any; level?: number }) => {
    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
    const hasSubItems = item.subItems && item.subItems.length > 0
    const Icon = item.icon
    
    const filteredSubItems = hasSubItems 
      ? item.subItems.filter((subItem: any) => hasAccess(subItem))
      : []

    const shouldShowItem = hasAccess(item) || 
      (hasSubItems && filteredSubItems.length > 0)

    if (!shouldShowItem) {
      return null
    }

    return (
      <div className="space-y-1">
        {hasSubItems ? (
          <Collapsible
            open={expandedSections[item.name] || false}
            onOpenChange={() => toggleSection(item.name)}
            className="space-y-1"
          >
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg font-normal hover:bg-slate-100 hover:text-slate-900 transition-all duration-200",
                  isActive && "bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-500"
                  )} />
                  <span>{item.name}</span>
                </div>
                {filteredSubItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform text-slate-400",
                      expandedSections[item.name] && "rotate-180"
                    )}
                  />
                )}
              </button>
            </CollapsibleTrigger>
            
            {filteredSubItems.length > 0 && (
              <CollapsibleContent className="space-y-1 pl-4">
                {filteredSubItems.map((subItem: any) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-slate-100 group",
                      pathname === subItem.href
                        ? "bg-blue-50 text-blue-700 font-medium" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                    onClick={onClose}
                  >
                    <subItem.icon className={cn(
                      "h-4 w-4",
                      pathname === subItem.href ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    <span>{subItem.name}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            )}
          </Collapsible>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-slate-100 group",
              isActive 
                ? "bg-blue-50 text-blue-700 font-medium" 
                : "text-slate-600 hover:text-slate-900"
            )}
            onClick={onClose}
          >
            <Icon className={cn(
              "h-4 w-4",
              isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span>{item.name}</span>
          </Link>
        )}
      </div>
    )
  }

  // Filter sections based on user role
  const filteredSections = Object.entries(navigationStructure).filter(([sectionKey, section]) => {
    const userNormalizedRole = normalizeRole(user.role)
    
    console.log(`🔍 Checking section "${section.name}" for role ${userNormalizedRole}`)
    
    // SUPER_ADMIN sees all sections
    if (userNormalizedRole === 'SUPER_ADMIN') {
      console.log(`✅ SUPER_ADMIN has access to section "${section.name}"`)
      return true
    }
    
    // ADMIN sees all sections that allow ADMIN or SUPER_ADMIN
    if (userNormalizedRole === 'ADMIN') {
      const sectionNormalizedRoles = section.roles.map((role: string) => normalizeRole(role))
      const hasAccess = sectionNormalizedRoles.includes('ADMIN') || sectionNormalizedRoles.includes('SUPER_ADMIN')
      console.log(`${hasAccess ? '✅' : '❌'} ADMIN ${hasAccess ? 'has' : 'lacks'} access to section "${section.name}"`)
      return hasAccess
    }
    
    // For other roles
    const sectionNormalizedRoles = section.roles.map((role: string) => normalizeRole(role))
    const hasSectionAccess = sectionNormalizedRoles.includes(userNormalizedRole)
    
    console.log(`${hasSectionAccess ? '✅' : '❌'} ${userNormalizedRole} ${hasSectionAccess ? 'has' : 'lacks'} access to section "${section.name}"`)
    
    return hasSectionAccess
  })

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex h-full w-64 flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out",
        "fixed lg:static inset-y-0 left-0 z-50 transform",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Ambulance className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                NEH System
              </h2>
              <p className="text-xs text-slate-500 capitalize">
                {USER_ROLES[user.role as keyof typeof USER_ROLES] || user.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 ml-auto transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            {filteredSections.length === 0 ? (
              <div className="text-center p-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-sm text-slate-500">
                  No navigation items available for your role.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Role: {user.role}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Normalized: {normalizeRole(user.role)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Permissions: {user.permissions?.length || 0}
                </p>
              </div>
            ) : (
              filteredSections.map(([sectionKey, section]) => {
                const filteredItems = section.items.filter((item: any) => 
                  hasAccess(item) || 
                  (item.subItems && item.subItems.some((subItem: any) => hasAccess(subItem)))
                )

                if (filteredItems.length === 0) {
                  return null
                }

                return (
                  <div key={sectionKey} className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                      {section.name}
                    </h3>
                    <div className="space-y-1">
                      {filteredItems.map((item: any) => (
                        <NavigationItem key={item.href} item={item} />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer Section */}
        <div className="border-t border-slate-200 p-4 space-y-4">
          {/* Emergency Hotline */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Siren className="h-5 w-5 text-red-600" />
              <p className="text-sm font-semibold text-red-900">Emergency Hotline</p>
            </div>
            <p className="text-xl font-bold text-red-600">999 / 112</p>
            <p className="text-xs text-red-700">24/7 Dispatch Center</p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            {hasPermission('dispatch.write') && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/dispatch/new" onClick={onClose}>
                  <Ambulance className="h-4 w-4 mr-2" />
                  New Dispatch
                </Link>
              </Button>
            )}
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// Named export
export { Sidebar }

// Default export for compatibility
export default Sidebar