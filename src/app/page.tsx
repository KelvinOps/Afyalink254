// src/app/page.tsx
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Ambulance, 
  Heart, 
  Shield, 
  Users, 
  MapPin, 
  Phone, 
  Clock,
  AlertTriangle,
  Stethoscope,
  Building,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Play,
  Star
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardContent } from '@/app/components/ui/card'
import EmergencyAlertBanner from '@/app/components/emergency/EmergencyAlertBanner'
import StatsCard from '@/app/components/dashboard/StatsCard'
import FeatureCard from '@/app/components/home/FeatureCard'
import EmergencyContactCard from '@/app/components/home/EmergencyContactCard'
import SystemStatusCard from '@/app/components/home/SystemStatusCard'

// Mock data for system stats
const systemStats = [
  { 
    label: 'Hospitals Connected', 
    value: '940+', 
    icon: Building, 
    change: '+12',
    changeType: 'positive' as const,
    color: 'bg-blue-500'
  },
  { 
    label: 'Active Emergencies', 
    value: '8', 
    icon: AlertTriangle, 
    change: '-2',
    changeType: 'negative' as const,
    color: 'bg-red-500'
  },
  { 
    label: 'Patients Today', 
    value: '2,847', 
    icon: Users, 
    change: '+247',
    changeType: 'positive' as const,
    color: 'bg-green-500'
  },
  { 
    label: 'Avg Response Time', 
    value: '4.2min', 
    icon: Clock, 
    change: '-0.8min',
    changeType: 'positive' as const,
    color: 'bg-purple-500'
  },
]

const features = [
  {
    icon: Ambulance,
    title: '999/911 Emergency Dispatch',
    description: 'Real-time ambulance coordination and emergency response across all 47 counties',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-red-600'
  },
  {
    icon: Shield,
    title: 'SHA/SHIF Integration',
    description: 'Seamless claims processing and financial management for universal healthcare coverage',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600'
  },
  {
    icon: Stethoscope,
    title: 'Digital Triage System',
    description: 'AI-powered patient prioritization and queue management for emergency departments',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-green-600'
  },
  {
    icon: MapPin,
    title: 'National Coverage',
    description: 'Comprehensive healthcare network serving urban and rural communities across Kenya',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-600'
  }
]

const emergencyContacts = [
  { 
    name: 'Emergency Hotline', 
    number: '999 / 112', 
    description: '24/7 National Dispatch',
    icon: Phone 
  },
  { 
    name: 'Ambulance Dispatch', 
    number: '0700 000 000', 
    description: 'Direct Ambulance Request',
    icon: Ambulance 
  },
  { 
    name: 'Poison Control', 
    number: '0100 000 000', 
    description: 'Toxicology Emergency',
    icon: AlertTriangle 
  },
]

