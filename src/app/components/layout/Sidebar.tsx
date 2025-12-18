// src/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Badge } from '../../components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible'
import { useAuth } from '../../contexts/AuthContext'
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
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  Group,
  Target,
  PieChart,
  BarChart,
  LineChart,
  GitBranch,
  Cpu,
  HardDrive,
  Cloud,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Power,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Info,
  Lock,
  Unlock,
  UserPlus,
  Users as UsersIcon,
  UserMinus,
  UserCheck,
  UserX,
  Star,
  Award,
  Trophy,
  Medal,
  Crown,
  Flag,
  Home,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Inbox,
  BellRing,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Video as VideoIcon,
  VideoOff,
  Headphones,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Printer,
  Scan,
  QrCode,
  Barcode,
  CreditCard,
  DollarSign,
  Coins,
  Wallet,
  Receipt,
  FileDigit,
  Hash,
  Percent,
  Plus,
  Minus,
  X,
  Equal,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Move,
  RotateCw,
  RefreshCw,
  Loader,
  AlertOctagon,
  BellOff,
  Circle,
  Square,
  Triangle,
  Octagon,
  Hexagon,
  Pentagon,
  LogOut
} from 'lucide-react'

// Enhanced navigation structure with role-based access control
const navigationStructure = {
  core: {
    name: 'Core Operations',
    roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'AMBULANCE_DRIVER', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'],
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'AMBULANCE_DRIVER', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'],
        description: 'System overview and metrics'
      },
      {
        name: 'Triage',
        href: '/triage',
        icon: Stethoscope,
        permission: 'triage.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'],
        description: 'Patient assessment and prioritization',
        subItems: [
          { name: 'Triage Queue', href: '/triage/queue', icon: Clock, permission: 'triage.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] },
          { name: 'New Triage', href: '/triage/new', icon: UserPlus, permission: 'triage.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] },
          { name: 'Triage History', href: '/triage/history', icon: Clock, permission: 'triage.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] }
        ]
      },
      {
        name: 'Patients',
        href: '/patients',
        icon: Users,
        permission: 'patients.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'],
        description: 'Patient management and records',
        subItems: [
          { name: 'Patient List', href: '/patients', icon: FileText, permission: 'patients.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'] },
          { name: 'New Patient', href: '/patients/new', icon: UserPlus, permission: 'patients.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] },
          { name: 'Patient Search', href: '/patients/search', icon: Search, permission: 'patients.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'] },
          { name: 'Medical History', href: '/patients/history', icon: FileText, permission: 'patients.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] },
          { name: 'SHA Verification', href: '/patients/verify-sha', icon: ShieldCheck, permission: 'patients.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER'] }
        ]
      }
    ]
  },
  emergency: {
    name: 'Emergency Response',
    roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER', 'AMBULANCE_DRIVER', 'DOCTOR'],
    items: [
      {
        name: 'Dispatch Center',
        href: '/dispatch',
        icon: Ambulance,
        permission: 'dispatch.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER', 'AMBULANCE_DRIVER'],
        description: '999/911 emergency dispatch',
        subItems: [
          { name: 'Dispatch Board', href: '/dispatch', icon: Map, permission: 'dispatch.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER', 'AMBULANCE_DRIVER'] },
          { name: 'Live Map', href: '/dispatch/live-map', icon: MapPin, permission: 'dispatch.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] },
          { name: 'Ambulances', href: '/dispatch/ambulances', icon: Truck, permission: 'ambulances.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] },
          { name: 'Dispatch Logs', href: '/dispatch/logs', icon: FileText, permission: 'dispatch.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] },
          { name: 'Emergency Calls', href: '/dispatch/calls', icon: PhoneCall, permission: 'dispatch.write', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] }
        ]
      },
      {
        name: 'Transfers',
        href: '/transfers',
        icon: Truck,
        permission: 'transfers.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
        description: 'Inter-facility patient transfers',
        subItems: [
          { name: 'Transfer Requests', href: '/transfers', icon: FileText, permission: 'transfers.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'New Transfer', href: '/transfers/new', icon: Plus, permission: 'transfers.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'Incoming Transfers', href: '/transfers/incoming', icon: Download, permission: 'transfers.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'Outgoing Transfers', href: '/transfers/outgoing', icon: Upload, permission: 'transfers.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'Bed Availability', href: '/transfers/beds', icon: Bed, permission: 'transfers.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] }
        ]
      },
      {
        name: 'Emergencies',
        href: '/emergencies',
        icon: Siren,
        permission: 'emergencies.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'],
        description: 'Mass casualty and disaster management',
        subItems: [
          { name: 'Active Emergencies', href: '/emergencies/active', icon: AlertTriangle, permission: 'emergencies.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] },
          { name: 'New Emergency', href: '/emergencies/new', icon: Plus, permission: 'emergencies.write', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] },
          { name: 'Command Center', href: '/emergencies/command', icon: Radio, permission: 'emergencies.write', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] },
          { name: 'Resource Mobilization', href: '/emergencies/resources', icon: Package, permission: 'emergencies.write', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'] }
        ]
      }
    ]
  },
  clinical: {
    name: 'Clinical Services',
    roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'],
    items: [
      {
        name: 'Referrals',
        href: '/referrals',
        icon: ClipboardList,
        permission: 'referrals.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
        description: 'Inter-facility referrals',
        subItems: [
          { name: 'Referral List', href: '/referrals', icon: FileText, permission: 'referrals.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'New Referral', href: '/referrals/new', icon: Plus, permission: 'referrals.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'Incoming Referrals', href: '/referrals/incoming', icon: Download, permission: 'referrals.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'Outgoing Referrals', href: '/referrals/outgoing', icon: Upload, permission: 'referrals.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] }
        ]
      },
      {
        name: 'Telemedicine',
        href: '/telemedicine',
        icon: Video,
        permission: 'telemedicine.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
        description: 'Remote consultations and care',
        subItems: [
          { name: 'Sessions', href: '/telemedicine/sessions', icon: VideoIcon, permission: 'telemedicine.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'New Session', href: '/telemedicine/sessions/new', icon: Plus, permission: 'telemedicine.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'Schedule', href: '/telemedicine/schedule', icon: Calendar, permission: 'telemedicine.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
          { name: 'Video Call', href: '/telemedicine/call', icon: PhoneCall, permission: 'telemedicine.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] }
        ]
      }
    ]
  },
  resources: {
    name: 'Resources & Inventory',
    roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'],
    items: [
      {
        name: 'Resources',
        href: '/resources',
        icon: Package,
        permission: 'resources.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'],
        description: 'Medical equipment and supplies',
        subItems: [
          { name: 'Resource Inventory', href: '/resources', icon: Package, permission: 'resources.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'] },
          { name: 'Bed Management', href: '/resources/beds', icon: Bed, permission: 'resources.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Equipment Status', href: '/resources/equipment', icon: Cpu, permission: 'resources.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Supplies', href: '/resources/supplies', icon: Pill, permission: 'resources.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'] },
          { name: 'Stock Alerts', href: '/resources/alerts', icon: Bell, permission: 'resources.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'] },
          { name: 'New Request', href: '/resources/requests/new', icon: Plus, permission: 'resources.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] }
        ]
      },
      {
        name: 'Procurement',
        href: '/procurement',
        icon: ShoppingCart,
        permission: 'procurement.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'],
        description: 'Supply chain and purchasing',
        subItems: [
          { name: 'Procurement Dashboard', href: '/procurement', icon: ShoppingCart, permission: 'procurement.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Purchase Requests', href: '/procurement/requests', icon: FileText, permission: 'procurement.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Purchase Orders', href: '/procurement/orders', icon: FileDigit, permission: 'procurement.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Approvals', href: '/procurement/approvals', icon: ShieldCheck, permission: 'procurement.write', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] }
        ]
      }
    ]
  },
  financial: {
    name: 'Financial Management',
    roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'],
    items: [
      {
        name: 'SHA Claims',
        href: '/sha-claims',
        icon: FileText,
        permission: 'claims.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'],
        description: 'Social Health Authority claims processing',
        subItems: [
          { name: 'Claims Dashboard', href: '/sha-claims', icon: FileText, permission: 'claims.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'New Claim', href: '/sha-claims/new', icon: Plus, permission: 'claims.write', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Pending Claims', href: '/sha-claims/pending', icon: Clock, permission: 'claims.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Approved Claims', href: '/sha-claims/approved', icon: CheckCircle, permission: 'claims.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Rejected Claims', href: '/sha-claims/rejected', icon: XCircle, permission: 'claims.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Claim Analytics', href: '/sha-claims/analytics', icon: BarChart, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] }
        ]
      }
    ]
  },
  analytics: {
    name: 'Analytics & Reports',
    roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'],
    items: [
      {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        permission: 'analytics.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'],
        description: 'Performance metrics and insights',
        subItems: [
          { name: 'Overview', href: '/analytics', icon: BarChart3, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Hospital Analytics', href: '/analytics/hospital', icon: Building, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'County Analytics', href: '/analytics/county', icon: MapPin, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN'] },
          { name: 'National Analytics', href: '/analytics/national', icon: MapPin, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN'] },
          { name: 'Performance Metrics', href: '/analytics/metrics', icon: TrendingUp, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] }
        ]
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: FileSearch,
        permission: 'analytics.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'],
        description: 'Generate and export reports',
        subItems: [
          { name: 'Report Generator', href: '/reports/generate', icon: FileSearch, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Export Data', href: '/reports/export', icon: Download, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'FINANCE_OFFICER'] },
          { name: 'Custom Reports', href: '/reports/custom', icon: Settings, permission: 'analytics.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] }
        ]
      }
    ]
  },
  administration: {
    name: 'Administration',
    roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'],
    items: [
      {
        name: 'Staff Management',
        href: '/staff',
        icon: UserCog,
        permission: 'staff.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'],
        description: 'Healthcare personnel management',
        subItems: [
          { name: 'Staff Directory', href: '/staff', icon: UsersIcon, permission: 'staff.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'New Staff', href: '/staff/new', icon: UserPlus, permission: 'staff.write', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Shift Schedule', href: '/staff/schedule', icon: Calendar, permission: 'staff.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Workload Management', href: '/staff/workload', icon: Activity, permission: 'staff.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] }
        ]
      },
      {
        name: 'Hospitals',
        href: '/hospitals',
        icon: Building,
        permission: 'hospitals.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'],
        description: 'Facility management and directory',
        subItems: [
          { name: 'Hospital Directory', href: '/hospitals', icon: Building, permission: 'hospitals.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Hospital Details', href: '/hospitals/[id]', icon: Info, permission: 'hospitals.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Departments', href: '/hospitals/[id]/departments', icon: GitBranch, permission: 'hospitals.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Capacity Overview', href: '/hospitals/[id]/overview', icon: BarChart, permission: 'hospitals.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] }
        ]
      },
      {
        name: 'System Settings',
        href: '/settings',
        icon: Settings,
        permission: 'settings.read',
        roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'AMBULANCE_DRIVER', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'],
        description: 'System configuration and preferences',
        subItems: [
          { name: 'Profile', href: '/settings/profile', icon: Users, permission: 'settings.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'AMBULANCE_DRIVER', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'] },
          { name: 'Facility Settings', href: '/settings/facility', icon: Building, permission: 'settings.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN'] },
          { name: 'Notifications', href: '/settings/notifications', icon: Bell, permission: 'settings.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'AMBULANCE_DRIVER', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'] },
          { name: 'Security', href: '/settings/security', icon: Shield, permission: 'settings.read', roles: ['SUPER_ADMIN', 'COUNTY_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'TRIAGE_OFFICER', 'DISPATCHER', 'AMBULANCE_DRIVER', 'FINANCE_OFFICER', 'LAB_TECHNICIAN', 'PHARMACIST'] },
          { name: 'System Configuration', href: '/settings/system', icon: Server, permission: '*', roles: ['SUPER_ADMIN'] }
        ]
      }
    ]
  },
  monitoring: {
    name: 'System Monitoring',
    roles: ['SUPER_ADMIN'],
    items: [
      {
        name: 'System Health',
        href: '/monitoring',
        icon: Activity,
        permission: '*',
        roles: ['SUPER_ADMIN'],
        description: 'System performance and status',
        subItems: [
          { name: 'Dashboard', href: '/monitoring', icon: Activity, permission: '*', roles: ['SUPER_ADMIN'] },
          { name: 'API Status', href: '/monitoring/api', icon: Server, permission: '*', roles: ['SUPER_ADMIN'] },
          { name: 'Database', href: '/monitoring/database', icon: Database, permission: '*', roles: ['SUPER_ADMIN'] },
          { name: 'Real-time Logs', href: '/monitoring/logs', icon: FileText, permission: '*', roles: ['SUPER_ADMIN'] }
        ]
      },
      {
        name: 'Audit Logs',
        href: '/audit',
        icon: ClipboardCheck,
        permission: '*',
        roles: ['SUPER_ADMIN'],
        description: 'System activity and audit trails',
        subItems: [
          { name: 'Audit Trail', href: '/audit', icon: ClipboardCheck, permission: '*', roles: ['SUPER_ADMIN'] },
          { name: 'User Activity', href: '/audit/users', icon: UsersIcon, permission: '*', roles: ['SUPER_ADMIN'] },
          { name: 'Security Events', href: '/audit/security', icon: Shield, permission: '*', roles: ['SUPER_ADMIN'] }
        ]
      }
    ]
  }
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

