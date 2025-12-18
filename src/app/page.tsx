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
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Card, CardContent } from './components/ui/card'

// Mock data for system stats
const systemStats = [
  { label: 'Hospitals Connected', value: '940+', icon: Building, change: '+12' },
  { label: 'Active Emergencies', value: '8', icon: AlertTriangle, change: '-2' },
  { label: 'Patients Today', value: '2,847', icon: Users, change: '+247' },
  { label: 'Avg Response Time', value: '4.2min', icon: Clock, change: '-0.8min' },
]

const features = [
  {
    icon: Ambulance,
    title: '999/911 Emergency Dispatch',
    description: 'Real-time ambulance coordination and emergency response across all 47 counties',
    color: 'text-red-600'
  },
  {
    icon: Shield,
    title: 'SHA/SHIF Integration',
    description: 'Seamless claims processing and financial management for universal healthcare coverage',
    color: 'text-blue-600'
  },
  {
    icon: Stethoscope,
    title: 'Digital Triage System',
    description: 'AI-powered patient prioritization and queue management for emergency departments',
    color: 'text-green-600'
  },
  {
    icon: MapPin,
    title: 'National Coverage',
    description: 'Comprehensive healthcare network serving urban and rural communities across Kenya',
    color: 'text-purple-600'
  }
]

const emergencyContacts = [
  { name: 'Emergency Hotline', number: '999 / 112', description: '24/7 National Dispatch' },
  { name: 'Ambulance Dispatch', number: '0700 000 000', description: 'Direct Ambulance Request' },
  { name: 'Poison Control', number: '0100 000 000', description: 'Toxicology Emergency' },
]

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      // Simulate emergency mode during certain hours for demo
      const hour = new Date().getHours()
      setIsEmergencyMode(hour >= 8 && hour <= 20) // 8 AM to 8 PM
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Emergency Alert Banner */}
      {isEmergencyMode && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 shadow-lg">
          <div className="container mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <p className="font-semibold text-lg text-center">
                <span className="font-bold">EMERGENCY MODE ACTIVE</span> - System operating at maximum capacity
              </p>
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-green-500/10"></div>
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                {/* Fixed Badge - Dark text on light background */}
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm px-4 py-2 font-semibold">
                  National Emergency System
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 font-heading leading-tight">
                  Emergency Healthcare{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Coordination</span> for Kenya
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Comprehensive emergency healthcare system serving all 47 counties with 
                  real-time response capabilities, SHA/SHIF integration, and advanced 
                  telemedicine services.
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">47</div>
                  <div className="text-sm text-gray-600">Counties</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-lg border border-green-100">
                  <div className="text-2xl font-bold text-green-600">940+</div>
                  <div className="text-sm text-gray-600">Hospitals</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg px-8 py-4 font-semibold shadow-lg" asChild>
                  <Link href="/login">
                    <Ambulance className="h-5 w-5 mr-2" />
                    Access Emergency Dashboard
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                
                <Button variant="outline" className="text-gray-700 border-2 border-gray-300 hover:bg-gray-50 text-lg px-8 py-4 font-semibold" asChild>
                  <Link href="/hospitals">
                    <Building className="h-5 w-5 mr-2" />
                    Find Hospitals
                  </Link>
                </Button>
              </div>

              {/* Emergency Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-semibold">Emergency Notice</p>
                    <p className="text-red-700 text-sm">
                      For life-threatening emergencies, always call <strong>999 or 112</strong> immediately
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 p-8">
                {/* System Status */}
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center shadow-2xl mx-auto mb-4">
                      <Heart className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">System Status</h3>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-green-600 font-semibold">All Systems Operational</span>
                    </div>
                  </div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {systemStats.map((stat, index) => (
                      <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                        <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.icon === AlertTriangle ? 'text-red-500' : 'text-blue-500'}`} />
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                        <div className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Current Time */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-lg font-mono font-bold text-gray-900">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-sm text-gray-600">EAT - Kenya Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            {/* Fixed Badge - Better contrast */}
            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-sm px-4 py-2 mb-4 font-semibold">
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
              <Card key={index} className="border border-gray-200 shadow-lg hover:shadow-xl group hover:scale-105 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
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
              <div key={index} className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <Phone className="h-12 w-12 mx-auto mb-4 text-white" />
                <h3 className="text-xl font-bold mb-2">{contact.name}</h3>
                <div className="text-2xl font-bold mb-2">{contact.number}</div>
                <p className="text-blue-100">{contact.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 font-semibold shadow-lg" asChild>
                <Link href="/dispatch">
                  <Ambulance className="h-5 w-5 mr-2" />
                  Request Ambulance
                </Link>
              </Button>
              
              <Button variant="outline" className="border-white text-black hover:bg-white/20 text-lg px-8 py-4 font-semibold" asChild>
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
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">47/47</div>
              <div className="text-gray-600">Counties Covered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">99.8%</div>
              <div className="text-gray-600">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">2.4M+</div>
              <div className="text-gray-600">Patients Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">4.2min</div>
              <div className="text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Fixed Badge - Better contrast for dark background */}
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
              <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg px-8 py-4 font-semibold shadow-lg" asChild>
                <Link href="/register">
                  <Shield className="h-5 w-5 mr-2" />
                  Register Facility
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" className="border-white text-black hover:bg-white/20 text-lg px-8 py-4 font-semibold" asChild>
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
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">NE</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Emergency System</h3>
                  <p className="text-gray-400 text-sm">Kenya MOH</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Comprehensive emergency healthcare coordination system serving all 47 counties.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/hospitals" className="hover:text-white transition-colors">Hospital Directory</Link></li>
                <li><Link href="/emergency-info" className="hover:text-white transition-colors">Emergency Info</Link></li>
                <li><Link href="/sha-claims" className="hover:text-white transition-colors">SHA Claims</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/training" className="hover:text-white transition-colors">Training</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <div className="space-y-2 text-sm">
                <div className="text-red-400 font-bold text-lg">999 / 112</div>
                <p className="text-gray-400">24/7 Dispatch Center</p>
                <div className="pt-4">
                  <p className="text-gray-400 text-xs">
                    © {new Date().getFullYear()} Kenya Ministry of Health
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