const footerLinks = {
  quickLinks: [
    { label: 'Hospital Directory', href: '/hospitals' },
    { label: 'Emergency Info', href: '/emergency-info' },
    { label: 'SHA Claims', href: '/sha-claims' },
    { label: 'Resources', href: '/resources' },
  ],
  supportLinks: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Training', href: '/training' },
    { label: 'System Status', href: '/status' },
  ]
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [systemStatus, setSystemStatus] = useState({
    operational: true,
    uptime: '99.8%',
    responseTime: '4.2min'
  })

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      // Simulate emergency mode during certain hours for demo
      const hour = new Date().getHours()
      setIsEmergencyMode(hour >= 8 && hour <= 20) // 8 AM to 8 PM
      
      // Update system status periodically
      setSystemStatus(prev => ({
        ...prev,
        operational: Math.random() > 0.1, // 90% chance of being operational
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time function that handles server/client difference
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    
    return date.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Africa/Nairobi'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Emergency Alert Banner */}
      {isEmergencyMode && (
        <EmergencyAlertBanner 
          title="EMERGENCY MODE ACTIVE"
          message="System operating at maximum capacity"
        />
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-green-500/10"></div>
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm px-4 py-2 font-semibold animate-pulse">
                  National Emergency System
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Emergency Healthcare{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                    Coordination
                  </span>{' '}
                  for Kenya
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Comprehensive emergency healthcare system serving all 47 counties with 
                  real-time response capabilities, SHA/SHIF integration, and advanced 
                  telemedicine services.
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Card className="text-center p-4 border-blue-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="text-2xl font-bold text-blue-600">47</div>
                    <div className="text-sm text-gray-600">Counties</div>
                  </CardContent>
                </Card>
                <Card className="text-center p-4 border-green-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="text-2xl font-bold text-green-600">940+</div>
                    <div className="text-sm text-gray-600">Hospitals</div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all"
                  asChild
                >
                  <Link href="/login">
                    <Ambulance className="h-5 w-5 mr-2" />
                    Access Emergency Dashboard
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="text-gray-700 border-2 border-gray-300 hover:bg-gray-50 text-lg px-8 py-4 font-semibold hover:shadow-md transition-all"
                  asChild
                >
                  <Link href="/hospitals">
                    <Building className="h-5 w-5 mr-2" />
                    Find Hospitals
                  </Link>
                </Button>
              </div>

              {/* Emergency Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-red-800 font-semibold">Emergency Notice</p>
                    <p className="text-red-700 text-sm">
                      For life-threatening emergencies, always call{' '}
                      <strong className="text-red-900">999 or 112</strong> immediately
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <SystemStatusCard 
                currentTime={currentTime}
                formatTime={formatTime}
                systemStats={systemStats}
                isOperational={systemStatus.operational}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge 
              variant="outline" 
              className="border-blue-300 text-blue-700 bg-blue-50 text-sm px-4 py-2 mb-4 font-semibold animate-pulse"
            >
              Comprehensive Solutions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Addressing Kenya&apos;s Healthcare Challenges
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our integrated platform solves critical healthcare delivery issues across all 47 counties
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                bgColor={feature.bgColor}
                gradientFrom={feature.gradientFrom}
                gradientTo={feature.gradientTo}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contacts Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Emergency Contacts
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Immediate assistance available 24/7 across all counties
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {emergencyContacts.map((contact, index) => (
              <EmergencyContactCard
                key={index}
                name={contact.name}
                number={contact.number}
                description={contact.description}
                icon={contact.icon}
              />
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <Link href="/dispatch">
                  <Ambulance className="h-5 w-5 mr-2" />
                  Request Ambulance
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 text-lg px-8 py-4 font-semibold hover:shadow-md transition-all"
                asChild
              >
                <Link href="/emergency-info">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Emergency Procedures
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatsCard
              value="47/47"
              label="Counties Covered"
              color="text-blue-600"
              icon={<MapPin className="h-8 w-8 text-blue-500 opacity-50" />}
            />
            <StatsCard
              value="99.8%"
              label="System Uptime"
              color="text-green-600"
              icon={<TrendingUp className="h-8 w-8 text-green-500 opacity-50" />}
            />
            <StatsCard
              value="2.4M+"
              label="Patients Served"
              color="text-purple-600"
              icon={<Users className="h-8 w-8 text-purple-500 opacity-50" />}
            />
            <StatsCard
              value="4.2min"
              label="Avg Response Time"
              color="text-orange-600"
              icon={<Clock className="h-8 w-8 text-orange-500 opacity-50" />}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <Badge className="bg-blue-500 text-white border-blue-600 text-sm px-4 py-2 mb-4 font-semibold">
              Ready to Get Started?
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Join Kenya&apos;s Premier Emergency Healthcare Network
            </h2>
            
            <p className="text-xl text-gray-300">
              Access real-time coordination, SHA claims processing, and comprehensive emergency management tools
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <Link href="/register">
                  <Shield className="h-5 w-5 mr-2" />
                  Register Facility
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 text-lg px-8 py-4 font-semibold hover:shadow-md transition-all"
                asChild
              >
                <Link href="/contact">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>

            <div className="pt-8 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>MOH Certified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AfyaLink254</h3>
                  <p className="text-gray-400 text-sm">Emergency System • Kenya MOH</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Comprehensive emergency healthcare coordination system serving all 47 counties.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {footerLinks.quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href} 
                      className="hover:text-white transition-colors duration-200 flex items-center space-x-1"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {footerLinks.supportLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href} 
                      className="hover:text-white transition-colors duration-200 flex items-center space-x-1"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Emergency Contact */}
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <div className="space-y-2 text-sm">
                <div className="text-red-400 font-bold text-lg flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>999 / 112</span>
                </div>
                <p className="text-gray-400">24/7 Dispatch Center</p>
                <div className="pt-4">
                  <p className="text-gray-400 text-xs">
                    © {new Date().getFullYear()} Kenya Ministry of Health
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Last updated: {formatDate(new Date())}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}