// Enhanced role normalization function
const normalizeRole = (role: string): string => {
  console.log('🔄 Normalizing role:', role)
  
  const roleMap: Record<string, string> = {
    // Handle case variations and database-specific values
    'super_admin': 'SUPER_ADMIN',
    'superadmin': 'SUPER_ADMIN',
    'SUPERADMIN': 'SUPER_ADMIN',
    
    'county_admin': 'COUNTY_ADMIN',
    'countyadmin': 'COUNTY_ADMIN',
    'COUNTYADMIN': 'COUNTY_ADMIN',
    
    'hospital_admin': 'HOSPITAL_ADMIN',
    'hospitaladmin': 'HOSPITAL_ADMIN',
    'HOSPITALADMIN': 'HOSPITAL_ADMIN',
    
    'doctor': 'DOCTOR',
    'DOCTOR': 'DOCTOR',
    
    'nurse': 'NURSE',
    'NURSE': 'NURSE',
    
    'triage_officer': 'TRIAGE_OFFICER',
    'triageofficer': 'TRIAGE_OFFICER',
    'TRIAGE_OFFICER': 'TRIAGE_OFFICER',
    'TRIAGEOFFICER': 'TRIAGE_OFFICER',
    
    'dispatcher': 'DISPATCHER',
    'DISPATCHER': 'DISPATCHER',
    
    'ambulance_driver': 'AMBULANCE_DRIVER',
    'ambulancedriver': 'AMBULANCE_DRIVER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'AMBULANCEDRIVER': 'AMBULANCE_DRIVER',
    
    'finance_officer': 'FINANCE_OFFICER',
    'financeofficer': 'FINANCE_OFFICER',
    'FINANCE_OFFICER': 'FINANCE_OFFICER',
    'FINANCEOFFICER': 'FINANCE_OFFICER',
    
    'lab_technician': 'LAB_TECHNICIAN',
    'labtechnician': 'LAB_TECHNICIAN',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    'LABTECHNICIAN': 'LAB_TECHNICIAN',
    
    'pharmacist': 'PHARMACIST',
    'PHARMACIST': 'PHARMACIST'
  }

  const normalized = roleMap[role.toLowerCase()] || role
  console.log('🎯 Final normalized role:', normalized)
  return normalized
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, hasPermission, logout } = useAuth()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    emergency: false,
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
  }, [pathname, isOpen, onClose])

  // Debug user and permissions
  useEffect(() => {
    console.log('🔍 Sidebar Debug Info:', {
      user: user,
      userRole: user?.role,
      userPermissions: user?.permissions,
      hasPermissionDashboard: hasPermission('dashboard.read'),
      hasPermissionTriage: hasPermission('triage.read'),
      hasPermissionPatients: hasPermission('patients.read'),
      hasPermissionAll: hasPermission('*')
    })
  }, [user, hasPermission])

  if (!user) {
    console.log('❌ Sidebar: No user found')
    return null
  }

  console.log('✅ Sidebar: User found, rendering sidebar')

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Enhanced helper function to check if user has access to an item
  const hasAccess = (item: any): boolean => {
    if (!user) {
      console.log('🚫 No user for access check')
      return false
    }

    // Normalize the user's role for comparison
    const userNormalizedRole = normalizeRole(user.role)
    const itemNormalizedRoles = item.roles.map((role: string) => normalizeRole(role))

    console.log('🔍 Access check:', {
      item: item.name,
      userRole: user.role,
      userNormalizedRole,
      itemRoles: item.roles,
      itemNormalizedRoles,
      permission: item.permission,
      userPermissions: user.permissions
    })

    // Check if user's role is allowed
    if (!itemNormalizedRoles.includes(userNormalizedRole)) {
      console.log(`🚫 Role access denied for ${item.name}: user role ${userNormalizedRole} not in`, itemNormalizedRoles)
      return false
    }
    
    // Check if user has required permissions
    if (item.permission && !hasPermission(item.permission)) {
      console.log(`🚫 Permission denied for ${item.name}: need ${item.permission}, user has`, user.permissions)
      return false
    }
    
    console.log(`✅ Access granted for ${item.name}`)
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
      console.log(`🚫 Hiding ${item.name} - no access or no accessible subitems`)
      return null
    }

    return (
      <div className="space-y-1">
        {level === 0 ? (
          <Collapsible
            open={expandedSections[item.name] || false}
            onOpenChange={() => toggleSection(item.name)}
            className="space-y-1"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between font-normal hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                  isActive && "bg-blue-50 text-blue-700 border border-blue-200 font-medium",
                  level > 0 && "pl-8"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-blue-600" : "text-muted-foreground"
                  )} />
                  <span>{item.name}</span>
                </div>
                {hasSubItems && filteredSubItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform text-muted-foreground",
                      expandedSections[item.name] && "rotate-180"
                    )}
                  />
                )}
              </Button>
            </CollapsibleTrigger>
            
            {hasSubItems && filteredSubItems.length > 0 && (
              <CollapsibleContent className="space-y-1">
                {filteredSubItems.map((subItem: any) => (
                  <NavigationItem key={subItem.href} item={subItem} level={level + 1} />
                ))}
              </CollapsibleContent>
            )}
          </Collapsible>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent group",
              isActive 
                ? "bg-blue-50 text-blue-700 border border-blue-200 font-medium" 
                : "text-muted-foreground hover:text-foreground",
              level === 1 && "pl-8",
              level === 2 && "pl-12",
              level >= 3 && "pl-16"
            )}
            onClick={() => {
              // Close sidebar on mobile when navigating
              if (isOpen && onClose) {
                onClose()
              }
            }}
          >
            <Icon className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-foreground"
            )} />
            <span>{item.name}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        )}
      </div>
    )
  }

  // Filter sections based on user role
  const filteredSections = Object.entries(navigationStructure).filter(([sectionKey, section]) => {
    const userNormalizedRole = normalizeRole(user.role)
    const sectionNormalizedRoles = section.roles.map((role: string) => normalizeRole(role))
    const hasSectionAccess = sectionNormalizedRoles.includes(userNormalizedRole)
    
    console.log(`🔍 Section ${sectionKey}: user role ${userNormalizedRole} in`, sectionNormalizedRoles, '=', hasSectionAccess)
    return hasSectionAccess
  })

  console.log('📋 Filtered sections for user:', filteredSections.map(([key]) => key))

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
        "flex h-full w-80 flex-col bg-gradient-to-b from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border-r border-slate-200/50 dark:border-slate-700/50 transition-transform duration-300 ease-in-out",
        "fixed lg:static inset-y-0 left-0 z-50 transform",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Enhanced Logo Section with Close Button */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 px-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Ambulance className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                NEH System
              </h2>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role?.replace('_', ' ').toLowerCase()} • {user.facilityId || 'National System'}
              </p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Enhanced Navigation */}
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            {filteredSections.length === 0 ? (
              <div className="text-center p-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No navigation items available for your role.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Role: {user.role}<br />
                  Permissions: {user.permissions?.join(', ') || 'None'}
                </p>
              </div>
            ) : (
              filteredSections.map(([sectionKey, section]) => {
                const filteredItems = section.items.filter((item: any) => 
                  hasAccess(item) || 
                  (item.subItems && item.subItems.some((subItem: any) => hasAccess(subItem)))
                )

                console.log(`📦 Section ${sectionKey}: ${filteredItems.length} filtered items`)

                if (filteredItems.length === 0) {
                  console.log(`🚫 Skipping section ${sectionKey} - no accessible items`)
                  return null
                }

                return (
                  <div key={sectionKey} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
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

        {/* Enhanced System Status & Emergency Hotline */}
        <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-4 space-y-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
          {/* System Status */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 p-4 space-y-3 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">System Status</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>API Response</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>45ms</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Database</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Connected</span>
              </div>
            </div>
          </div>

          {/* Emergency Hotline */}
          <div className="rounded-2xl bg-gradient-to-r from-red-50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/10 border border-red-200/50 dark:border-red-800/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Siren className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Emergency Hotline</p>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">999 / 112</p>
            <p className="text-xs text-red-700 dark:text-red-300">24/7 Dispatch Center</p>
          </div>

          {/* Quick Actions - Role Sensitive */}
          <div className="space-y-2">
            {hasPermission('dispatch.write') && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dispatch/new" onClick={onClose}>
                  <Ambulance className="h-4 w-4 mr-2" />
                  New Dispatch
                </Link>
              </Button>
            )}
            {hasPermission('triage.write') && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/triage/new" onClick={onClose}>
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Quick Triage
                </Link>
              </Button>
            )}
            
            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
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