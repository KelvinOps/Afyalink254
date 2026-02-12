'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  FileText,
  Users,
  Building,
  Globe,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Instagram,
  MessageCircle,
  Download,
  AlertTriangle,
  Ambulance,
  Stethoscope,
  Truck,
  Video,
  BarChart3,
  Settings,
  Crown,
  Award,
  Star,
  CheckCircle,
  ArrowUp
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'

export function Footer() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Show scroll to top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Don't show footer on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null
  }

  const quickLinks = {
    emergency: [
      { name: 'Emergency Dispatch', href: '/dispatch', icon: Ambulance },
      { name: 'Triage Center', href: '/triage', icon: Stethoscope },
      { name: 'Patient Transfers', href: '/transfers', icon: Truck },
      { name: 'Active Emergencies', href: '/emergencies/active', icon: AlertTriangle }
    ],
    resources: [
      { name: 'Hospital Directory', href: '/hospitals', icon: Building },
      { name: 'Resource Management', href: '/resources', icon: FileText },
      { name: 'SHA Claims', href: '/sha-claims', icon: Shield },
      { name: 'Telemedicine', href: '/telemedicine', icon: Video }
    ],
    information: [
      { name: 'Analytics Dashboard', href: '/analytics', icon: BarChart3 },
      { name: 'Staff Directory', href: '/staff', icon: Users },
      { name: 'System Settings', href: '/settings', icon: Settings },
      { name: 'Help & Support', href: '/help', icon: MessageCircle }
    ]
  }

  const contactInfo = {
    emergency: [
      { label: 'Emergency Hotline', value: '999 / 112', icon: Phone, emergency: true },
      { label: 'Ambulance Dispatch', value: '0700 000 000', icon: Ambulance },
      { label: 'Poison Control', value: '0100 000 000', icon: AlertTriangle }
    ],
    support: [
      { label: 'Technical Support', value: 'support@healthcare.go.ke', icon: Mail },
      { label: 'SHA Claims Help', value: 'claims@sha.go.ke', icon: Shield },
      { label: 'General Inquiries', value: 'info@moh.go.ke', icon: MessageCircle }
    ],
    addresses: [
      { label: 'Ministry of Health', value: 'Afya House, Cathedral Road, Nairobi', icon: MapPin },
      { label: 'Emergency Operations', value: '24/7 National Dispatch Center', icon: Clock }
    ]
  }

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/moh_kenya', icon: Twitter },
    { name: 'Facebook', href: 'https://facebook.com/mohkenya', icon: Facebook },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/moh-kenya', icon: Linkedin },
    { name: 'YouTube', href: 'https://youtube.com/mohkenya', icon: Youtube },
    { name: 'Instagram', href: 'https://instagram.com/moh_kenya', icon: Instagram }
  ]

  const systemInfo = {
    version: 'v2.1.0',
    lastUpdate: '2024-01-15',
    uptime: '99.98%',
    activeUsers: '1,247',
    emergenciesToday: '43'
  }

  return (
    <footer className="bg-muted/50 border-t relative">
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-lg z-50 bg-background"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      {/* Main Footer Content */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Section - Quick Links and Contact Info */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-12">
          {/* Brand and Description */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">National Emergency Healthcare System</h3>
                <p className="text-sm text-muted-foreground">
                  Kenya Ministry of Health
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Comprehensive emergency healthcare coordination system serving all 47 counties 
              with real-time response capabilities and SHA/SHIF integration.
            </p>

            {/* System Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operational
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {systemInfo.activeUsers} online
              </Badge>
              <Badge variant="outline" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {systemInfo.emergenciesToday} today
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Ambulance className="h-4 w-4 text-red-600" />
                Emergency Services
              </h4>
              <ul className="space-y-2">
                {quickLinks.emergency.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <link.icon className="h-3 w-3" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                Resources
              </h4>
              <ul className="space-y-2">
                {quickLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <link.icon className="h-3 w-3" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                Information
              </h4>
              <ul className="space-y-2">
                {quickLinks.information.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <link.icon className="h-3 w-3" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-600" />
                Emergency Contacts
              </h4>
              <div className="space-y-3">
                {contactInfo.emergency.map((contact) => (
                  <div key={contact.label} className="flex items-center gap-3">
                    <contact.icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      contact.emergency ? "text-red-600" : "text-muted-foreground"
                    )} />
                    <div>
                      <p className="text-sm font-medium">{contact.label}</p>
                      <p className={cn(
                        "text-sm",
                        contact.emergency ? "text-red-600 font-bold" : "text-muted-foreground"
                      )}>
                        {contact.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Contacts */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Support Contacts</h4>
              <div className="space-y-2">
                {contactInfo.support.map((contact) => (
                  <div key={contact.label} className="flex items-center gap-2">
                    <contact.icon className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {contact.label}: {contact.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Middle Section - Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          {/* System Information */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              System Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">{systemInfo.version}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Update</p>
                <p className="font-medium">{systemInfo.lastUpdate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Uptime</p>
                <p className="font-medium text-green-600">{systemInfo.uptime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Time</p>
                <p className="font-medium">
                  {currentTime.toLocaleTimeString('en-KE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Africa/Nairobi'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* County Coverage */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              National Coverage
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Counties Served</span>
                <span className="font-medium">47/47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hospitals Connected</span>
                <span className="font-medium">940+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health Centers</span>
                <span className="font-medium">2,500+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ambulances Tracked</span>
                <span className="font-medium">1,200+</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Social */}
          <div className="space-y-4">
            <h4 className="font-semibold">Connect With Us</h4>
            
            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <Button
                  key={social.name}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <Link href={social.href} target="_blank" rel="noopener noreferrer">
                    <social.icon className="h-3 w-3" />
                  </Link>
                </Button>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/reports/export">
                  <Download className="h-3 w-3 mr-2" />
                  Export Reports
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/help">
                  <MessageCircle className="h-3 w-3 mr-2" />
                  Help & Documentation
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom Section - Legal and Copyright */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>&copy; {new Date().getFullYear()} Kenya Ministry of Health. All rights reserved.</span>
              
              {/* Legal Links */}
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link href="/accessibility" className="hover:text-foreground transition-colors">
                  Accessibility
                </Link>
              </div>
            </div>

            {/* Accreditation Badges */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                ISO 27001 Certified
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                MOH Certified
              </Badge>
            </div>
          </div>

          {/* Emergency Warning Banner */}
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-red-800">
                <strong>Emergency Notice:</strong> In case of life-threatening emergencies, 
                always call <strong>999 or 112</strong> immediately before using this system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time System Status Bar */}
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-muted-foreground">System Status:</span>
                <span className="font-medium">All Systems Operational</span>
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>SHA Integration: <span className="font-medium text-green-600">Active</span></span>
                <span>SMS Gateway: <span className="font-medium text-green-600">Online</span></span>
                <span>Database: <span className="font-medium text-green-600">Connected</span></span>
              </div>
            </div>

            {/* User Session Info */}
            {user && (
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Logged in as: <span className="font-medium">{user.name || user.email}</span></span>
                <span>Role: <span className="font-medium capitalize">{(user.role || 'user').replace('_', ' ').toLowerCase()}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}